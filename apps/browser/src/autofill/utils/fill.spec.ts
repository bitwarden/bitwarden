import { EVENTS } from "../constants";
import { FillableControl, FormElement } from "../types";

import {
  urlNotSecure,
  canSeeElementToStyle,
  selectAllFromDoc,
  getElementByOpId,
  setValueForElementByEvent,
  setValueForElement,
  doClickByOpId,
  touchAllPasswordFields,
  doClickByQuery,
  doFocusByOpId,
  doSimpleSetByQuery,
} from "./fill";

type FormElementExtended = FormElement & { opid?: string };

const mockLoginForm = `
  <div id="root">
    <form>
      <input type="text" id="username" />
      <input type="password" />
    </form>
  </div>
`;

const eventsToTest = [
  EVENTS.CHANGE,
  EVENTS.INPUT,
  EVENTS.KEYDOWN,
  EVENTS.KEYPRESS,
  EVENTS.KEYUP,
  "blur",
  "click",
  "focus",
  "focusin",
  "focusout",
  "mousedown",
  "paste",
  "select",
  "selectionchange",
  "touchend",
  "touchstart",
];

const initEventCount = Object.freeze(
  eventsToTest.reduce(
    (eventCounts, eventName) => ({
      ...eventCounts,
      [eventName]: 0,
    }),
    {}
  )
);

let confirmSpy: jest.SpyInstance<boolean, [message?: string]>;
let consoleSpy: jest.SpyInstance<any>;
let windowSpy: jest.SpyInstance<any>;
let savedURLs: string[] | null = ["https://bitwarden.com"];
document.body.innerHTML = mockLoginForm;

function setMockWindowLocationProtocol(protocol: "http:" | "https:") {
  windowSpy.mockImplementation(() => ({
    location: {
      protocol,
    },
  }));
}

