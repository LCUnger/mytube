const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { defaults, readSettings } = require("../extension/settings.js");

test("fresh installs enable precisely the four selected defaults", () => {
  assert.deepEqual(Object.keys(defaults).filter(key => defaults[key]),
    ["ads", "shorts", "community", "autoplay"]);
  assert.equal(Object.keys(defaults).length, 15);
});

test("invalid or older settings fall back per switch", () => {
  const settings = readSettings({ ads: false, shorts: null, home: true, typo: true });
  assert.equal(settings.ads, false);
  assert.equal(settings.shorts, true);
  assert.equal(settings.home, true);
  assert.equal(settings.typo, undefined);
});

test("the panel has one control for every setting", () => {
  const html = fs.readFileSync("extension/settings.html", "utf8");
  const keys = Array.from(html.matchAll(/type="checkbox" name="(\w+)"/g), m => m[1]);
  assert.deepEqual(keys.sort(), Object.keys(defaults).sort());
});
