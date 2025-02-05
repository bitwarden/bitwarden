// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore
import { combineLatest, map, Observable, of, switchMap } from "rxjs";

import { StateProvider } from "../../../platform/state";
import { UserId } from "../../../types/guid";
import { OrganizationService } from "../../abstractions/organization/organization.service.abstraction";
import { vNextInternalPolicyService } from "../../abstractions/policy/vnext-policy.service.abstraction";
import { OrganizationUserStatusType, PolicyType } from "../../enums";
import { PolicyData } from "../../models/data/policy.data";
import { MasterPasswordPolicyOptions } from "../../models/domain/master-password-policy-options";
import { Organization } from "../../models/domain/organization";
import { Policy } from "../../models/domain/policy";
import { ResetPasswordPolicyOptions } from "../../models/domain/reset-password-policy-options";

import { POLICIES } from "./vnext-policy-state";

const policyRecordToArray = (policiesMap: { [id: string]: PolicyData }) =>
  Object.values(policiesMap || {}).map((f) => new Policy(f));

export function getFirstPolicy(policies: Observable<Policy[]>): Observable<Policy> {
  return policies.pipe(map((p) => p.at(0) ?? null));
}

export class vNextPolicyService implements vNextInternalPolicyService {
  constructor(
    private stateProvider: StateProvider,
    private organizationService: OrganizationService,
  ) {}

  private policyState(userId: UserId) {
    return this.stateProvider.getUser(userId, POLICIES);
  }

  policies$(userId: UserId) {
    const policies$ = this.policyState(userId).state$.pipe(
      map((policyData) => policyRecordToArray(policyData)),
    );

    const organizations$ = this.stateProvider.activeUserId$.pipe(
      switchMap((userId) => this.organizationService.organizations$(userId)),
    );

    return combineLatest([policies$, organizations$]).pipe(
      map(([policies, organization]) => this.enforcedPolicyFilter(policies, organization)),
    );
  }

  policiesByType$(policyType: PolicyType, userId: UserId) {
    const filteredPolicies$ = this.policyState(userId).state$.pipe(
      map((policyData) => policyRecordToArray(policyData)),
      map((policies) => policies.filter((p) => p.type === policyType)),
    );

    const organizations$ = this.stateProvider.activeUserId$.pipe(
      switchMap((userId) => this.organizationService.organizations$(userId)),
    );

    return combineLatest([filteredPolicies$, organizations$]).pipe(
      map(([policies, organizations]) => this.enforcedPolicyFilter(policies, organizations)),
    );
  }

  policyAppliesToUser$(policyType: PolicyType, userId: UserId) {
    return this.policiesByType$(policyType, userId).pipe(map((policies) => !!policies?.at(0)));
  }

  private enforcedPolicyFilter(policies: Policy[], organizations: Organization[]) {
    const orgDict = Object.fromEntries(organizations.map((o) => [o.id, o]));
    return policies.filter((policy) => {
      const organization = orgDict[policy.organizationId];

      // This shouldn't happen, i.e. the user should only have policies for orgs they are a member of
      // But if it does, err on the side of enforcing the policy
      if (organization == null) {
        return true;
      }

      return (
        policy.enabled &&
        organization.status >= OrganizationUserStatusType.Accepted &&
        organization.usePolicies &&
        !this.isExemptFromPolicy(policy.type, organization)
      );
    });
  }

