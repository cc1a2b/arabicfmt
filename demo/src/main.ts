import "./style.css";

import {
  formatCurrency,
  getCurrencyInfo,
  spellCurrency,
  type SymbolMode,
} from "arabicfmt/currency";
import {
  arabicFraction,
  arabicOrdinal,
  arabicToWords,
  countedNoun,
  formatCompact,
  formatDuration,
  formatFileSize,
  formatNumber,
  formatPercent,
  formatRelativeTime,
  parseCurrency,
  parseNumber,
  toArabicDigits,
  toLatinDigits,
  type CountedNoun,
} from "arabicfmt/number";
import { formatHijri, fromHijri, toHijri } from "arabicfmt/umalqura";
import {
  arabicPlural,
  arabicPluralForm,
  formatList,
  normalizeForSearch,
  slugify,
  sortArabic,
  stripTashkeel,
  transliterate,
} from "arabicfmt/text";
import { isolateForeign } from "arabicfmt/bidi";
import { formatIBAN, isValidIBAN, isValidSaudiId, saudiIdType } from "arabicfmt/validate";

// ---------------------------------------------------------------- helpers

const $ = <T extends HTMLElement = HTMLElement>(sel: string): T => {
  const node = document.querySelector<T>(sel);
  if (!node) throw new Error(`demo: missing element ${sel}`);
  return node;
};

/** Wire a segmented control; returns a getter for the active value. */
function segmented(sel: string, onChange: () => void): () => string {
  const root = $(sel);
  const buttons = [...root.querySelectorAll<HTMLButtonElement>("button")];
  root.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest("button");
    if (!btn) return;
    buttons.forEach((b) => b.classList.toggle("active", b === btn));
    onChange();
  });
  return () => root.querySelector<HTMLButtonElement>("button.active")?.dataset.v ?? "";
}

/**
 * Does the user's font stack have a real glyph for this character?
 *
 * A missing glyph is drawn by the browser's last-resort font, so it renders
 * identically whatever font family we ask for, and at the same advance width
 * as any other missing character (U+0378 is permanently unassigned). A real
 * glyph differs between sans-serif and monospace. Pixel-diffing against
 * U+0378 alone is not enough: Chrome's tofu boxes embed the codepoint digits.
 */
const glyphCache = new Map<string, boolean>();
function glyphSupported(ch: string): boolean {
  const hit = glyphCache.get(ch);
  if (hit !== undefined) return hit;
  let ok = true;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 48;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (ctx) {
      const draw = (s: string, font: string) => {
        ctx.clearRect(0, 0, 48, 48);
        ctx.font = `28px ${font}`;
        ctx.fillText(s, 4, 34);
        return ctx.getImageData(0, 0, 48, 48).data.join();
      };
      ctx.font = "28px sans-serif";
      const sameWidthAsTofu =
        Math.abs(ctx.measureText(ch).width - ctx.measureText("͸").width) < 0.5;
      const sameAcrossFamilies = draw(ch, "sans-serif") === draw(ch, "monospace");
      ok = !(sameWidthAsTofu && sameAcrossFamilies);
    }
  } catch {
    ok = true; // canvas unavailable — assume the best
  }
  glyphCache.set(ch, ok);
  return ok;
}

function wireCopyButtons(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const src = document.getElementById(btn.dataset.copy!);
      if (!src) return;
      await navigator.clipboard.writeText(src.textContent ?? "");
      const old = btn.textContent;
      btn.textContent = "Copied ✓";
      btn.classList.add("done");
      setTimeout(() => {
        btn.textContent = old;
        btn.classList.remove("done");
      }, 1300);
    });
  });
  for (const id of ["#copy-install", "#copy-install-2"]) {
    const btn = document.querySelector<HTMLButtonElement>(id);
    btn?.addEventListener("click", async () => {
      await navigator.clipboard.writeText("npm install arabicfmt");
      btn.textContent = "Copied ✓";
      setTimeout(() => (btn.textContent = "Copy"), 1300);
    });
  }
}

// ---------------------------------------------------------------- masthead

