# Contributing to arabicfmt

Thanks for your interest in improving arabicfmt! Bug reports, fixes, new Arabic
data and documentation are all welcome.

## Ways to help

- **Report a bug** or **request a feature** via [issues](https://github.com/cc1a2b/arabicfmt/issues).
- **Improve Arabic correctness** — currency precision, plurals, تفقيط grammar,
  Hijri data, transliteration. Correctness reports with a source are especially
  valuable.
- **Add examples or docs**, including translations.

## Development setup

```sh
git clone https://github.com/cc1a2b/arabicfmt
cd arabicfmt
npm install
npm test          # run the suite (vitest)
npm run typecheck # tsc --noEmit
npm run build     # tsup → dist/
npm run verify    # re-verify currency data against CLDR
```

Requirements: Node.js ≥ 18.

## Guidelines

- **Zero runtime dependencies** is a hard rule — please don't add any.
- **Add tests** for every change; keep the suite green (`npm test`).
- **Keep types accurate** and add a JSDoc `@example` for new public functions.
- **Match the existing style** (formatting, naming, comment density).
- Generated files (`*.generated.ts`) come from `npm run generate` — don't edit by hand.
- For anything grammar- or data-related, cite a source (CLDR, ISO 4217, Unicode,
  Umm al-Qura) in the PR.

## Lockfile note

If your change touches dependencies, regenerate the lockfile from a **clean**
install so all platforms' optional binaries are recorded:

```sh
rm -rf node_modules package-lock.json
npm install
```

(An incremental `npm install` on some platforms can drop other platforms'
optional native binaries and break CI on a different OS.)

## Pull requests

1. Branch from `main`.
2. Make focused commits with clear messages.
3. Ensure `npm test`, `npm run typecheck` and `npm run build` all pass.
4. Open the PR and fill in the template.

By contributing you agree your contributions are licensed under the project's
[MIT license](./LICENSE).
