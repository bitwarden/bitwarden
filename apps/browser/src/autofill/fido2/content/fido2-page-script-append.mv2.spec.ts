import { Fido2ContentScript } from "../enums/fido2-content-script.enum";

describe("FIDO2 page-script for manifest v2", () => {
  let createdScriptElement: HTMLScriptElement;
  jest.spyOn(window.document, "createElement");

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    Object.defineProperty(window.document, "contentType", { value: "text/html", writable: true });
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.resetModules();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("skips appending the `page-script.js` file if the document contentType is not `text/html`", () => {
    Object.defineProperty(window.document, "contentType", { value: "text/plain", writable: true });

    require("./fido2-page-script-append.mv2");

    expect(window.document.createElement).not.toHaveBeenCalled();
  });

  it("appends the `page-script.js` file to the document head when the contentType is `text/html`", () => {
    jest.spyOn(window.document.head, "prepend").mockImplementation((node) => {
      createdScriptElement = node as HTMLScriptElement;
      return node;
    });

    require("./fido2-page-script-append.mv2");

    expect(window.document.createElement).toHaveBeenCalledWith("script");
    expect(chrome.runtime.getURL).toHaveBeenCalledWith(Fido2ContentScript.PageScript);
    expect(window.document.head.prepend).toHaveBeenCalledWith(expect.any(HTMLScriptElement));
    expect(createdScriptElement.src).toBe(`chrome-extension://id/${Fido2ContentScript.PageScript}`);
  });

  it("appends the `page-script.js` file to the document element if the head is not available", () => {
    window.document.documentElement.removeChild(window.document.head);
    jest.spyOn(window.document.documentElement, "prepend").mockImplementation((node) => {
      createdScriptElement = node as HTMLScriptElement;
      return node;
    });

    require("./fido2-page-script-append.mv2");

    expect(window.document.createElement).toHaveBeenCalledWith("script");
    expect(chrome.runtime.getURL).toHaveBeenCalledWith(Fido2ContentScript.PageScript);
    expect(window.document.documentElement.prepend).toHaveBeenCalledWith(
      expect.any(HTMLScriptElement),
    );
    expect(createdScriptElement.src).toBe(`chrome-extension://id/${Fido2ContentScript.PageScript}`);
  });

  it("removes the appended `page-script.js` file after the script has triggered a load event", () => {
    createdScriptElement = document.createElement("script");
    jest.spyOn(window.document, "createElement").mockImplementation((element) => {
      return createdScriptElement;
    });

    require("./fido2-page-script-append.mv2");

    jest.spyOn(createdScriptElement, "remove");
    createdScriptElement.dispatchEvent(new Event("load"));
    jest.runAllTimers();

    expect(createdScriptElement.remove).toHaveBeenCalled();
  });
});