const ARAB_CODES = [
  "SAR", "AED", "OMR", "KWD", "BHD", "QAR", "JOD", "IQD", "LYD", "TND", "YER",
  "EGP", "SDG", "LBP", "SYP", "MAD", "DZD", "MRU", "SOS", "DJF", "KMF",
] as const;
const TAFQIT_CODES = ARAB_CODES; // full noun paradigms bundled for all of them

/** The newspaper dateline: Gregorian on one side, live Umm al-Qura on the other. */
function masthead(): void {
  const now = new Date();
  $("#date-greg").textContent = now.toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  $("#date-hijri").textContent = formatHijri(now, { numerals: "arab" });
}

function heroTicker(): void {
  const threeDaysAgo = new Date(Date.now() - 3 * 86_400_000);
  const examples: Array<[string, string]> = [
    ['formatCurrency(1234.5, { currency: "SAR", numerals: "arab" })', formatCurrency(1234.5, { currency: "SAR", numerals: "arab" })],
    ['spellCurrency(1234.5, { currency: "SAR" })', spellCurrency(1234.5, { currency: "SAR" })],
    ["formatHijri(new Date(), { numerals: \"arab\" })", formatHijri(new Date(), { numerals: "arab" })],
    ["arabicToWords(1234)", arabicToWords(1234)],
    ["formatRelativeTime(threeDaysAgo)", formatRelativeTime(threeDaysAgo)],
    ["arabicFraction(3, 4)", arabicFraction(3, 4)],
    ['formatList(["تفاح", "موز", "تمر"])', formatList(["تفاح", "موز", "تمر"])],
    ["formatDuration(7_500_000)", formatDuration(7_500_000)],
    ['arabicOrdinal(25, { gender: "female" })', arabicOrdinal(25, { gender: "female" })],
    ['parseNumber("١٬٢٣٤٫٥٦")', String(parseNumber("١٬٢٣٤٫٥٦"))],
    ['slugify("مدينة نصر")', slugify("مدينة نصر")],
  ];

  const input = $("#term-in");
  const output = $("#term-out");
  const body = $("#term-body");
  const dots = $("#term-dots");
  examples.forEach((_, i) => {
    const dot = document.createElement("i");
    dot.addEventListener("click", () => show(i, true));
    dots.appendChild(dot);
  });
  const dotEls = [...dots.children] as HTMLElement[];

  let idx = 0;
  let timer = 0;
  function show(i: number, manual = false): void {
    idx = i % examples.length;
    body.classList.add("fading");
    setTimeout(() => {
      const [code, out] = examples[idx]!;
      input.textContent = code;
      output.textContent = out;
      // Latin-only results (slugs, parsed numbers) read better LTR.
      output.dir = /[؀-ۿ]/.test(out) ? "rtl" : "ltr";
      dotEls.forEach((d, j) => d.classList.toggle("on", j === idx));
      body.classList.remove("fading");
    }, 280);
    if (manual) restart();
  }
  function restart(): void {
    clearInterval(timer);
    timer = window.setInterval(() => show(idx + 1), 3400);
  }
  show(0);
  restart();
}

// ---------------------------------------------------------------- currency

