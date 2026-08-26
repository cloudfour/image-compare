import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      // Checks the artifacts `npm run build` and `npm run document` produce.
      // These are what we publish to npm, so they get tested directly rather
      // than assumed to be correct.
      {
        test: {
          name: "build",
          environment: "node",
          include: ["test/build/**/*.test.js"],
        },
      },
      // Checks component behavior in a real browser. Shadow DOM, CSS custom
      // properties, `clip-path`, and `requestAnimationFrame` are all central to
      // how this component works, and none of them are faithfully emulated by a
      // DOM shim.
      {
        test: {
          name: "browser",
          include: ["test/browser/**/*.test.js"],
          // Each file gets its own page, so both the source and the minified
          // build can call `customElements.define('image-compare')`.
          isolate: true,
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
