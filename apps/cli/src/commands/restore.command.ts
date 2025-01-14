import { firstValueFrom, map } from "rxjs";

import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";

import { Response } from "../models/response";

export class RestoreCommand {
  constructor(
    private cipherService: CipherService,
    private accountService: AccountService,
  ) {}

  async run(object: string, id: string): Promise<Response> {
    if (id != null) {
      id = id.toLowerCase();
    }

    switch (object.toLowerCase()) {
      case "item":
        return await this.restoreCipher(id);
      default:
        return Response.badRequest("Unknown object.");
    }
  }

  private async restoreCipher(id: string) {
    const activeUserId = await firstValueFrom(
      this.accountService.activeAccount$.pipe(map((a) => a?.id)),
    );
    if (activeUserId == null) {
      return Response.error("No active user id found.");
    }

    const cipher = await this.cipherService.get(id, activeUserId);
    if (cipher == null) {
      return Response.notFound();
    }
    if (cipher.deletedDate == null) {
      return Response.badRequest("Cipher is not in trash.");
    }

    try {
      await this.cipherService.restoreWithServer(id, activeUserId);
      return Response.success();
    } catch (e) {
      return Response.error(e);
    }
  }
}
