(() => {
  let settings = {};
  let routeFrame = 0;

  function updateRoute() {
    routeFrame = 0;
    const path = location.pathname;
    const route = path === "/" ? "home" : path === "/watch" ? "watch" : "other";
    document.documentElement?.setAttribute("data-mytube-route", route);
  }
  function queueRoute() {
    if (!routeFrame) routeFrame = requestAnimationFrame(updateRoute);
  }
  for (const event of ["yt-navigate-finish", "yt-page-data-updated", "state-navigateend"]) {
    document.addEventListener(event, queueRoute);
  }
  window.addEventListener("popstate", queueRoute);
  window.navigation?.addEventListener("currententrychange", queueRoute);

  MyTube.observe(values => {
    settings = values;
    function apply() {
      updateRoute();
      document.documentElement.setAttribute("data-mytube",
        Object.keys(values).filter(key => values[key]).join(" "));
    }
    if (document.documentElement) apply();
    else document.addEventListener("DOMContentLoaded", apply, { once: true });
  });

  function isMainVideo(video) {
    return video instanceof HTMLVideoElement && location.pathname === "/watch" &&
      video.closest("#movie_player, .html5-video-player, ytm-player, #player") &&
      !video.closest(".ad-showing, .ad-interrupting");
  }

  // Capture at the window before the player's video-level ended listeners.
  // Preserve the final frame and native replay behavior; manual Next is a
  // separate click and never passes through this handler.
  window.addEventListener("ended", event => {
    if (settings.autoplay && isMainVideo(event.target)) {
      event.stopImmediatePropagation();
      event.target.pause();
    }
  }, true);
})();
