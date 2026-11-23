const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function player({ enabled = true, ad = false, path = "/watch" } = {}) {
  const events = {};
  class Video {
    constructor() {
      this.duration = 100;
      this.currentTime = 99.9;
      this.playbackRate = 1;
      this.paused = false;
    }
    closest(selector) { return selector.startsWith(".ad-showing") ? ad : true; }
    pause() { this.paused = true; }
  }
  const context = {
    MyTube: { observe: fn => fn({ autoplay: enabled }) },
    window: { addEventListener: (name, fn) => { events[name] = fn; } },
    document: { documentElement: { setAttribute() {} }, addEventListener() {} },
    location: { pathname: path }, HTMLVideoElement: Video
  };
  vm.runInNewContext(fs.readFileSync("extension/content.js", "utf8"), context);
  const video = new Video();
  return { video, dispatch: name => {
    let stopped = false;
    events[name]?.({ target: video, stopImmediatePropagation() { stopped = true; } });
    return stopped;
  }};
}

test("end of content pauses a playlist item and leaves it ready for replay", () => {
  const { video, dispatch } = player();
  video.currentTime = video.duration;
  assert.equal(dispatch("ended"), true);
  assert.equal(video.paused, true);
  assert.equal(video.currentTime, video.duration);
});

test("a normal time update leaves playback alone", () => {
  const { video, dispatch } = player();
  video.currentTime = 75;
  dispatch("timeupdate");
  assert.equal(video.paused, false);
});

for (const options of [{ enabled:false }, { ad:true }, { path:"/shorts/id" }]) {
  test("leaves playback alone for " + JSON.stringify(options), () => {
    const { video, dispatch } = player(options);
    dispatch("timeupdate");
    assert.equal(video.paused, false);
    assert.equal(dispatch("ended"), false);
  });
}
