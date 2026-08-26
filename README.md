# image-compare

[![NPM version](http://img.shields.io/npm/v/@cloudfour/image-compare.svg)](https://www.npmjs.org/package/@cloudfour/image-compare) [![Build Status](https://github.com/cloudfour/image-compare/workflows/CI/badge.svg)](https://github.com/cloudfour/image-compare/actions?query=workflow%3ACI) [![Renovate](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com)

> A tiny, zero-dependency web component for comparing two images using a slider. Built with a focus on accessibility, performance, and progressive enhancement.

View the [full documentation](https://image-compare-component.netlify.app/) or check it out on [npm](https://www.npmjs.com/package/@cloudfour/image-compare).

## Tests

```sh
npm test             # build, then run everything once
npm run test:watch   # re-run on change
```

Because every dependency here is build tooling, the suite is aimed at the
things a dependency upgrade could quietly break:

- `test/browser/` runs the component's behavior in headless Chromium — twice.
  Once against `src/index.js`, and once against the minified `dist/index.min.js`
  that consumers actually load, so a bad `minify` release fails the build
  instead of shipping.
- `test/build/` checks the published artifacts: that `dist/` matches the
  source, and that the generated manifests still describe the element's
  attributes, slots, and CSS custom properties.
