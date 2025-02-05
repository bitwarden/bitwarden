// FIXME: Update this file to be type safe and remove this and next line
// @ts-strict-ignore
import { Observable } from "rxjs";

import { UserId } from "../../../types/guid";
import { PolicyType } from "../../enums";
import { PolicyData } from "../../models/data/policy.data";
import { MasterPasswordPolicyOptions } from "../../models/domain/master-password-policy-options";
import { Policy } from "../../models/domain/policy";
import { ResetPasswordPolicyOptions } from "../../models/domain/reset-password-policy-options";

export abstract class vNextPolicyService {
  /**
   * @returns all {@link Policy} objects that apply to the specified user.
   * A policy "applies" if it is enabled and the user is not exempt (e.g. because they are an Owner).
   * @param userId the {@link UserId} to search against
   */
  policies$: (userId: UserId) => Observable<Policy[]>;

  /**
   * @returns all {@link Policy} objects of a given type that apply to the specified user.
   * A policy "applies" if it is enabled and the user is not exempt (e.g. because they are an Owner).
   * @param policyType the {@link PolicyType} to search for
   * @param userId the {@link UserId} to search against
   */
  policiesByType$: (policyType: PolicyType, userId: UserId) => Observable<Policy[]>;

  /**
   * @returns true if a policy of the specified type applies to the specified user, otherwise false.
   * A policy "applies" if it is enabled and the user is not exempt (e.g. because they are an Owner).
   * This does not take into account the policy's configuration - if that is important, use {@link policiesByType$} to get the
   * {@link Policy} objects and then filter by Policy.data.
   */
  policyAppliesToUser$: (policyType: PolicyType, userId: UserId) => Observable<boolean>;

  // Policy specific interfaces

  /**
   * Combines all Master Password policies that apply to the user.
   * @returns a set of options which represent the minimum Master Password settings that the user must
   * comply with in order to comply with **all** Master Password policies.
   */
  masterPasswordPolicyOptions$: (
    userId: UserId,
    policies?: Policy[],
  ) => Observable<MasterPasswordPolicyOptions>;

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
}

export abstract class vNextInternalPolicyService extends vNextPolicyService {
  upsert: (policy: PolicyData, userId: UserId) => Promise<void>;
  replace: (policies: { [id: string]: PolicyData }, userId: UserId) => Promise<void>;
}