  masterPasswordPolicyOptions$(
    userId: UserId,
    policies: Policy[],
  ): Observable<MasterPasswordPolicyOptions> {
    const policies$ = policies ? of(policies) : this.policies$(userId);
    return policies$.pipe(
      map((obsPolicies) => {
        let enforcedOptions: MasterPasswordPolicyOptions = null;
        const filteredPolicies = obsPolicies.filter((p) => p.type === PolicyType.MasterPassword);

        if (filteredPolicies == null || filteredPolicies.length === 0) {
          return enforcedOptions;
        }

        filteredPolicies.forEach((currentPolicy) => {
          if (!currentPolicy.enabled || currentPolicy.data == null) {
            return;
          }

          if (enforcedOptions == null) {
            enforcedOptions = new MasterPasswordPolicyOptions();
          }

          if (
            currentPolicy.data.minComplexity != null &&
            currentPolicy.data.minComplexity > enforcedOptions.minComplexity
          ) {
            enforcedOptions.minComplexity = currentPolicy.data.minComplexity;
          }

          if (
            currentPolicy.data.minLength != null &&
            currentPolicy.data.minLength > enforcedOptions.minLength
          ) {
            enforcedOptions.minLength = currentPolicy.data.minLength;
          }

          if (currentPolicy.data.requireUpper) {
            enforcedOptions.requireUpper = true;
          }

          if (currentPolicy.data.requireLower) {
            enforcedOptions.requireLower = true;
          }

          if (currentPolicy.data.requireNumbers) {
            enforcedOptions.requireNumbers = true;
          }

          if (currentPolicy.data.requireSpecial) {
            enforcedOptions.requireSpecial = true;
          }

          if (currentPolicy.data.enforceOnLogin) {
            enforcedOptions.enforceOnLogin = true;
          }
        });

        return enforcedOptions;
      }),
    );
  }

  evaluateMasterPassword(
    passwordStrength: number,
    newPassword: string,
    enforcedPolicyOptions: MasterPasswordPolicyOptions,
  ): boolean {
    if (enforcedPolicyOptions == null) {
      return true;
    }

    if (
      enforcedPolicyOptions.minComplexity > 0 &&
      enforcedPolicyOptions.minComplexity > passwordStrength
    ) {
      return false;
    }

    if (
      enforcedPolicyOptions.minLength > 0 &&
      enforcedPolicyOptions.minLength > newPassword.length
    ) {
      return false;
    }

    if (enforcedPolicyOptions.requireUpper && newPassword.toLocaleLowerCase() === newPassword) {
      return false;
    }

    if (enforcedPolicyOptions.requireLower && newPassword.toLocaleUpperCase() === newPassword) {
      return false;
    }

    if (enforcedPolicyOptions.requireNumbers && !/[0-9]/.test(newPassword)) {
      return false;
    }

    // eslint-disable-next-line
    if (enforcedPolicyOptions.requireSpecial && !/[!@#$%\^&*]/g.test(newPassword)) {
      return false;
    }

    return true;
  }

  getResetPasswordPolicyOptions(
    policies: Policy[],
    orgId: string,
  ): [ResetPasswordPolicyOptions, boolean] {
    const resetPasswordPolicyOptions = new ResetPasswordPolicyOptions();

    if (policies == null || orgId == null) {
      return [resetPasswordPolicyOptions, false];
    }

    const policy = policies.find(
      (p) => p.organizationId === orgId && p.type === PolicyType.ResetPassword && p.enabled,
    );
    resetPasswordPolicyOptions.autoEnrollEnabled = policy?.data?.autoEnrollEnabled ?? false;

    return [resetPasswordPolicyOptions, policy?.enabled ?? false];
  }

  async upsert(policy: PolicyData, userId: UserId): Promise<void> {
    await this.policyState(userId).update((policies) => {
      policies ??= {};
      policies[policy.id] = policy;
      return policies;
    });
  }

  async replace(policies: { [id: string]: PolicyData }, userId: UserId): Promise<void> {
    await this.stateProvider.setUserState(POLICIES, policies, userId);
  }

  /**
   * Determines whether an orgUser is exempt from a specific policy because of their role
   * Generally orgUsers who can manage policies are exempt from them, but some policies are stricter
   */
  private isExemptFromPolicy(policyType: PolicyType, organization: Organization) {
    switch (policyType) {
      case PolicyType.MaximumVaultTimeout:
        // Max Vault Timeout applies to everyone except owners
        return organization.isOwner;
      case PolicyType.PasswordGenerator:
        // password generation policy applies to everyone
        return false;
      case PolicyType.PersonalOwnership:
        // individual vault policy applies to everyone except admins and owners
        return organization.isAdmin;
      case PolicyType.FreeFamiliesSponsorshipPolicy:
        // free Bitwarden families policy applies to everyone
        return false;
      default:
        return organization.canManagePolicies;
    }
  }
}
