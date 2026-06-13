import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// The demo always runs against the library source in ../src, so it works
// before the package is on npm and always shows the current code. The alias
// keeps demo imports identical to what real users write.
const lib = (p: string) => fileURLToPath(new URL(`../src/${p}`, import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^arabicfmt\/currency$/, replacement: lib("currency/index.ts") },
      { find: /^arabicfmt\/number$/, replacement: lib("number/index.ts") },
      { find: /^arabicfmt\/date$/, replacement: lib("date/index.ts") },
      { find: /^arabicfmt\/umalqura$/, replacement: lib("umalqura/index.ts") },
      { find: /^arabicfmt\/bidi$/, replacement: lib("bidi/index.ts") },
      { find: /^arabicfmt\/text$/, replacement: lib("text/index.ts") },
      { find: /^arabicfmt\/validate$/, replacement: lib("validate/index.ts") },
      { find: /^arabicfmt$/, replacement: lib("index.ts") },
    ],
  },
  server: {
    fs: { allow: [fileURLToPath(new URL("..", import.meta.url))] },
  },
  build: { target: "es2020" },
});
