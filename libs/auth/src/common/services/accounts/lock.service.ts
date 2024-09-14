import { combineLatest, firstValueFrom, map } from "rxjs";

import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { VaultTimeoutService } from "@bitwarden/common/services/vault-timeout/vault-timeout.service";
import { UserId } from "@bitwarden/common/types/guid";

export abstract class LockService {
  /**
   * Locks all accounts.
   */
  abstract lockAll(): Promise<void>;
}

export class DefaultLockService implements LockService {
  constructor(
    private readonly accountService: AccountService,
    private readonly vaultTimeoutService: VaultTimeoutService,
  ) {}

  async lockAll() {
    const accounts = await firstValueFrom(
      combineLatest([this.accountService.activeAccount$, this.accountService.accounts$]).pipe(
        map(([activeAccount, accounts]) => {
          const otherAccounts = Object.keys(accounts) as UserId[];

          if (activeAccount == null) {
            return { activeAccount: null, otherAccounts: otherAccounts };
          }

          return {
            activeAccount: activeAccount.id,
            otherAccounts: otherAccounts.filter((accountId) => accountId !== activeAccount.id),
          };
        }),
      ),
    );

    // Always prefer to do the active account first
    if (accounts.activeAccount != null) {
      await this.vaultTimeoutService.lock(accounts.activeAccount);
    }

    for (const otherAccount of accounts.otherAccounts) {
      await this.vaultTimeoutService.lock(otherAccount);
    }
  }
}
