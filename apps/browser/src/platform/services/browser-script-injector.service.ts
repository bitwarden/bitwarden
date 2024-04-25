import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";

import { BrowserApi } from "../browser/browser-api";

import {
  CommonScriptInjectionDetails,
  ScriptInjectionConfig,
  ScriptInjectorService,
} from "./abstractions/script-injector.service";

export class BrowserScriptInjectorService extends ScriptInjectorService {
  constructor(
    private readonly platformUtilsService: PlatformUtilsService,
    private readonly logService: LogService,
  ) {
    super();
  }

  /**
   * Facilitates the injection of a script into a tab context. Will adjust
   * behavior between manifest v2 and v3 based on the passed configuration.
   *
   * @param config - The configuration for the script injection.
   */
  async inject(config: ScriptInjectionConfig): Promise<void> {
    const { tabId, injectDetails, mv3Details } = config;
    const file = this.getScriptFile(config);
    if (!file) {
      throw new Error("No file specified for script injection");
    }

    const injectionDetails = this.buildInjectionDetails(injectDetails, file);

    if (BrowserApi.isManifestVersion(3)) {
      try {
        await BrowserApi.executeScriptInTab(tabId, injectionDetails, {
          world: mv3Details?.world ?? "ISOLATED",
        });
      } catch ({ message }) {
        // Swallow errors for host permissions, since this is believed to be a Manifest V3 Chrome bug
        // @TODO remove when the bugged behaviour is resolved
        if (
          message ===
          "Cannot access contents of the page. Extension manifest must request permission to access the respective host."
        ) {
          if (this.platformUtilsService.isDev()) {
            this.logService.warning(
              `BrowserApi.executeScriptInTab exception for ${injectDetails.file} in tab ${tabId}: ${message}`,
            );
          }
        }
      }

      return;
    }

    await BrowserApi.executeScriptInTab(tabId, injectionDetails);
  }

  /**
   * Retrieves the script file to inject based on the configuration.
   *
   * @param config - The configuration for the script injection.
   */
  private getScriptFile(config: ScriptInjectionConfig): string {
    const { injectDetails, mv2Details, mv3Details } = config;

    if (BrowserApi.isManifestVersion(3)) {
      return mv3Details?.file ?? injectDetails?.file;
    }

    return mv2Details?.file ?? injectDetails?.file;
  }

  /**
   * Builds the injection details for the script injection.
   *
   * @param injectDetails - The details for the script injection.
   * @param file - The file to inject.
   */
  private buildInjectionDetails(
    injectDetails: CommonScriptInjectionDetails,
    file: string,
  ): chrome.tabs.InjectDetails {
    const { frame, runAt } = injectDetails;
    const injectionDetails: chrome.tabs.InjectDetails = { file };

    if (runAt) {
      injectionDetails.runAt = runAt;
    }

    if (!frame) {
      return { ...injectionDetails, frameId: 0 };
    }

    if (frame !== "all_frames") {
      return { ...injectionDetails, frameId: frame };
    }

    return { ...injectionDetails, allFrames: true };
  }
}
