// One local storage key per control lets simultaneous edits merge naturally.
const MyTube = (() => {
  const defaults = Object.freeze({
    ads: true, shorts: true, community: true, autoplay: true,
    comments: false, explore: false, more: false, annotations: false,
    sidebar: false, home: false, endFeed: false, endCards: false,
    mixes: false, info: false, merch: false
  });
  function readSettings(values) {
    return Object.fromEntries(Object.entries(defaults).map(([key, fallback]) =>
      [key, typeof values[key] === "boolean" ? values[key] : fallback]));
  }

  async function observe(render) {
    let revision = 0;
    async function refresh() {
      const version = ++revision;
      const values = await chrome.storage.local.get(Object.keys(defaults));
      if (version === revision) render(readSettings(values));
    }
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && Object.keys(changes).some(key => key in defaults)) refresh();
    });
    await refresh();
  }
  return { defaults, readSettings, observe };
})();
if (typeof module !== "undefined") module.exports = MyTube;
