import { type Highlighter, createHighlighter } from 'shiki';

let highlighter: Highlighter | null = null;
let initPromise: Promise<void> | null = null;

function init(): Promise<void> {
  if (!initPromise) {
    initPromise = createHighlighter({
      themes: ['vitesse-dark', 'vitesse-light'],
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
    themes: { dark: 'vitesse-dark', light: 'vitesse-light' },
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
