import { afterEach, describe, expect, it } from "vitest";

// 1x1 GIFs, so the tests never depend on the network or on files on disk.
const RED_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAP8AAAAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==";
const BLUE_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAA/wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==";

const mounted = [];

/**
 * Waits for the component's `requestAnimationFrame` callback to run. The
 * component schedules its callback first, so by the time a frame we request
 * afterwards fires, the style has already been written.
 */
const nextFrame = () =>
  new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });

/**
 * Renders an `<image-compare>` with two slotted images at a known width, so
 * that percentage-based styles resolve to predictable pixel values.
 */
function mount({ labelText } = {}) {
  const element = document.createElement("image-compare");
  if (labelText !== undefined) element.setAttribute("label-text", labelText);
  element.style.width = "400px";
  element.innerHTML = `
    <img slot="image-1" alt="Before" src="${RED_PIXEL}" />
    <img slot="image-2" alt="After" src="${BLUE_PIXEL}" />
  `;
  document.body.append(element);
  mounted.push(element);
  return element;
}

const slider = (element) => element.shadowRoot.querySelector("input");
const labelText = (element) =>
  element.shadowRoot.querySelector(".js-label-text");
const exposure = (element) =>
  getComputedStyle(element).getPropertyValue("--exposure").trim();

/** Moves the slider the way a pointer drag does, and waits for the repaint. */
async function drag(element, value) {
  const input = slider(element);
  input.value = String(value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await nextFrame();
}

/**
 * Moves the slider using only a `change` event. The component listens for both
 * `input` and `change` so that browsers and assistive technology that report
 * just the latter still move the divider.
 */
async function commit(element, value) {
  const input = slider(element);
  input.value = String(value);
  input.dispatchEvent(new Event("change", { bubbles: true }));
  await nextFrame();
}

/**
 * The shared contract for `<image-compare>`. Run once against `src/index.js`
 * and once against the minified `dist/index.min.js`, so a build tool that
 * mangles the component is caught by the same assertions that describe it.
 */
export function describeImageCompare(name) {
  describe(name, () => {
    afterEach(() => {
      for (const element of mounted.splice(0)) element.remove();
    });

    describe("rendering", () => {
      it("registers itself as image-compare", () => {
        expect(customElements.get("image-compare")).toBeTypeOf("function");
      });

      it("exposes an open shadow root", () => {
        expect(mount().shadowRoot).not.toBeNull();
      });

      it("places each image in its own slot", () => {
        const element = mount();
        const assigned = [...element.shadowRoot.querySelectorAll("slot")].map(
          (slot) => slot.assignedElements().map((image) => image.alt),
        );
        expect(assigned).toEqual([["Before"], ["After"]]);
      });

      it("offers a range slider", () => {
        const element = mount();
        expect(slider(element).type).toBe("range");
      });

      it("lets the slider travel the whole way from one image to the other", () => {
        const element = mount();
        expect([slider(element).min, slider(element).max]).toEqual(["0", "100"]);
      });

      // The slider is inset by half a thumb at each end so that the thumb —
      // not the track — lines up with the edges of the images.
      it("lets the slider thumb reach past both edges of the images", () => {
        const element = mount();
        expect(slider(element).getBoundingClientRect().width).toBeGreaterThan(
          element.getBoundingClientRect().width,
        );
      });

      it("starts with the slider centered", () => {
        expect(slider(mount()).value).toBe("50");
      });

      it("starts with both images half exposed", () => {
        expect(exposure(mount())).toBe("50%");
      });
    });

    describe("moving the slider", () => {
      it("exposes more of the second image as the slider is dragged", async () => {
        const element = mount();
        await drag(element, 25);
        expect(exposure(element)).toBe("25%");
      });

      it("exposes more of the second image when the browser only reports a change", async () => {
        const element = mount();
        await commit(element, 75);
        expect(exposure(element)).toBe("75%");
      });

      it("hides the second image completely at the far left", async () => {
        const element = mount();
        await drag(element, 0);
        expect(exposure(element)).toBe("0%");
      });

      it("hides the first image completely at the far right", async () => {
        const element = mount();
        await drag(element, 100);
        expect(exposure(element)).toBe("100%");
      });

      it("moves the boundary between the two images", async () => {
        const element = mount();
        const secondImage = element.querySelector('[slot="image-2"]');

        await drag(element, 25);
        const atQuarter = getComputedStyle(secondImage).clipPath;
        await drag(element, 75);
        const atThreeQuarters = getComputedStyle(secondImage).clipPath;

        expect(atQuarter).not.toBe(atThreeQuarters);
      });

      // A real drag fires `input` far more often than the screen refreshes.
      // The component answers that with a single write per frame, so this test
      // watches the host's `style` attribute rather than just the end value —
      // the end value alone would pass even if every event wrote immediately.
      it("moves to the final slider position in a single style update when dragged rapidly", async () => {
        const element = mount();
        const updates = [];
        const observer = new MutationObserver((records) =>
          updates.push(...records),
        );
        observer.observe(element, {
          attributes: true,
          attributeFilter: ["style"],
        });

        const input = slider(element);
        for (const value of [10, 20, 30, 40]) {
          input.value = String(value);
          input.dispatchEvent(new Event("input", { bubbles: true }));
        }
        await nextFrame();
        observer.disconnect();

        expect({ updates: updates.length, exposure: exposure(element) }).toEqual(
          { updates: 1, exposure: "40%" },
        );
      });

      it("keeps each instance on the page independent", async () => {
        const first = mount();
        const second = mount();
        await drag(first, 10);
        expect(exposure(second)).toBe("50%");
      });
    });

    describe("labelling", () => {
      it("names the slider for screen reader users", () => {
        const element = mount();
        expect(slider(element).labels).toHaveLength(1);
      });

      it("explains what the slider does by default", () => {
        const element = mount();
        expect(labelText(element).textContent).toContain(
          "Control how much of each overlapping image is shown.",
        );
      });

      it("replaces the explanation with the label-text attribute", () => {
        const element = mount({ labelText: "Compare the before and after" });
        expect(labelText(element).textContent).toBe(
          "Compare the before and after",
        );
      });

      it("keeps the default explanation when label-text is empty", () => {
        const element = mount({ labelText: "" });
        expect(labelText(element).textContent).toContain(
          "Control how much of each overlapping image is shown.",
        );
      });

      it("keeps the explanation out of the visual layout", () => {
        const element = mount();
        const { width, height } = labelText(element).getBoundingClientRect();
        expect({ width, height }).toEqual({ width: 1, height: 1 });
      });
    });
  });
}
