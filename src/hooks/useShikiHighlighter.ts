import { type Highlighter, type ThemeRegistrationRaw, createHighlighter } from 'shiki';

/* ── Custom themes using project token colors ────────────────────────── */

/**
 * Hex approximations of the project's oklch design tokens.
 *
 * Pink  ≈ --color-brand-pink   oklch(62.79% 0.2002 330.35)
 * Blue  ≈ --color-brand-blue   oklch(51.4% 0.1863 270.26)
 * Yellow ≈ --color-brand-yellow oklch(87.19% 0.1243 80.69)
 * Neutrals follow the purple-tinted gray ramp (hue ~293).
 */

const sharedScopes = {
  comment: ['comment', 'punctuation.definition.comment'],
  string: ['string', 'string.quoted', 'string.quoted.double'],
  numeric: ['constant.numeric', 'constant.language'],
  property: [
    'variable.css',
    'variable.other',
    'variable.argument',
    'support.type.property-name',
    'entity.other.attribute-name',
  ],
  keyword: ['keyword', 'keyword.other.unit', 'storage.type', 'storage.modifier'],
  function: ['support.function', 'entity.name.function', 'entity.name.tag'],
  punctuation: [
    'punctuation',
    'punctuation.separator',
    'punctuation.terminator',
    'punctuation.section',
    'punctuation.definition',
    'meta.brace',
  ],
};

const elevationDark: ThemeRegistrationRaw = {
  name: 'elevation-dark',
  type: 'dark',
  settings: [
    { settings: { foreground: '#d8d0e6', background: '#1a1030' } },
    { scope: sharedScopes.comment, settings: { foreground: '#786c93', fontStyle: 'italic' } },
    { scope: sharedScopes.string, settings: { foreground: '#d4a84a' } },
    { scope: sharedScopes.numeric, settings: { foreground: '#809fff' } },
    { scope: sharedScopes.property, settings: { foreground: '#e466b5' } },
    { scope: sharedScopes.keyword, settings: { foreground: '#809fff' } },
    { scope: sharedScopes.function, settings: { foreground: '#809fff' } },
    { scope: ['meta.function.variable support.function'], settings: { foreground: '#d4a84a' } },
    { scope: sharedScopes.punctuation, settings: { foreground: '#9d92b3' } },
  ],
};

const elevationLight: ThemeRegistrationRaw = {
  name: 'elevation-light',
  type: 'light',
  settings: [
    { settings: { foreground: '#2d1f4e', background: '#ffffff' } },
    { scope: sharedScopes.comment, settings: { foreground: '#9d92b3', fontStyle: 'italic' } },
    { scope: sharedScopes.string, settings: { foreground: '#8b6914' } },
    { scope: sharedScopes.numeric, settings: { foreground: '#2d5fe5' } },
    { scope: sharedScopes.property, settings: { foreground: '#c23690' } },
    { scope: sharedScopes.keyword, settings: { foreground: '#2d5fe5' } },
    { scope: sharedScopes.function, settings: { foreground: '#2d5fe5' } },
    { scope: ['meta.function.variable support.function'], settings: { foreground: '#8b6914' } },
    { scope: sharedScopes.punctuation, settings: { foreground: '#7b6f93' } },
  ],
};

/* ── Highlighter singleton ───────────────────────────────────────────── */

let highlighter: Highlighter | null = null;
let initPromise: Promise<void> | null = null;

function init(): Promise<void> {
  if (!initPromise) {
    initPromise = createHighlighter({
      themes: [elevationDark, elevationLight],
      langs: ['css', 'json'],
    }).then((h) => {
      highlighter = h;
    });
  }
  return initPromise;
}

// Kick off loading immediately at module evaluation time
init();

export function highlight(code: string, lang: 'css' | 'json'): string | null {
  if (!highlighter) return null;
  return highlighter.codeToHtml(code, {
    lang,
    themes: { dark: 'elevation-dark', light: 'elevation-light' },
    defaultColor: false,
  });
}

export function ready(): boolean {
  return highlighter !== null;
}

/** Returns a promise that resolves once the highlighter is loaded. */
export function waitForReady(): Promise<void> {
  return init();
}