describe("fill utils", () => {
  afterEach(() => {
    document.body.innerHTML = mockLoginForm;
  });

  describe("urlNotSecure", () => {
    beforeEach(() => {
      confirmSpy = jest.spyOn(window, "confirm");
      windowSpy = jest.spyOn(window, "window", "get");
    });

    afterEach(() => {
      windowSpy.mockRestore();
      confirmSpy.mockRestore();
    });

    it("is secure on page with no password field", () => {
      setMockWindowLocationProtocol("https:");

      document.body.innerHTML = `
        <div id="root">
          <form>
            <input type="text" id="username" />
          </form>
        </div>
      `;

      const isNotSecure = urlNotSecure(savedURLs);

      expect(isNotSecure).toEqual(false);
    });

    it("is secure on https page with saved https URL", () => {
      setMockWindowLocationProtocol("https:");

      const isNotSecure = urlNotSecure(savedURLs);

      expect(isNotSecure).toEqual(false);
    });

    it("is secure on http page with saved https URL and user approval", () => {
      confirmSpy.mockImplementation(jest.fn(() => true));

      const isNotSecure = urlNotSecure(savedURLs);

      expect(isNotSecure).toEqual(false);
    });

    it("is not secure on http page with saved https URL and user disapproval", () => {
      setMockWindowLocationProtocol("http:");

      confirmSpy.mockImplementation(jest.fn(() => false));

      const isNotSecure = urlNotSecure(savedURLs);

      expect(isNotSecure).toEqual(true);
    });

    it("is secure on http page with saved http URL", () => {
      savedURLs = ["http://bitwarden.com"];

      setMockWindowLocationProtocol("http:");

      const isNotSecure = urlNotSecure(savedURLs);

      expect(isNotSecure).toEqual(false);
    });

    it("is secure when there are no saved URLs", () => {
      savedURLs = [];

      setMockWindowLocationProtocol("http:");

      let isNotSecure = urlNotSecure(savedURLs);

      expect(isNotSecure).toEqual(false);

      savedURLs = null;

      isNotSecure = urlNotSecure(savedURLs);

      expect(isNotSecure).toEqual(false);
    });
  });

  describe("canSeeElementToStyle", () => {
    it("should return true when the element is a non-hidden password field", () => {
      const testElement = document.querySelector('input[type="password"]') as FormElementExtended;

      expect(canSeeElementToStyle(testElement, true)).toEqual(true);
    });

    it("should return true when the element is a non-hidden email input", () => {
      document.body.innerHTML = mockLoginForm + '<input type="email" />';
      const testElement = document.querySelector('input[type="email"]') as FormElementExtended;

      expect(canSeeElementToStyle(testElement, true)).toEqual(true);
    });

    it("should return true when the element is a non-hidden text input", () => {
      document.body.innerHTML = mockLoginForm + '<input type="text" />';
      const testElement = document.querySelector('input[type="text"]') as FormElementExtended;

      expect(canSeeElementToStyle(testElement, true)).toEqual(true);
    });

    it("should return true when the element is a non-hidden number input", () => {
      document.body.innerHTML = mockLoginForm + '<input type="number" />';
      const testElement = document.querySelector('input[type="number"]') as FormElementExtended;

      expect(canSeeElementToStyle(testElement, true)).toEqual(true);
    });

    it("should return true when the element is a non-hidden tel input", () => {
      document.body.innerHTML = mockLoginForm + '<input type="tel" />';
      const testElement = document.querySelector('input[type="tel"]') as FormElementExtended;

      expect(canSeeElementToStyle(testElement, true)).toEqual(true);
    });

    it("should return true when the element is a non-hidden url input", () => {
      document.body.innerHTML = mockLoginForm + '<input type="url" />';
      const testElement = document.querySelector('input[type="url"]') as FormElementExtended;

      expect(canSeeElementToStyle(testElement, true)).toEqual(true);
    });

    it("should return false when the element is a non-hidden hidden input type", () => {
      document.body.innerHTML = mockLoginForm + '<input type="hidden" />';
      const testElement = document.querySelector('input[type="hidden"]') as FormElementExtended;

      expect(canSeeElementToStyle(testElement, true)).toEqual(false);
    });

    it("should return false when the element is a non-hidden textarea", () => {
      document.body.innerHTML = mockLoginForm + "<textarea></textarea>";
      const testElement = document.querySelector("textarea") as FormElementExtended;

      expect(canSeeElementToStyle(testElement, true)).toEqual(false);
    });

    it("should return true when the element is a non-hidden span", () => {
      document.body.innerHTML = mockLoginForm + '<span id="input-tag"></span>';
      const testElement = document.querySelector("#input-tag") as FormElementExtended;

      expect(canSeeElementToStyle(testElement, true)).toEqual(true);
    });

    it("should return false when the element is a unsupported tag", () => {
      document.body.innerHTML = mockLoginForm + '<div id="input-tag"></div>';
      const testElement = document.querySelector("#input-tag") as FormElementExtended;

      expect(canSeeElementToStyle(testElement, true)).toEqual(false);
    });

    it("should return false when the element has a `visibility: hidden;` CSS rule applied to it", () => {
      const testElement = document.querySelector('input[type="password"]') as FormElementExtended;
      testElement.style.visibility = "hidden";

      expect(canSeeElementToStyle(testElement, true)).toEqual(false);
    });

    it("should return false when the element has a `display: none;` CSS rule applied to it", () => {
      const testElement = document.querySelector('input[type="password"]') as FormElementExtended;
      testElement.style.display = "none";

      expect(canSeeElementToStyle(testElement, true)).toEqual(false);
    });

    it("should return false when a parent of the element has a `display: none;` or `visibility: hidden;` CSS rule applied to it", () => {
      document.body.innerHTML =
        mockLoginForm + '<div style="visibility: hidden;"><input type="email" /></div>';
      let testElement = document.querySelector('input[type="email"]') as FormElementExtended;

      expect(canSeeElementToStyle(testElement, true)).toEqual(false);

      document.body.innerHTML =
        mockLoginForm +
        `
          <div style="display: none;">
            <div>
              <span id="input-tag"></span>
            </div>
          </div>
        `;
      testElement = document.querySelector("#input-tag") as FormElementExtended;
      expect(canSeeElementToStyle(testElement, true)).toEqual(false);
    });
  });

  describe("selectAllFromDoc", () => {
    it("should return an array of all elements in the document which the selector targets", () => {
      let selection = selectAllFromDoc("input");

      expect(selection.length).toEqual(2);

      selection = selectAllFromDoc("p");

      expect(selection.length).toEqual(0);
    });
  });

  describe("getElementByOpId", () => {
    it("should return the element with the opid property value matching the passed value", () => {
      const textInput = document.querySelector('input[type="text"]') as FormElementExtended;
      const passwordInput = document.querySelector('input[type="password"]') as FormElementExtended;

      textInput.setAttribute("opid", "__0");
      passwordInput.setAttribute("opid", "__1");

      expect(getElementByOpId("__0")).toEqual(textInput);
      expect(getElementByOpId("__0")).not.toEqual(passwordInput);
      expect(getElementByOpId("__1")).toEqual(passwordInput);
    });

    describe("should handle multiple elements with the same `opid` property value matching the passed value", () => {
      beforeAll(() => {
        consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {
          /* no-op */
        });
      });

      afterAll(() => {
        consoleSpy.mockRestore();
      });

      it("should return the first of the elements with an `opid` value matching the passed value and emit a console warning", () => {
        const textInput = document.querySelector('input[type="text"]') as FormElementExtended;
        const passwordInput = document.querySelector(
          'input[type="password"]'
        ) as FormElementExtended;

        textInput.opid = "__1";
        passwordInput.opid = "__1";

        expect(getElementByOpId("__1")).toEqual(textInput);
        expect(getElementByOpId("__1")).not.toEqual(passwordInput);
        expect(getElementByOpId("__0")).toEqual(textInput);
        expect(consoleSpy.mock.calls[0]?.[0]).toEqual("More than one element found with opid __1");
      });
    });

    it("should return the element at the index position (parsed from passed opid) of all document input, select, button, textarea, or span[data-bwautofill] elements when the passed opid value cannot be found", () => {
      const textInput = document.querySelector('input[type="text"]') as FormElementExtended;
      const passwordInput = document.querySelector('input[type="password"]') as FormElementExtended;

      textInput.removeAttribute("opid");
      passwordInput.opid = "__1";

      expect(textInput.hasAttribute("opid")).toEqual(false);
      expect(getElementByOpId("__0")).toEqual(textInput);
      expect(getElementByOpId("__0")).not.toEqual(passwordInput);
      expect(getElementByOpId("__2")).toEqual(null);
    });

    it("should return null if a falsey value is passed", () => {
      expect(getElementByOpId(null)).toEqual(null);
      expect(getElementByOpId(undefined)).toEqual(null);
    });

    it("should return null if no suitable element could be found", () => {
      document.body.innerHTML = "<div></div>";

      expect(getElementByOpId("__2")).toEqual(null);
    });
  });

  describe("setValueForElementByEvent", () => {
    it("should fire expected interaction events for the element without changing the value", () => {
      document.body.innerHTML = `
        <input
          name="user_id"
          value="anInitialValue"
        />
      `;
      const targetInput = document.querySelector('[name="user_id"]') as FillableControl;
      const elementEventCount: { [key: string]: number } = { ...initEventCount };

      // Testing all the relevant events to ensure downstream side-effects are firing correctly
      const expectedElementEventCount: { [key: string]: number } = {
        ...initEventCount,
        [EVENTS.CHANGE]: 1,
        [EVENTS.INPUT]: 1,
        [EVENTS.KEYDOWN]: 1,
        [EVENTS.KEYPRESS]: 1,
        [EVENTS.KEYUP]: 1,
      };
      const eventHandlers: { [key: string]: EventListener } = {};

      eventsToTest.forEach((eventType) => {
        eventHandlers[eventType] = (handledEvent) => {
          const eventTarget = handledEvent.target as HTMLInputElement;

          if (eventTarget.name === "user_id") {
            // Test value updates as side-effects from events
            eventTarget.value = "valueToOverwrite";
            elementEventCount[handledEvent.type]++;
          }
        };

        targetInput.addEventListener(eventType, eventHandlers[eventType]);
      });

      setValueForElementByEvent(targetInput);

      expect(targetInput.value).toEqual("anInitialValue");
      expect(elementEventCount).toEqual(expectedElementEventCount);

      eventsToTest.forEach((eventType) => {
        targetInput.removeEventListener(eventType, eventHandlers[eventType]);
      });
    });
  });

  describe("setValueForElement", () => {
    it("should fire expected interaction events for the element without changing the value", () => {
      document.body.innerHTML = `
        <input
          name="user_id"
          value="anInitialValue"
        />
      `;

      const targetInput = document.querySelector('[name="user_id"]') as FillableControl;
      const elementEventCount: { [key: string]: number } = { ...initEventCount };

      // Testing all the relevant events to ensure downstream side-effects are firing correctly
      const expectedElementEventCount: { [key: string]: number } = {
        ...initEventCount,
        [EVENTS.KEYDOWN]: 1,
        [EVENTS.KEYPRESS]: 1,
        [EVENTS.KEYUP]: 1,
        click: 1,
        focus: 1,
        focusin: 1,
      };
      const eventHandlers: { [key: string]: EventListener } = {};

      eventsToTest.forEach((eventType) => {
        eventHandlers[eventType] = (handledEvent) => {
          const eventTarget = handledEvent.target as HTMLInputElement;

          if (eventTarget.name === "user_id") {
            // Test value updates as side-effects from events
            eventTarget.value = "valueToOverwrite";
            elementEventCount[handledEvent.type]++;
          }
        };

        targetInput.addEventListener(eventType, eventHandlers[eventType]);
      });

      setValueForElement(targetInput);

      expect(targetInput.value).toEqual("anInitialValue");
      expect(elementEventCount).toEqual(expectedElementEventCount);

      eventsToTest.forEach((eventType) => {
        targetInput.removeEventListener(eventType, eventHandlers[eventType]);
      });
    });
  });

  describe("doSimpleSetByQuery", () => {
    it("should fill (with the passed value) and return all elements targeted by the passed selector", () => {
      document.body.innerHTML =
        mockLoginForm + '<input id="input-tag" name="user_id" value="anInitialValue" />';

      const targetInputUserId = document.querySelector('[name="user_id"]') as FillableControl;
      const targetInputUserName = document.querySelector(
        'input[type="text"]#username'
      ) as FillableControl;
      const passedValue = "jsmith";

      expect(targetInputUserId.value).toEqual("anInitialValue");
      expect(targetInputUserName.value).toEqual("");
      expect(
        doSimpleSetByQuery('input[type="text"]#username, [name="user_id"]', passedValue)
      ).toHaveLength(2);
      expect(targetInputUserId.value).toEqual(passedValue);
      expect(targetInputUserName.value).toEqual(passedValue);
    });

    it("should not fill or return elements targeted by the passed selector which are anchor tags, disabled, read-only, or cannot have a value set", () => {
      document.body.innerHTML = `
        <input id="input-tag-a" type="text" class="user_id" disabled />
        <input id="input-tag-b" type="text" class="user_id" readonly />
        <input id="input-tag-c" type="text" class="user_id" />
        <a id="input-tag-d" class="user_id" href="./"></a>
        <span id="input-tag-e" class="user_id" value="anInitialValue"></span>
      `;

      const returnedElements = doSimpleSetByQuery(".user_id", "aUsername");

      expect(returnedElements).toHaveLength(1);
      expect(returnedElements[0].id).toEqual("input-tag-c");
      expect(returnedElements[0].value).toEqual("aUsername");
    });
  });

  describe("doClickByOpId", () => {
    it("should click on and return the elements targeted by the passed opid", () => {
      const textInput = document.querySelector('input[type="text"]') as FormElementExtended;
      textInput.opid = "__1";
      let clickEventCount = 0;
      const expectedClickEventCount = 1;
      const clickEventHandler: (handledEvent: Event) => void = (handledEvent) => {
        const eventTarget = handledEvent.target as HTMLInputElement;

        if (eventTarget.id === "username") {
          clickEventCount++;
        }
      };

      textInput.addEventListener("click", clickEventHandler);

      expect(doClickByOpId("__1")?.[0]).toEqual(textInput);
      expect(clickEventCount).toEqual(expectedClickEventCount);

      textInput.removeEventListener("click", clickEventHandler);
    });

    it("should not click and should return null when no suitable elements can be found", () => {
      const textInput = document.querySelector('input[type="text"]') as FormElementExtended;

      let clickEventCount = 0;
      const expectedClickEventCount = 0;
      const clickEventHandler: (handledEvent: Event) => void = (handledEvent) => {
        const eventTarget = handledEvent.target as HTMLInputElement;

        if (eventTarget.id === "username") {
          clickEventCount++;
        }
      };

      textInput.addEventListener("click", clickEventHandler);

      expect(clickEventCount).toEqual(expectedClickEventCount);
      expect(doClickByOpId("__2")).toEqual(null);

      textInput.removeEventListener("click", clickEventHandler);
    });

    // @TODO better define this code path
    it("should return null when the targeted element is found but not clickable", () => {
      const textInput = document.querySelector('input[type="text"]') as FormElementExtended;
      textInput.opid = "__1";
      textInput.click = null;

      let clickEventCount = 0;
      const expectedClickEventCount = 0;
      const clickEventHandler: (handledEvent: Event) => void = (handledEvent) => {
        const eventTarget = handledEvent.target as HTMLInputElement;

        if (eventTarget.id === "username") {
          clickEventCount++;
        }
      };

      textInput.addEventListener("click", clickEventHandler);

      expect(clickEventCount).toEqual(expectedClickEventCount);
      expect(doClickByOpId("__1")).toEqual(null);

      textInput.removeEventListener("click", clickEventHandler);
    });
  });

  describe("touchAllPasswordFields", () => {
    it("should, for each possible password field in the document, set the existing value and click the element if it is clickable", () => {
      document.body.innerHTML += '<input type="text" name="text_password" value="password" />';
      const targetInput = document.querySelector(
        'input[type="text"][name="text_password"]'
      ) as FormElementExtended;
      const elementEventCount: { [key: string]: number } = { ...initEventCount };

      // Testing all the relevant events to ensure downstream side-effects are firing correctly
      const expectedElementEventCount: { [key: string]: number } = {
        ...initEventCount,
        [EVENTS.CHANGE]: 1,
        [EVENTS.INPUT]: 1,
        [EVENTS.KEYDOWN]: 2,
        [EVENTS.KEYPRESS]: 2,
        [EVENTS.KEYUP]: 2,
        blur: 1,
        click: 2,
        focus: 1,
        focusin: 1,
        focusout: 1,
      };
      const eventHandlers: { [key: string]: EventListener } = {};

      eventsToTest.forEach((eventType) => {
        eventHandlers[eventType] = (handledEvent) => {
          elementEventCount[handledEvent.type]++;
        };

        targetInput.addEventListener(eventType, eventHandlers[eventType]);
      });

      touchAllPasswordFields();

      expect(elementEventCount).toEqual(expectedElementEventCount);

      eventsToTest.forEach((eventType) => {
        targetInput.removeEventListener(eventType, eventHandlers[eventType]);
      });
    });
  });

  describe("doClickByQuery", () => {
    it("should click and focus the elements targeted by the passed selector", () => {
      const passedSelector = 'input[type="text"]';
      const targetInput = document.querySelector(passedSelector) as FormElementExtended;
      const elementEventCount: { [key: string]: number } = { ...initEventCount };

      // Testing all the relevant events to ensure downstream side-effects are firing correctly
      const expectedElementEventCount: { [key: string]: number } = {
        ...initEventCount,
        click: 2,
        focus: 1,
        focusin: 1,
      };
      const eventHandlers: { [key: string]: EventListener } = {};

      eventsToTest.forEach((eventType) => {
        eventHandlers[eventType] = (handledEvent) => {
          elementEventCount[handledEvent.type]++;
        };

        targetInput.addEventListener(eventType, eventHandlers[eventType]);
      });

      expect(doClickByQuery(passedSelector)).toEqual(undefined);

      expect(elementEventCount).toEqual(expectedElementEventCount);

      eventsToTest.forEach((eventType) => {
        targetInput.removeEventListener(eventType, eventHandlers[eventType]);
      });
    });
  });

  describe("doFocusByOpId", () => {
    it("should click and focus the elements targeted by the passed opid", () => {
      const targetInput = document.querySelector('input[type="text"]') as FormElementExtended;
      const elementEventCount: { [key: string]: number } = { ...initEventCount };

      // Testing all the relevant events to ensure downstream side-effects are firing correctly
      const expectedElementEventCount: { [key: string]: number } = {
        ...initEventCount,
        click: 1,
        focus: 1,
        focusin: 1,
      };
      const eventHandlers: { [key: string]: EventListener } = {};

      eventsToTest.forEach((eventType) => {
        eventHandlers[eventType] = (handledEvent) => {
          elementEventCount[handledEvent.type]++;
        };

        targetInput.addEventListener(eventType, eventHandlers[eventType]);
      });

      expect(doFocusByOpId("__0")).toEqual(null);

      expect(elementEventCount).toEqual(expectedElementEventCount);

      eventsToTest.forEach((eventType) => {
        targetInput.removeEventListener(eventType, eventHandlers[eventType]);
      });
    });
  });
});
