import { BasePolicy } from "../admin-console/organizations/policies";

export class PolicyListService {
  private policies: BasePolicy[] = [];

  addPolicies(policies: BasePolicy[]) {
    this.policies.push(...policies);
  }

  getPolicies(): BasePolicy[] {
    return this.policies;
  }
}
