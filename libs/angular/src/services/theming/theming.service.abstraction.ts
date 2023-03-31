import { Observable } from "rxjs";

import { ThemeType } from "@bitwarden/common/enums/theme-type";

import { Theme } from "./theme";

export abstract class AbstractThemingService {
  theme$: Observable<Theme>;
  monitorThemeChanges: () => Promise<void>;
  updateSystemTheme: (systemTheme: ThemeType) => void;
  updateConfiguredTheme: (theme: ThemeType) => Promise<void>;
}