function currencyCard(): void {
  const select = $<HTMLSelectElement>("#cur-code");
  for (const code of [...ARAB_CODES, "ILS", "USD", "EUR"]) {
    const opt = document.createElement("option");
    const name = getCurrencyInfo(code).displayName;
    opt.value = code;
    opt.textContent = name ? `${code} · ${name}` : code;
    select.appendChild(opt);
  }
  select.value = "SAR";

  const amount = $<HTMLInputElement>("#cur-amount");
  const arab = $<HTMLInputElement>("#cur-arab");
  const acc = $<HTMLInputElement>("#cur-acc");
  const out = $("#cur-out");
  const note = $("#cur-note");
  const snip = $("#cur-snip");
  const getMode = segmented("#cur-mode", render);

  function render(): void {
    const mode = (getMode() || "auto") as SymbolMode;
    let value = Number(amount.value || 0);
    // Accounting notation only shows for negatives — make the demo visible.
    if (acc.checked && value > 0) value = -value;

    const opts: Parameters<typeof formatCurrency>[1] = { currency: select.value };
    if (arab.checked) opts.numerals = "arab";
    if (mode !== "auto") opts.symbolMode = mode;
    if (acc.checked) opts.accounting = true;

    let result: string;
    try {
      result = formatCurrency(value, opts);
    } catch (e) {
      result = String(e);
    }
    out.textContent = result;

    const pretty = Object.entries(opts)
      .map(([k, v]) => `${k}: ${typeof v === "string" ? `"${v}"` : v}`)
      .join(", ");
    snip.textContent = `formatCurrency(${value}, { ${pretty} })`;

    // If the result contains a brand-new sign the user's fonts lack, say so.
    const info = getCurrencyInfo(select.value);
    const sign = info.symbols.new;
    if (sign && result.includes(sign) && !glyphSupported(sign)) {
      const when = upcoming(info.unicode!.released)
        ? `ships in Unicode ${info.unicode!.unicodeVersion} (${prettyMonth(info.unicode!.released)})`
        : `is brand new (Unicode ${info.unicode!.unicodeVersion})`;
      note.innerHTML =
        `That box is <strong>${info.unicode!.codepoint}</strong> — the new ${info.code} sign ${when}, ` +
        `so your fonts don't draw it yet. arabicfmt tracks this: <strong>symbolMode: "text"</strong> always renders.`;
      note.hidden = false;
    } else {
      note.hidden = true;
    }
  }

  [amount, select, arab, acc].forEach((el) => el.addEventListener("input", render));
  render();
  transitionTracker();
}

const upcoming = (released: string): boolean => new Date(`${released}-15T00:00:00Z`).getTime() > Date.now();
const prettyMonth = (released: string): string =>
  new Date(`${released}-15T00:00:00Z`).toLocaleDateString("en", { month: "short", year: "numeric", timeZone: "UTC" });

function transitionTracker(): void {
  const rows = $("#transition-rows");
  const names: Record<string, string> = { SAR: "Saudi riyal", AED: "UAE dirham", OMR: "Omani rial" };
  for (const code of ["SAR", "AED", "OMR"]) {
    const u = getCurrencyInfo(code).unicode;
    if (!u) continue;
    const sign = getCurrencyInfo(code).symbols.new ?? "";
    const hasGlyph = glyphSupported(sign);
    const shipped = !upcoming(u.released);

    const row = document.createElement("div");
    row.className = "transition-row";
    row.innerHTML = `
      <span class="sign">${hasGlyph ? sign : `<small style="font-size:10px;font-family:var(--font-mono);color:var(--ink-faint)">${u.codepoint.replace("U+", "")}</small>`}</span>
      <span class="cur-name">${names[code]} · <bdi lang="ar">${getCurrencyInfo(code).symbols.text}</bdi></span>
      <span class="cp">${u.codepoint}</span>
      <span class="badge ${shipped ? "live" : "soon"}">${shipped ? `Unicode ${u.unicodeVersion} · since ${prettyMonth(u.released)}` : `ships in Unicode ${u.unicodeVersion} · ${prettyMonth(u.released)}`}</span>
      <span class="badge ${hasGlyph ? "font-ok" : "font-no"}">${hasGlyph ? "renders on your device ✓" : "not in your fonts yet"}</span>`;
    rows.appendChild(row);
  }
}

// ---------------------------------------------------------------- tafqit

function tafqitCard(): void {
  const select = $<HTMLSelectElement>("#taf-code");
  for (const code of TAFQIT_CODES) {
    const opt = document.createElement("option");
    const name = getCurrencyInfo(code).displayName;
    opt.value = code;
    opt.textContent = name ? `${code} · ${name}` : code;
    select.appendChild(opt);
  }
  select.value = "SAR";

  const amount = $<HTMLInputElement>("#taf-amount");
  const suffix = $<HTMLInputElement>("#taf-suffix");
  const out = $("#taf-out");
  const snip = $("#taf-snip");

  function render(): void {
    const value = Number(amount.value || 0);
    try {
      out.textContent = spellCurrency(value, {
        currency: select.value,
        ...(suffix.checked ? { suffix: true } : {}),
      });
    } catch (e) {
      out.textContent = String(e);
    }
    snip.textContent = `spellCurrency(${value}, { currency: "${select.value}"${suffix.checked ? ", suffix: true" : ""} })`;
  }
  [amount, select, suffix].forEach((el) => el.addEventListener("input", render));
  render();
}

