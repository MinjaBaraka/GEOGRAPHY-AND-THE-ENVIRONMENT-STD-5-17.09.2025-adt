(function () {
  "use strict";

  if (window.__adtVoiceoverHighlightInstalled) return;
  window.__adtVoiceoverHighlightInstalled = true;

  var activeVisual = null;
  var refreshFrame = 0;

  function clearVisualHighlight() {
    if (!activeVisual) return;
    activeVisual.classList.remove("adt-narration-visual-active");
    activeVisual.removeAttribute("data-adt-narration-active");
    activeVisual = null;
  }

  function isScreenReaderOnly(element) {
    return Boolean(element && element.classList.contains("sr-only"));
  }

  function describedImageFor(element) {
    var imageId = element.getAttribute("data-audio-description-for");
    if (!imageId) return null;

    var scope = element.parentElement || document;
    var escaped = window.CSS && typeof window.CSS.escape === "function"
      ? window.CSS.escape(imageId)
      : imageId.replace(/["\\]/g, "\\$&");
    return scope.querySelector('[data-id="' + escaped + '"]') ||
      document.querySelector('[data-id="' + escaped + '"]');
  }

  function visibleTargetFor(narrationElement) {
    var row = narrationElement.closest("tr");
    if (row) return row;

    var describedImage = describedImageFor(narrationElement);
    if (describedImage) return describedImage;

    if (!isScreenReaderOnly(narrationElement)) return null;

    var candidate = narrationElement.parentElement;
    while (candidate && candidate.id !== "content" && isScreenReaderOnly(candidate)) {
      candidate = candidate.parentElement;
    }
    return candidate && candidate.id !== "content" ? candidate : null;
  }

  function refreshHighlight() {
    refreshFrame = 0;
    var content = document.getElementById("content");
    if (!content) {
      clearVisualHighlight();
      return;
    }

    var activeWord = content.querySelector('[data-word-index].bg-yellow-300');
    var activeBlock = content.querySelector(".tts-active-block");
    var preparedWordTarget = content.querySelector("[data-tts-original-html]");
    var activeMarker = activeWord || activeBlock || preparedWordTarget;
    var narrationElement = activeMarker && activeMarker.closest("[data-id]");
    var nextVisual = narrationElement ? visibleTargetFor(narrationElement) : null;

    if (nextVisual === activeVisual) return;
    clearVisualHighlight();
    if (!nextVisual) return;

    nextVisual.classList.add("adt-narration-visual-active");
    nextVisual.setAttribute("data-adt-narration-active", "true");
    activeVisual = nextVisual;
  }

  function scheduleRefresh() {
    if (refreshFrame) return;
    refreshFrame = window.requestAnimationFrame(refreshHighlight);
  }

  var content = document.getElementById("content");
  if (!content) return;

  var observer = new MutationObserver(scheduleRefresh);
  observer.observe(content, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["class", "data-tts-original-html"]
  });

  document.addEventListener("visibilitychange", scheduleRefresh);
  window.addEventListener("pageshow", scheduleRefresh);
  scheduleRefresh();
})();
