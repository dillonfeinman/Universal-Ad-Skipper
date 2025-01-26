function checkForAdsAndShadowRoot(node, parent, added) {
  // Only proceed with supposed removal if node is missing from DOM
  if (!added && document.body?.contains(node)) {
    return;
  }

  // If "Ad" is found, set the playback rate to 16 and mute the videos
  if (node.nodeType === Node.TEXT_NODE && node.textContent.includes("Ad")) {
    if (added) {
      console.log('Ad found in text node:', node);
      var videos = document.querySelectorAll("video");
      videos.forEach(video => {
        video.playbackRate = 16;
        video.muted = true; // Mute the video
        console.log('Video playback rate set to 16 and muted for video:', video);
      });
    }
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    // Check if the element contains the text "Ad"
    if (node.textContent.includes("Ad")) {
      if (added) {
        console.log('Ad found in element:', node);
        var videos = document.querySelectorAll("video");
        videos.forEach(video => {
          video.playbackRate = 16;
          video.muted = true; // Mute the video
          console.log('Video playback rate set to 16 and muted for video:', video);
        });
      }
    }

    var children = [];
    if (node.shadowRoot) {
      documentAndShadowRootObserver.observe(node.shadowRoot, documentAndShadowRootObserverOptions);
      children = Array.from(node.shadowRoot.children);
    }
    if (node.children) {
      children = [...children, ...node.children];
    }
    for (const child of children) {
      checkForAdsAndShadowRoot(child, child.parentNode || parent, added);
    }
  }
}

function resetVideoSpeedAndUnmute() {
  var videos = document.querySelectorAll("video");
  videos.forEach(video => {
    video.playbackRate = 1; // Reset playback rate to 1 (normal speed)
    video.muted = false; // Unmute the video
    console.log('Video playback rate reset to 1 and unmuted for video:', video);
  });
}

var documentAndShadowRootObserver = new MutationObserver(function (mutations) {
  // Process the DOM nodes lazily
  requestIdleCallback(
    (_) => {
      mutations.forEach(function (mutation) {
        switch (mutation.type) {
          case "childList":
            mutation.addedNodes.forEach(function (node) {
              if (typeof node === "function") return;
              if (node === document.documentElement) {
                log("Document was replaced, reinitializing", 5);
                initializeWhenReady(document);
                return;
              }
              checkForAdsAndShadowRoot(node, node.parentNode || mutation.target, true);
            });
            mutation.removedNodes.forEach(function (node) {
              if (typeof node === "function") return;
              // If the "Ad" node is removed, reset the video speed and unmute
              if (node.nodeType === Node.TEXT_NODE && node.textContent.includes("Ad")) {
                console.log('Ad removed from text node:', node);
                resetVideoSpeedAndUnmute();
              } else if (node.nodeType === Node.ELEMENT_NODE && node.textContent.includes("Ad")) {
                console.log('Ad removed from element:', node);
                resetVideoSpeedAndUnmute();
              }
              checkForAdsAndShadowRoot(node, node.parentNode || mutation.target, false);
            });
            break;
          case "attributes":
            if (
              (mutation.target.attributes["aria-hidden"] &&
              mutation.target.attributes["aria-hidden"].value == "false")
              || mutation.target.nodeName === 'APPLE-TV-PLUS-PLAYER'
            ) {
              var flattenedNodes = getShadow(document.body);
              var nodes = flattenedNodes.filter(
                (x) => x.tagName == "VIDEO"
              );
              for (let node of nodes) {
                if (node.vsc && mutation.target.nodeName === 'APPLE-TV-PLUS-PLAYER')
                  continue;
                if (node.vsc)
                  node.vsc.remove();
                checkForAdsAndShadowRoot(node, node.parentNode || mutation.target, true);
              }
            }
            break;
        }
      });
    },
    { timeout: 1000 }
  );
});

documentAndShadowRootObserverOptions = {
  attributeFilter: ["aria-hidden", "data-focus-method"],
  childList: true,
  subtree: true
}
documentAndShadowRootObserver.observe(document, documentAndShadowRootObserverOptions);