// ---------------------------------------------------------------- words & ordinal

function wordsCard(): void {
  const input = $<HTMLInputElement>("#words-n");
  const out = $("#words-out");
  const ordinalOut = $("#ordinal-out");
  const snip = $("#words-snip");
  const getGender = segmented("#words-gender", render);

  function render(): void {
    const n = Number(input.value || 0);
    const gender = getGender() as "male" | "female";
    const opts = gender === "female" ? { gender } : undefined;
    try {
      out.textContent = arabicToWords(n, opts);
    } catch (e) {
      out.textContent = String(e);
    }
    const int = Math.trunc(Math.abs(n));
    try {
      ordinalOut.textContent = int >= 1 ? arabicOrdinal(int, opts) : "—";
    } catch {
      ordinalOut.textContent = "—";
    }
    snip.textContent = `arabicToWords(${n}${opts ? ', { gender: "female" }' : ""})`;
  }
  input.addEventListener("input", render);
  render();
}

// ---------------------------------------------------------------- counted nouns & fractions

const NOUNS: Record<string, { label: string; forms: CountedNoun }> = {
  book: {
    label: "bookForms",
    forms: { gender: "male", singular: "كتاب", dual: "كتابان", plural: "كتب", accusative: "كتاباً" },
  },
  hour: {
    label: "hourForms",
    forms: { gender: "female", singular: "ساعة", dual: "ساعتان", plural: "ساعات", accusative: "ساعةً" },
  },
  riyal: {
    label: "riyalForms",
    forms: { gender: "male", singular: "ريال", dual: "ريالان", plural: "ريالات", accusative: "ريالاً" },
  },
};

function countCard(): void {
  const input = $<HTMLInputElement>("#count-n");
  const out = $("#count-out");
  const fracOut = $("#frac-out");
  const snip = $("#count-snip");
  const getNoun = segmented("#count-noun", render);
  const getNum = segmented("#frac-num", renderFraction);
  const getDen = segmented("#frac-den", renderFraction);

  function render(): void {
    const n = Math.max(1, Math.trunc(Number(input.value || 1)));
    const noun = NOUNS[getNoun() || "book"]!;
    try {
      out.textContent = countedNoun(n, noun.forms);
    } catch (e) {
      out.textContent = String(e);
    }
    snip.textContent = `countedNoun(${n}, ${noun.label})  // "${out.textContent}"`;
  }
  function renderFraction(): void {
    const num = Number(getNum() || 1);
    const den = Number(getDen() || 4);
    fracOut.textContent = arabicFraction(num, den) || "—";
    snip.textContent = `arabicFraction(${num}, ${den})  // "${arabicFraction(num, den)}"`;
  }
  input.addEventListener("input", render);
  renderFraction();
  render();
}

// ---------------------------------------------------------------- hijri

function hijriCard(): void {
  const dateInput = $<HTMLInputElement>("#hijri-date");
  const out = $("#hijri-out");
  const struct = $("#hijri-struct");
  const roundtrip = $("#hijri-roundtrip");
  const snip = $("#hijri-snip");

  const today = new Date();
  dateInput.value = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const getNumerals = segmented("#hijri-numerals", render);
  const getLocale = segmented("#hijri-locale", render);

  function render(): void {
    const date = dateInput.value ? new Date(`${dateInput.value}T12:00:00`) : new Date();
    const numerals = getNumerals();
    const locale = getLocale() || "ar";
    const opts: Record<string, string> = {};
    if (locale !== "ar") opts.locale = locale;
    if (numerals === "arab") opts.numerals = "arab";
    try {
      const formatted = formatHijri(date, opts);
      out.textContent = formatted;
      out.dir = locale === "ar" ? "rtl" : "ltr";
      const h = toHijri(date);
      struct.textContent = `{ year: ${h.year}, month: ${h.month}, day: ${h.day} }`;
      const g = fromHijri(h.year, h.month, h.day);
      roundtrip.textContent = `${h.year}-${String(h.month).padStart(2, "0")}-${String(h.day).padStart(2, "0")} AH → ${g.toISOString().slice(0, 10)} — round-trips exactly`;
    } catch {
      out.textContent = "Umm al-Qura tables cover AH 1300–1599 (1882–2174 CE)";
      out.dir = "ltr";
      struct.textContent = "—";
      roundtrip.textContent = "—";
    }
    const optsStr = Object.entries(opts).map(([k, v]) => `${k}: "${v}"`).join(", ");
    snip.textContent = `formatHijri(date${optsStr ? `, { ${optsStr} }` : ""})  // arabicfmt/umalqura`;
  }
  dateInput.addEventListener("input", render);
  render();
}

