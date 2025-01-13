import { ipcMain } from "electron";

import { ConsoleLogService } from "@bitwarden/common/platform/services/console-log.service";
import { UserId } from "@bitwarden/common/types/guid";

import { BiometricMessage, BiometricAction } from "../../types/biometric-message";

import { DesktopBiometricsService } from "./desktop.biometrics.service";

export class MainBiometricsIPCListener {
  constructor(
    private biometricService: DesktopBiometricsService,
    private logService: ConsoleLogService,
  ) {}

  init() {
    ipcMain.handle("biometric", async (event: any, message: BiometricMessage) => {
      try {
        if (!message.action) {
          return;
        }

        switch (message.action) {
          case BiometricAction.Authenticate:
            return await this.biometricService.authenticateWithBiometrics();
          case BiometricAction.GetStatus:
            return await this.biometricService.getBiometricsStatus();
          case BiometricAction.UnlockForUser:
            return await this.biometricService.unlockWithBiometricsForUser(
              message.userId as UserId,
            );
          case BiometricAction.GetStatusForUser:
            return await this.biometricService.getBiometricsStatusForUser(message.userId as UserId);
          case BiometricAction.SetKeyForUser:
            return await this.biometricService.setBiometricProtectedUnlockKeyForUser(
              message.userId as UserId,
              message.key,
            );
          case BiometricAction.RemoveKeyForUser:
            return await this.biometricService.deleteBiometricUnlockKeyForUser(
              message.userId as UserId,
            );
          case BiometricAction.SetClientKeyHalf:
            return await this.biometricService.setClientKeyHalfForUser(
              message.userId as UserId,
              message.key,
            );
          case BiometricAction.Setup:
            return await this.biometricService.setupBiometrics();

          case BiometricAction.SetShouldAutoprompt:
            return await this.biometricService.setShouldAutopromptNow(message.data as boolean);
          case BiometricAction.GetShouldAutoprompt:
            return await this.biometricService.getShouldAutopromptNow();
          default:
            return;
        }
      } catch (e) {
        this.logService.info(e);
      }
    });
  }
}
