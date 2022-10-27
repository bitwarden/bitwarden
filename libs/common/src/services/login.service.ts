import { LoginService as LoginServiceAbstraction } from "../abstractions/login.service";

export class LoginService implements LoginServiceAbstraction {
  _email: string;
  _rememberEmail: boolean;

  getEmail() {
    return this._email;
  }

  getRememberEmail() {
    return this._rememberEmail;
  }

  setEmail(value: string) {
    this._email = value;
  }

  setRememberEmail(value: boolean) {
    this._rememberEmail = value;
  }
}
