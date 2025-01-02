import { CipherId, OrganizationId } from "@bitwarden/common/src/types/guid";
import { SecurityTaskStatus } from "@bitwarden/vault/src/tasks/enums";
import { SecurityTask } from "@bitwarden/vault/src/tasks/models";

/**
 * Request type for creating tasks.
 * @property cipherId - The ID of the cipher to create the task for.
 * @property type - The type of task to create. Currently defined as "updateAtRiskCredential".
 */
export type CreateTasksRequest = Readonly<{
  cipherId: CipherId;
  type: "updateAtRiskCredential";
}>;

export abstract class AdminTaskService {
  /**
   * Retrieves all tasks for a given organization.
   * @param organizationId - The ID of the organization to retrieve tasks for.
   * @param status - Optional. The status of the tasks to retrieve.
   */
  abstract getAllTasks(
    organizationId: OrganizationId,
    status?: SecurityTaskStatus | undefined,
  ): Promise<SecurityTask[]>;

  /**
   * Creates multiple tasks for a given organization and sends out notifications to applicable users.
   * @param organizationId - The ID of the organization to create tasks for.
   * @param tasks - The tasks to create.
   */
  abstract bulkCreateTasks(
    organizationId: OrganizationId,
    tasks: CreateTasksRequest[],
  ): Promise<void>;
}
