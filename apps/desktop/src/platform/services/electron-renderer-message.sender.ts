import { MessageSender, CommandDefinition } from "@bitwarden/common/platform/messaging";
import { getCommand } from "@bitwarden/common/platform/messaging/internal";

export class ElectronRendererMessageSender implements MessageSender {
  send<T extends object>(
    commandDefinition: CommandDefinition<T> | string,
    payload: object | T = {},
  ): void {
    const command = getCommand(commandDefinition);
    ipc.platform.sendMessage(Object.assign({}, { command: command }, payload));
  }
}
