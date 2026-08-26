import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const read = (path) =>
  readFile(fileURLToPath(new URL(`../../${path}`, import.meta.url)), "utf8");

describe("npm run build", () => {
  it("ships the component source untouched", async () => {
    expect(await read("dist/index.js")).toBe(await read("src/index.js"));
  });

  it("ships a smaller minified copy alongside it", async () => {
    const [source, minified] = await Promise.all([
      read("dist/index.js"),
      read("dist/index.min.js"),
    ]);
    expect(minified.length).toBeLessThan(source.length);
  });

  // `minify` treats the component's styles as an opaque template literal. If a
  // future version starts reformatting template contents, the CSS custom
  // property names consumers theme with could be renamed out from under them.
  it("leaves the themeable custom property names in the minified styles", async () => {
    const minified = await read("dist/index.min.js");
    const themeable = [...(await read("src/index.js")).matchAll(/--[\w-]+/g)];
    const names = [...new Set(themeable.map(([name]) => name))];

    expect(names.filter((name) => !minified.includes(name))).toEqual([]);
  });

  it("leaves the vendor-prefixed thumb selectors in the minified styles", async () => {
    const minified = await read("dist/index.min.js");
    expect(minified).toContain("::-webkit-slider-thumb");
  });
});
