import { MockProxy, mock } from "jest-mock-extended";
import { BehaviorSubject } from "rxjs";

import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { SdkService } from "@bitwarden/common/platform/abstractions/sdk/sdk.service";
import { DialogService, ToastService } from "@bitwarden/components";
import * as sdkInternal from "@bitwarden/sdk-internal";

import { DefaultSshImportPromptService } from "./default-ssh-import-prompt.service";
import { SshKeyData } from "@bitwarden/common/vault/models/data/ssh-key.data";
import { SshKeyApi } from "@bitwarden/common/vault/models/api/ssh-key.api";

jest.mock("@bitwarden/sdk-internal");

const exampleSshKey = {
  private_key: "private_key",
  public_key: "public_key",
  key_fingerprint: "key_fingerprint",
} as sdkInternal.SshKey;

const exampleSshKeyData = new SshKeyData(
  new SshKeyApi({
    publicKey: exampleSshKey.public_key,
    privateKey: exampleSshKey.private_key,
    keyFingerprint: exampleSshKey.key_fingerprint,
  }),
);

describe("SshImportPromptService", () => {
  let sshImportPromptService: DefaultSshImportPromptService;

  let dialogService: MockProxy<DialogService>;
  let sdkService: MockProxy<SdkService>;
  let toastService: MockProxy<ToastService>;
  let platformUtilsService: MockProxy<PlatformUtilsService>;
  let i18nService: MockProxy<I18nService>;

  beforeEach(() => {
    dialogService = mock<DialogService>();
    sdkService = mock<SdkService>();
    toastService = mock<ToastService>();
    platformUtilsService = mock<PlatformUtilsService>();
    i18nService = mock<I18nService>();

    sdkService.client$ = new BehaviorSubject(null);

    sshImportPromptService = new DefaultSshImportPromptService(
      dialogService,
      sdkService,
      toastService,
      platformUtilsService,
      i18nService,
    );
  });

  describe("importSshKeyFromClipboard()", () => {
    it("imports unencrypted ssh key", async () => {
      jest.spyOn(sdkInternal, "import_ssh_key").mockReturnValue(exampleSshKey);
      platformUtilsService.readFromClipboard.mockResolvedValue("ssh_key");
      expect(await sshImportPromptService.importSshKeyFromClipboard()).toEqual(exampleSshKeyData);
    });

    it("requests password for encrypted ssh key", async () => {
      jest
        .spyOn(sdkInternal, "import_ssh_key")
        .mockImplementationOnce(() => {
          throw { variant: "PasswordRequired" };
        })
        .mockImplementationOnce(() => exampleSshKey);
      dialogService.open.mockReturnValue({ closed: new BehaviorSubject("password") } as any);
      platformUtilsService.readFromClipboard.mockResolvedValue("ssh_key");

      expect(await sshImportPromptService.importSshKeyFromClipboard()).toEqual(exampleSshKeyData);
      expect(dialogService.open).toHaveBeenCalled();
    });

    it("cancels when no password was provided", async () => {
      jest
        .spyOn(sdkInternal, "import_ssh_key")
        .mockImplementationOnce(() => {
          throw { variant: "PasswordRequired" };
        })
        .mockImplementationOnce(() => exampleSshKey);
      dialogService.open.mockReturnValue({ closed: new BehaviorSubject("") } as any);
      platformUtilsService.readFromClipboard.mockResolvedValue("ssh_key");

      expect(await sshImportPromptService.importSshKeyFromClipboard()).toEqual(null);
      expect(dialogService.open).toHaveBeenCalled();
    });
  });
});
