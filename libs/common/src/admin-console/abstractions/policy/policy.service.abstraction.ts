import { Observable } from "rxjs";

import { ListResponse } from "../../../models/response/list.response";
import { UserId } from "../../../types/guid";
import { PolicyType } from "../../enums";
import { PolicyData } from "../../models/data/policy.data";
import { MasterPasswordPolicyOptions } from "../../models/domain/master-password-policy-options";
import { Policy } from "../../models/domain/policy";
import { ResetPasswordPolicyOptions } from "../../models/domain/reset-password-policy-options";
import { PolicyResponse } from "../../models/response/policy.response";

export abstract class PolicyService {
  /**
   * All policies for the active user from sync data.
   * May include policies that are disabled or otherwise do not apply to the user. You probably don't want this!
   * @deprecated Use {@link get$} or {@link getAll$} to get the PolicyType that you want. This will be removed in a later release.
   */
  policies$: Observable<Policy[]>;

  /**
   * @returns the first {@link Policy} found that applies to the active user.
   * A policy "applies" if it is enabled and the user is not exempt (e.g. because they are an Owner).
   * @param policyType the {@link PolicyType} to search for
   * @see {@link getAll$} if you need all policies of a given type
   */
  get$: (policyType: PolicyType) => Observable<Policy>;

  /**
   * @returns all {@link Policy} objects of a given type that apply to the specified user (or the active user if not specified).
   * A policy "applies" if it is enabled and the user is not exempt (e.g. because they are an Owner).
   * @param policyType the {@link PolicyType} to search for
   */
  getAll$: (policyType: PolicyType, userId?: UserId) => Observable<Policy[]>;

  /**
   * Returns all policies of a given type even if they are disabled or do not apply to the user. You probably don't want this!
   * @deprecated use getAll$ instead which filters out policies that do not apply.
   */
  getAll: (policyType: PolicyType) => Promise<Policy[]>;

  /**
   * @returns true if a policy of the specified type applies to the active user, otherwise false.
   * A policy "applies" if it is enabled and the user is not exempt (e.g. because they are an Owner).
   * This does not take into account the policy's configuration - if that is important, use {@link getAll$} to get the
   * {@link Policy} objects and then filter by Policy.data.
   */
  policyAppliesToActiveUser$: (policyType: PolicyType) => Observable<boolean>;

  /**
   * @deprecated Use policyAppliesToActiveUser$ instead
   */
  policyAppliesToUser: (policyType: PolicyType) => Promise<boolean>;

  // Policy specific interfaces

  /**
   * Combines all Master Password policies that apply to the user.
   * @returns a set of options which represent the minimum Master Password settings that the user must
   * comply with in order to comply with **all** Master Password policies.
   */
  masterPasswordPolicyOptions$: (policies?: Policy[]) => Observable<MasterPasswordPolicyOptions>;

  /**
   * Evaluates whether a proposed Master Password complies with all Master Password policies that apply to the user.
   */
  evaluateMasterPassword: (
    passwordStrength: number,
    newPassword: string,
    enforcedPolicyOptions?: MasterPasswordPolicyOptions,
  ) => boolean;

  /**
   * @returns Reset Password policy options for the specified organization and a boolean indicating whether the policy
   * is enabled
   */
  getResetPasswordPolicyOptions: (
    policies: Policy[],
    orgId: string,
  ) => [ResetPasswordPolicyOptions, boolean];

  // Helpers

  /**
   * Instantiates {@link Policy} objects from {@link PolicyResponse} objects.
   */
  mapPolicyFromResponse: (policyResponse: PolicyResponse) => Policy;

  /**
   * Instantiates {@link Policy} objects from {@link ListResponse<PolicyResponse>} objects.
   */
  mapPoliciesFromToken: (policiesResponse: ListResponse<PolicyResponse>) => Policy[];
}

export abstract class InternalPolicyService extends PolicyService {
  upsert: (policy: PolicyData) => Promise<void>;
  replace: (policies: { [id: string]: PolicyData }) => Promise<void>;
  clear: (userId?: string) => Promise<void>;
}
