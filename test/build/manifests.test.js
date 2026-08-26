import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";

const read = (path) =>
  readFile(fileURLToPath(new URL(`../../${path}`, import.meta.url)), "utf8");
const readJson = async (path) => JSON.parse(await read(path));

describe("npm run document", () => {
  let tag;
  let vscode;
  let markdown;
  let source;

  beforeAll(async () => {
    const [manifest, vscodeManifest, markdownManifest, sourceCode] =
      await Promise.all([
        readJson("manifests/manifest.json"),
        readJson("manifests/manifest-vscode.json"),
        read("manifests/manifest.md"),
        read("src/index.js"),
      ]);
    tag = manifest.tags.find(({ name }) => name === "image-compare");
    vscode = vscodeManifest;
    markdown = markdownManifest;
    source = sourceCode;
  });

  it("describes the image-compare element", () => {
    expect(tag).toBeDefined();
  });

  it("documents the label-text attribute and its type", () => {
    expect(tag.attributes).toEqual([
      expect.objectContaining({ name: "label-text", type: "string" }),
    ]);
  });

  it("documents both image slots", () => {
    expect(tag.slots.map(({ name }) => name)).toEqual(["image-1", "image-2"]);
  });

  // Anything tagged `@cssprop` in the source is a promise to consumers that
  // they can theme it. If the analyzer stops picking those tags up, the promise
  // silently disappears from the editor autocomplete that reads this manifest.
  it("documents every CSS custom property tagged in the source", () => {
    const tagged = [...source.matchAll(/@cssprop(?:erty)?\s+(--[\w-]+)/gi)].map(
      ([, name]) => name,
    );
    const documented = tag.cssProperties.map(({ name }) => name);

    expect(tagged.filter((name) => !documented.includes(name))).toEqual([]);
  });

  // The test above can only check tags the analyzer would recognize, so a
  // misspelled one is invisible to it — the property just quietly vanishes from
  // the docs. `@cssprop` and `@cssproperty` are the two spellings that work.
  it("spells every CSS property tag the way the analyzer expects", () => {
    const misspelled = [...source.matchAll(/@(\w*prop\w*)/g)]
      .map(([, name]) => name)
      .filter((name) => !["cssprop", "cssproperty"].includes(name.toLowerCase()));

    expect([...new Set(misspelled)]).toEqual([]);
  });

  it("gives every documented item a description", () => {
    const undescribed = [...tag.attributes, ...tag.slots, ...tag.cssProperties]
      .filter(({ description }) => !description)
      .map(({ name }) => name);

    expect(undescribed).toEqual([]);
  });

  it("offers the element to editors as an autocomplete suggestion", () => {
    expect(vscode.tags.map(({ name }) => name)).toContain("image-compare");
  });

  it("offers the element's attributes to editors", () => {
    const [editorTag] = vscode.tags;
    expect(editorTag.attributes.map(({ name }) => name)).toEqual(["label-text"]);
  });

  it("writes readable docs for the element", () => {
    expect(markdown).toContain("# image-compare");
  });

  it("writes readable docs for each documented item", () => {
    const documented = [
      ...tag.attributes.map(({ name }) => name),
      ...tag.slots.map(({ name }) => name),
      ...tag.cssProperties.map(({ name }) => name),
    ];

    expect(documented.filter((name) => !markdown.includes(name))).toEqual([]);
  });
});
