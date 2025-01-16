import { DeviceType } from "@bitwarden/common/enums";

import { BrowserApi } from "../../browser/browser-api";

import { BrowserPlatformUtilsService } from "./browser-platform-utils.service";

class TestBrowserPlatformUtilsService extends BrowserPlatformUtilsService {
  constructor(win: Window & typeof globalThis) {
    super(win);
  }

  showToast(
    type: "error" | "success" | "warning" | "info",
    title: string,
    text: string | string[],
    options?: any,
  ): void {
    throw new Error("Method not implemented.");
  }
}

describe("Browser Utils Service", () => {
  let browserPlatformUtilsService: BrowserPlatformUtilsService;

  beforeEach(() => {
    (window as any).matchMedia = jest.fn().mockReturnValueOnce({});
    browserPlatformUtilsService = new TestBrowserPlatformUtilsService(window);
  });

  describe("getBrowser", () => {
    const originalUserAgent = navigator.userAgent;
    // Reset the userAgent.
    afterAll(() => {
      Object.defineProperty(navigator, "userAgent", {
        value: originalUserAgent,
      });
    });

    beforeEach(() => {
      (window as any).matchMedia = jest.fn().mockReturnValueOnce({});
    });

    afterEach(() => {
      window.matchMedia = undefined;
      (BrowserPlatformUtilsService as any).deviceCache = null;
    });

    it("should detect chrome", () => {
      Object.defineProperty(navigator, "userAgent", {
        configurable: true,
        value:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36",
      });

      expect(browserPlatformUtilsService.getDevice()).toBe(DeviceType.ChromeExtension);
    });

    it("should detect firefox", () => {
      Object.defineProperty(navigator, "userAgent", {
        configurable: true,
        value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:58.0) Gecko/20100101 Firefox/58.0",
      });

      expect(browserPlatformUtilsService.getDevice()).toBe(DeviceType.FirefoxExtension);
    });

    it("should detect opera", () => {
      Object.defineProperty(navigator, "userAgent", {
        configurable: true,
        value:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3175.3 Safari/537.36 OPR/49.0.2695.0 (Edition developer)",
      });

      expect(browserPlatformUtilsService.getDevice()).toBe(DeviceType.OperaExtension);
    });

    it("should detect edge", () => {
      Object.defineProperty(navigator, "userAgent", {
        configurable: true,
        value:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.74 Safari/537.36 Edg/79.0.309.43",
      });

      expect(browserPlatformUtilsService.getDevice()).toBe(DeviceType.EdgeExtension);
    });

    it("should detect safari", () => {
      Object.defineProperty(navigator, "userAgent", {
        configurable: true,
        value:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/602.4.8 (KHTML, like Gecko) Version/10.0.3 Safari/602.4.8",
      });

      expect(browserPlatformUtilsService.getDevice()).toBe(DeviceType.SafariExtension);
    });

    it("should detect vivaldi", () => {
      Object.defineProperty(navigator, "userAgent", {
        configurable: true,
        value:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.97 Safari/537.36 Vivaldi/1.94.1008.40",
      });

      expect(browserPlatformUtilsService.getDevice()).toBe(DeviceType.VivaldiExtension);
    });

    it("returns a previously determined device using a cached value", () => {
      Object.defineProperty(navigator, "userAgent", {
        configurable: true,
        value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:58.0) Gecko/20100101 Firefox/58.0",
      });
      jest.spyOn(BrowserPlatformUtilsService, "isFirefox");

      browserPlatformUtilsService.getDevice();

      expect(browserPlatformUtilsService.getDevice()).toBe(DeviceType.FirefoxExtension);
      expect(BrowserPlatformUtilsService.isFirefox).toHaveBeenCalledTimes(1);
    });
  });

  describe("getDeviceString", () => {
    it("returns a string value indicating the device type", () => {
      jest
        .spyOn(browserPlatformUtilsService, "getDevice")
        .mockReturnValue(DeviceType.ChromeExtension);

      expect(browserPlatformUtilsService.getDeviceString()).toBe("chrome");
    });
  });

  describe("isViewOpen", () => {
    it("returns false if a heartbeat response is not received", async () => {
      BrowserApi.sendMessageWithResponse = jest.fn().mockResolvedValueOnce(undefined);

      const isViewOpen = await browserPlatformUtilsService.isViewOpen();

      expect(isViewOpen).toBe(false);
    });

    it("returns true if a heartbeat response is received", async () => {
      BrowserApi.sendMessageWithResponse = jest
        .fn()
        .mockImplementationOnce((subscriber) =>
          Promise.resolve((subscriber === "checkVaultPopupHeartbeat") as any),
        );

      const isViewOpen = await browserPlatformUtilsService.isViewOpen();

      expect(isViewOpen).toBe(true);
    });
  });
});

describe("Safari Height Fix", () => {
  const originalUserAgent = navigator.userAgent;

  // Reset the userAgent.
  afterAll(() => {
    Object.defineProperty(navigator, "userAgent", {
      value: originalUserAgent,
    });
  });

  afterEach(() => {
    (BrowserPlatformUtilsService as any).deviceCache = null;
  });

  test.each([
    [
      "safari 15.6.1",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6.1 Safari/605.1.15",
      true,
    ],
    [
      "safari 16.0",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15",
      true,
    ],

    [
      "safari 16.1",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15",
      false,
    ],
    [
      "safari 16.4",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Safari/605.1.15",
      false,
    ],
    [
      "safari 17.0 (future release)",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
      false,
    ],
    [
      "chrome",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36",
      false,
    ],
    [
      "firefox",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:58.0) Gecko/20100101 Firefox/58.0",
      false,
    ],
    [
      "opera",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3175.3 Safari/537.36 OPR/49.0.2695.0 (Edition developer)",
      false,
    ],
    [
      "edge",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.74 Safari/537.36 Edg/79.0.309.43",
      false,
    ],
  ])("Apply fix for %s", (name, userAgent, expected) => {
    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      value: userAgent,
    });
    expect(BrowserPlatformUtilsService.shouldApplySafariHeightFix(window)).toBe(expected);
  });
});
