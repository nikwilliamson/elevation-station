import StyleDictionary from 'style-dictionary';
import { writeFileSync } from 'fs';

const buildPath = 'src/tokens/';
const outputFile = 'tokens.css';

// Dark / default build — :root
const dark = new StyleDictionary({
  source: ['tokens/*.json', 'tokens/components/*.json', 'src/components/**/*.tokens.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath,
      files: [
        {
          destination: '_dark.css',
          format: 'css/variables',
          options: { outputReferences: true },
        },
      ],
    },
  },
});

// Light build — [data-theme="light"]
// `include` pulls in all tokens for reference resolution;
// `source` supplies only the overrides that differ.
const light = new StyleDictionary({
  log: { warnings: 'disabled' },
  include: ['tokens/*.json', 'tokens/components/*.json', 'src/components/**/*.tokens.json'],
  source: ['tokens/themes/light/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath,
      files: [
        {
          destination: '_light.css',
          format: 'css/variables',
          options: {
            outputReferences: true,
            selector: '[data-theme="light"]',
          },
        },
      ],
    },
  },
});

await dark.buildAllPlatforms();
await light.buildAllPlatforms();

// Concatenate into a single file
const header = `/**\n * Do not edit directly, this file was auto-generated.\n */\n\n`;
const darkCSS = (await import('fs')).readFileSync(`${buildPath}_dark.css`, 'utf8')
  .replace(/\/\*\*[\s\S]*?\*\/\s*/, ''); // strip SD header
const lightCSS = (await import('fs')).readFileSync(`${buildPath}_light.css`, 'utf8')
  .replace(/\/\*\*[\s\S]*?\*\/\s*/, ''); // strip SD header

writeFileSync(`${buildPath}${outputFile}`, header + darkCSS + '\n' + lightCSS);

// Clean up temp files
(await import('fs')).unlinkSync(`${buildPath}_dark.css`);
(await import('fs')).unlinkSync(`${buildPath}_light.css`);
