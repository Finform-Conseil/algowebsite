import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const STYLES_ROOT = path.join(ROOT, "styles");
const TOKENS_PATH = path.join(STYLES_ROOT, "abstracts/_tokens.scss");
const THEME_PATH = path.join(STYLES_ROOT, "abstracts/_variables.scss");
const GLOBALS_PATH = path.join(STYLES_ROOT, "globals.scss");

const read = (filePath) => fs.readFileSync(filePath, "utf8");

const walkScss = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const absolutePath = path.join(directory, entry.name);
  if (entry.isDirectory()) return walkScss(absolutePath);
  return entry.isFile() && entry.name.endsWith(".scss") ? [absolutePath] : [];
});

const sassDefinitions = (source) => new Set(
  Array.from(source.matchAll(/^\s*\$([\w-]+)\s*:/gm), (match) => match[1]),
);

const keyframeDefinitions = (source) =>
  Array.from(source.matchAll(/^\s*@(?:-webkit-)?keyframes\s+([\w-]+)/gm), (match) => match[1]);

test("Sass architecture has no legacy @import directives", () => {
  const offenders = walkScss(STYLES_ROOT)
    .flatMap((filePath) => read(filePath).match(/^\s*@import\b.*$/gm)?.map((line) => ({
      file: path.relative(ROOT, filePath),
      line: line.trim(),
    })) ?? []);

  assert.deepEqual(offenders, []);
});

test("a Sass module does not redefine the same keyframe name", () => {
  const offenders = [];

  for (const filePath of walkScss(STYLES_ROOT)) {
    const names = keyframeDefinitions(read(filePath));
    const duplicates = [...new Set(names.filter((name, index) => names.indexOf(name) !== index))];

    if (duplicates.length > 0) {
      offenders.push({
        file: path.relative(ROOT, filePath),
        keyframes: duplicates,
      });
    }
  }

  assert.deepEqual(offenders, []);
});

test("compile-time Sass tokens have one source of truth", () => {
  const tokenDefinitions = sassDefinitions(read(TOKENS_PATH));
  const themeDefinitions = sassDefinitions(read(THEME_PATH));

  assert.ok(tokenDefinitions.size > 0, "_tokens.scss must own the compile-time design tokens");
  assert.deepEqual(
    [...themeDefinitions],
    [],
    "_variables.scss is runtime theme CSS only and must not redefine Sass tokens",
  );
});

test("global stylesheet composes runtime theme CSS and compile-time tokens explicitly", () => {
  const globals = read(GLOBALS_PATH);
  const theme = read(THEME_PATH);

  assert.match(globals, /@use\s+['"]abstracts\/tokens['"]\s+as\s+\*\s*;/);
  assert.match(globals, /@include\s+meta\.load-css\(['"]abstracts\/variables['"]\)\s*;/);
  assert.match(theme, /:root\s*\{/);
  assert.match(theme, /\[data-theme=['"]light['"]\]\s*\{/);
});