// ---------------------------------------------------------------- plurals

function pluralsCard(): void {
  const FORMS = {
    zero: "لا كتب",
    one: "كتاب واحد",
    two: "كتابان",
    few: "كتب",
    many: "كتاباً",
    other: "كتاب",
  };
  const slider = $<HTMLInputElement>("#plural-n");
  const val = $("#plural-val");
  const out = $("#plural-out");
  const snip = $("#plural-snip");
  const chips = [...$("#plural-chips").children] as HTMLElement[];

  function render(): void {
    const n = Number(slider.value);
    val.textContent = String(n);
    const form = arabicPluralForm(n);
    chips.forEach((c) => c.classList.toggle("on", c.dataset.f === form));
    out.textContent = arabicPlural(n, FORMS);
    snip.textContent = `arabicPlural(${n}, forms)  // form: "${form}"`;
  }
  slider.addEventListener("input", render);
  render();
}

// ---------------------------------------------------------------- parse it back

function parseCard(): void {
  const input = $<HTMLInputElement>("#parse-in");
  const cur = $("#parse-cur");
  const num = $("#parse-num");
  const latin = $("#parse-latin");
  const arab = $("#parse-arab");
  const snip = $("#parse-snip");

  function render(): void {
    const v = input.value;
    const parsedCur = parseCurrency(v);
    const parsedNum = parseNumber(v);
    cur.textContent = String(parsedCur);
    num.textContent = String(parsedNum);
    latin.textContent = toLatinDigits(v);
    arab.textContent = toArabicDigits(toLatinDigits(v));
    snip.textContent = `parseCurrency(${JSON.stringify(v)})  // ${parsedCur}`;
  }
  input.addEventListener("input", render);
  $("#parse-samples").addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest("button");
    if (!btn) return;
    input.value = btn.textContent ?? "";
    render();
  });
  render();
}

// ---------------------------------------------------------------- sorting & lists

