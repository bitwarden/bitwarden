import { matches, mock } from "jest-mock-extended";
import { BehaviorSubject, firstValueFrom, of, timeout } from "rxjs";

import { AccountInfo, AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { AuthService } from "@bitwarden/common/auth/abstractions/auth.service";
import { AvatarService } from "@bitwarden/common/auth/abstractions/avatar.service";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";
import { EnvironmentService } from "@bitwarden/common/platform/abstractions/environment.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";
import { UserId } from "@bitwarden/common/types/guid";

import { AccountSwitcherService } from "./account-switcher.service";

describe("AccountSwitcherService", () => {
  const accountsSubject = new BehaviorSubject<Record<UserId, AccountInfo>>(null);
  const activeAccountSubject = new BehaviorSubject<{ id: UserId } & AccountInfo>(null);

  const accountService = mock<AccountService>();
  const avatarService = mock<AvatarService>();
  const messagingService = mock<MessagingService>();
  const environmentService = mock<EnvironmentService>();
  const logService = mock<LogService>();
  const authService = mock<AuthService>();

  let accountSwitcherService: AccountSwitcherService;

  beforeEach(() => {
    jest.resetAllMocks();

    accountService.accounts$ = accountsSubject;
    accountService.activeAccount$ = activeAccountSubject;

    // default all accounts to be unlocked
    authService.authStatusFor$.mockReturnValue(new BehaviorSubject(AuthenticationStatus.Unlocked));

    accountSwitcherService = new AccountSwitcherService(
      accountService,
      avatarService,
      messagingService,
      environmentService,
      logService,
      authService,
    );
  });

  describe("availableAccounts$", () => {
    it("should return all accounts and an add account option when accounts are less than 5", async () => {
      const user1AccountInfo: AccountInfo = {
        name: "Test User 1",
        email: "test1@email.com",
      };

      avatarService.getUserAvatarColor$.mockReturnValue(of("#cccccc"));
      accountsSubject.next({
        "1": user1AccountInfo,
      } as Record<UserId, AccountInfo>);

      activeAccountSubject.next(Object.assign(user1AccountInfo, { id: "1" as UserId }));

      const accounts = await firstValueFrom(
        accountSwitcherService.availableAccounts$.pipe(timeout(20)),
      );
      expect(accounts).toHaveLength(2);
      expect(accounts[0].id).toBe("1");
      expect(accounts[0].isActive).toBeTruthy();

      expect(accounts[1].id).toBe("addAccount");
      expect(accounts[1].isActive).toBeFalsy();
    });

    it.each([5, 6])(
      "should return only accounts if there are %i accounts",
      async (numberOfAccounts) => {
        const seedAccounts: Record<UserId, AccountInfo> = {};
        for (let i = 0; i < numberOfAccounts; i++) {
          seedAccounts[`${i}` as UserId] = {
            email: `test${i}@email.com`,
            name: "Test User ${i}",
          };
        }
        avatarService.getUserAvatarColor$.mockReturnValue(of("#cccccc"));
        accountsSubject.next(seedAccounts);
        activeAccountSubject.next(
          Object.assign(seedAccounts["1" as UserId], { id: "1" as UserId }),
        );

        const accounts = await firstValueFrom(accountSwitcherService.availableAccounts$);

        expect(accounts).toHaveLength(numberOfAccounts);
        accounts.forEach((account) => {
          expect(account.id).not.toBe("addAccount");
        });
      },
    );

    it("only displays accounts that are not logged out", async () => {
      const user1AccountInfo: AccountInfo = {
        name: "Test User 1",
        email: "",
      };
      accountsSubject.next({
        "1": user1AccountInfo,
      } as Record<UserId, AccountInfo>);
      authService.authStatusFor$.mockReturnValueOnce(of(AuthenticationStatus.LoggedOut));

      const accounts = await firstValueFrom(
        accountSwitcherService.availableAccounts$.pipe(timeout(20)),
      );

      // Add account only
      expect(accounts).toHaveLength(1);
      expect(accounts[0].id).toBe("addAccount");
    });
  });

  describe("selectAccount", () => {
    it("initiates an add account logic when add account is selected", async () => {
      let listener: (
        message: { command: string; userId: string },
        sender: unknown,
        sendResponse: unknown,
      ) => void = null;
      jest.spyOn(chrome.runtime.onMessage, "addListener").mockImplementation((addedListener) => {
        listener = addedListener;
      });

      const removeListenerSpy = jest.spyOn(chrome.runtime.onMessage, "removeListener");

      const selectAccountPromise = accountSwitcherService.selectAccount("addAccount");

      expect(listener).not.toBeNull();
      listener({ command: "switchAccountFinish", userId: null }, undefined, undefined);

      await selectAccountPromise;

      expect(accountService.switchAccount).toBeCalledWith(null);

      expect(removeListenerSpy).toBeCalledTimes(1);
    });

    it("initiates an account switch with an account id", async () => {
      let listener: (
        message: { command: string; userId: string },
        sender: unknown,
        sendResponse: unknown,
      ) => void;
      jest.spyOn(chrome.runtime.onMessage, "addListener").mockImplementation((addedListener) => {
        listener = addedListener;
      });

      const removeListenerSpy = jest.spyOn(chrome.runtime.onMessage, "removeListener");

      const selectAccountPromise = accountSwitcherService.selectAccount("1");

      listener({ command: "switchAccountFinish", userId: "1" }, undefined, undefined);

      await selectAccountPromise;

      expect(accountService.switchAccount).toBeCalledWith("1");
      expect(messagingService.send).toBeCalledWith(
        "switchAccount",
        matches((payload) => {
          return payload.userId === "1";
        }),
      );
      expect(removeListenerSpy).toBeCalledTimes(1);
    });
  });
});
