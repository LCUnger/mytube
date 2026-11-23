// When an inline ad shares the video stream, YouTube may still expose a
// skip control. Use only that control; never seek through the content video.
(() => {
  let enabled = false;
  let player;
  let frame = 0;
  const controls = ".ytp-ad-skip-button, .ytp-skip-ad-button, .ytp-ad-skip-button-modern";
  const observer = new MutationObserver(schedule);
  function schedule() {
    if (!frame) frame = requestAnimationFrame(inspect);
  }
  function inspect() {
    frame = 0;
    if (!enabled) return;
    const current = document.querySelector("#movie_player, .html5-video-player");
    if (player !== current) {
      observer.disconnect();
      player = current;
      if (player) observer.observe(player, {
        childList: true, subtree: true, attributes: true,
        attributeFilter: ["class", "style", "hidden", "disabled"]
      });
    }
    if (!player?.matches(".ad-showing, .ad-interrupting")) return;
    for (const button of player.querySelectorAll(controls)) {
      if (!button.disabled && button.getClientRects().length &&
          getComputedStyle(button).visibility === "visible") {
        button.click();
        break;
      }
    }
  }
  document.addEventListener("DOMContentLoaded", schedule);
  document.addEventListener("yt-navigate-finish", schedule);
  document.addEventListener("loadedmetadata", schedule, true);
  MyTube.observe(settings => {
    enabled = settings.ads;
    if (enabled) schedule();
    else {
      observer.disconnect();
      player = null;
    }
  });
})();