function sortCard(): void {
  const input = $<HTMLInputElement>("#sort-in");
  const naive = $("#sort-naive");
  const good = $("#sort-good");
  const listOut = $("#list-out");
  const snip = $("#sort-snip");
  const getType = segmented("#list-type", render);

  function render(): void {
    const items = input.value
      .split(/[،,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const type = (getType() || "conjunction") as "conjunction" | "disjunction";
    naive.textContent = [...items].sort().join("، ");
    const sorted = sortArabic(items);
    good.textContent = sorted.join("، ");
    listOut.textContent = formatList(sorted, { type });
    snip.textContent = `formatList(sortArabic(names)${type === "disjunction" ? ', { type: "disjunction" }' : ""})`;
  }
  input.addEventListener("input", render);
  render();
}

// ---------------------------------------------------------------- bidi

function bidiCard(): void {
  const input = $<HTMLInputElement>("#bidi-in");
  const before = $("#bidi-before");
  const after = $("#bidi-after");
  function render(): void {
    before.textContent = input.value;
    after.textContent = isolateForeign(input.value);
  }
  input.addEventListener("input", render);
  render();
}

// ---------------------------------------------------------------- everyday grid

function everydayCard(): void {
  const relOut = $("#rel-out");
  const REL: Record<string, number> = { "-3d": -3 * 86_400_000, "-2h": -2 * 3_600_000, "45m": 45 * 60_000, "7d": 7 * 86_400_000 };
  const getRel = segmented("#rel-pick", () => {
    relOut.textContent = formatRelativeTime(new Date(Date.now() + (REL[getRel()] ?? 0)));
  });
  relOut.textContent = formatRelativeTime(new Date(Date.now() + REL["-3d"]!));

  const durOut = $("#dur-out");
  const getDur = segmented("#dur-pick", () => {
    durOut.textContent = formatDuration(Number(getDur()));
  });
  durOut.textContent = formatDuration(7_500_000);

  const sizeOut = $("#size-out");
  const getSize = segmented("#size-pick", () => {
    sizeOut.textContent = formatFileSize(Number(getSize()));
  });
  sizeOut.textContent = formatFileSize(5 * 1024 * 1024);

  const compactOut = $("#compact-out");
  const getCompact = segmented("#compact-pick", () => {
    compactOut.textContent = formatCompact(Number(getCompact()), { locale: "ar", numerals: "arab" });
  });
  compactOut.textContent = formatCompact(1_500_000, { locale: "ar", numerals: "arab" });

  const pctOut = $("#pct-out");
  const getPct = segmented("#pct-pick", () => {
    pctOut.textContent = formatPercent(Number(getPct()), { locale: "ar", numerals: "arab" });
  });
  pctOut.textContent = formatPercent(0.42, { locale: "ar", numerals: "arab" });

  const numOut = $("#num-out");
  const getNum = segmented("#num-pick", () => {
    numOut.textContent = formatNumber(Number(getNum()), { locale: "ar", numerals: "arab" });
  });
  numOut.textContent = formatNumber(1_234_567.89, { locale: "ar", numerals: "arab" });
}

// ---------------------------------------------------------------- text tools

function textCard(): void {
  const input = $<HTMLInputElement>("#text-in");
  const strip = $("#text-strip");
  const norm = $("#text-norm");
  const translit = $("#text-translit");
  const slug = $("#text-slug");
  const snip = $("#text-snip");

  function render(): void {
    const v = input.value;
    strip.textContent = stripTashkeel(v);
    norm.textContent = normalizeForSearch(v);
    translit.textContent = transliterate(v);
    slug.textContent = slugify(v);
    snip.textContent = `slugify("${v}")  // "${slugify(v)}"`;
  }
  input.addEventListener("input", render);
  render();
}

// ---------------------------------------------------------------- validation

function validateCard(): void {
  const ibanIn = $<HTMLInputElement>("#iban-in");
  const ibanOut = $("#iban-result");
  const sidIn = $<HTMLInputElement>("#sid-in");
  const sidOut = $("#sid-result");

  function renderIban(): void {
    const v = ibanIn.value.trim();
    if (!v) {
      ibanOut.innerHTML = `<span class="mini-label">ISO 7064 mod-97 checksum</span>`;
      return;
    }
    ibanOut.innerHTML = isValidIBAN(v)
      ? `<span class="ok">✓ valid</span><code>${formatIBAN(v)}</code>`
      : `<span class="nope">✗ invalid — checksum or length fails</span>`;
  }
  function renderSid(): void {
    const v = sidIn.value.trim();
    if (!v) {
      sidOut.innerHTML = `<span class="mini-label">Luhn check digit</span>`;
      return;
    }
    if (isValidSaudiId(v)) {
      const type = saudiIdType(v);
      sidOut.innerHTML = `<span class="ok">✓ valid</span><code>saudiIdType → "${type}"</code>`;
    } else {
      sidOut.innerHTML = `<span class="nope">✗ invalid ID</span>`;
    }
  }

  ibanIn.addEventListener("input", renderIban);
  sidIn.addEventListener("input", renderSid);
  $("#iban-demo").addEventListener("click", () => {
    ibanIn.value = "SA03 8000 0000 6080 1016 7519";
    renderIban();
  });
  let sidToggle = false;
  $("#sid-demo").addEventListener("click", () => {
    sidIn.value = sidToggle ? "2100000005" : "1012345672";
    sidToggle = !sidToggle;
    renderSid();
  });
  renderIban();
  renderSid();
}

// ---------------------------------------------------------------- boot

masthead();
heroTicker();
currencyCard();
tafqitCard();
wordsCard();
countCard();
hijriCard();
pluralsCard();
parseCard();
sortCard();
bidiCard();
everydayCard();
textCard();
validateCard();
wireCopyButtons();
