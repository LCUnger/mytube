// The browser retains static ruleset state between worker wake-ups.
// Reconcile after extension updates, startup, and concurrent setting changes.
let pending = Promise.resolve();
function reconcile() {
  pending = pending.then(async () => {
    const { ads } = await chrome.storage.local.get({ ads: true });
    const enabled = await chrome.declarativeNetRequest.getEnabledRulesets();
    if (enabled.includes("ads") !== (ads !== false)) {
      await chrome.declarativeNetRequest.updateEnabledRulesets(
        ads === false ? { disableRulesetIds: ["ads"] } : { enableRulesetIds: ["ads"] });
    }
  }).catch(error => console.error("MyTube could not update ad rules", error));
}
chrome.runtime.onInstalled.addListener(reconcile);
chrome.runtime.onStartup.addListener(reconcile);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.ads) reconcile();
});
