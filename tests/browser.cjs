// Run against the unpacked release, with network-independent YouTube fixtures.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

async function main() {
  const extension = path.resolve(process.env.EXTENSION_DIR || "extension");
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "mytube-"));
  const context = await chromium.launchPersistentContext(profile, {
    channel: "chromium", headless: true, viewport: { width: 1280, height: 800 },
    args: ["--disable-extensions-except=" + extension, "--load-extension=" + extension]
  });
  try {
    const worker = context.serviceWorkers()[0] || await context.waitForEvent("serviceworker");
    const settings = await context.newPage();
    await settings.goto(new URL("settings.html", worker.url()).href);
    const toggle = settings.locator('[name="community"]');
    await settings.waitForFunction(() => document.querySelector('[name="community"]').checked);
    fs.mkdirSync("dist", { recursive: true });
    await settings.screenshot({ path: "dist/mytube-settings.png" });

    for (const host of ["www.youtube.com", "m.youtube.com"]) {
      const mobile = host.startsWith("m.");
      const item = mobile ? "ytm-rich-item-renderer" : "ytd-rich-item-renderer";
      const post = mobile ? "ytm-poll-renderer" : "ytd-backstage-post-renderer";
      const page = await context.newPage();
      if (mobile) await page.setViewportSize({ width:390, height:844 });
      await page.route("https://" + host + "/**", route => route.fulfill({
        contentType:"text/html",
        body:'<!doctype html><style>*{box-sizing:border-box}body>*{display:block}</style>' +
          '<' + item + ' id="normal">Video</' + item + '>'
      }));
      await page.goto("https://" + host + "/");
      await page.locator("body").evaluate((body, { item, post }) => {
        body.insertAdjacentHTML("beforeend", '<' + item + ' id="post"><' + post + '>Poll</' + post + '></' + item + '>');
      }, { item, post });
      await page.locator("#post").waitFor({ state:"hidden" });
      assert(await page.locator("#normal").isVisible());
      await toggle.uncheck();
      await page.locator("#post").waitFor({ state:"visible" });
      await settings.reload();
      await settings.waitForFunction(() => !document.querySelector("fieldset").disabled);
      assert.equal(await toggle.isChecked(), false);
      await toggle.check();
      await page.locator("#post").waitFor({ state:"hidden" });
      await page.close();
    }
    const ads = settings.locator('[name="ads"]');
    for (const enabled of [false, true]) {
      await ads.setChecked(enabled);
      await settings.waitForFunction(async expected =>
        (await chrome.declarativeNetRequest.getEnabledRulesets()).includes("ads") === expected, enabled);
    }
  } finally {
    await context.close();
    fs.rmSync(profile, { recursive:true, force:true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
