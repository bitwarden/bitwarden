import { AuthService } from "@bitwarden/common/auth/abstractions/auth.service";

export abstract class ProcessReloadServiceAbstraction {
  abstract startProcessReload(authService: AuthService): Promise<void>;
  abstract cancelProcessReload(): void;
}
