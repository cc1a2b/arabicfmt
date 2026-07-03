import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "currency/index": "src/currency/index.ts",
    "number/index": "src/number/index.ts",
    "date/index": "src/date/index.ts",
    "umalqura/index": "src/umalqura/index.ts",
    "bidi/index": "src/bidi/index.ts",
    "text/index": "src/text/index.ts",
    "validate/index": "src/validate/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  splitting: true,
  treeshake: true,
  clean: true,
  sourcemap: false,
  minify: false,
  target: "es2020",
  outExtension({ format }) {
    return { js: format === "cjs" ? ".cjs" : ".js" };
  },
});
