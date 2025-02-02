import { enableProdMode } from "@angular/core";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";

// eslint-disable-next-line @typescript-eslint/no-require-imports
require("../scss/styles.scss");
// eslint-disable-next-line @typescript-eslint/no-require-imports
require("../scss/tailwind.css");

import { AppModule } from "./app.module";

if (!ipc.platform.isDev) {
  enableProdMode();
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
platformBrowserDynamic().bootstrapModule(AppModule);

// Disable drag and drop to prevent malicious links from executing in the context of the app
document.addEventListener("dragover", (event) => event.preventDefault());
document.addEventListener("drop", (event) => event.preventDefault());
