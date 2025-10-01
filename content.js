(() => {
  if (window.virtualTyperLoaded) return;
  window.virtualTyperLoaded = true;

  let typingTimeout;
  let text = "";
  let index = 0;
  let paused = false;
  let currentTarget = null; // ← store target

  function typeChar(charsPerSec, random) {
    if (index >= text.length) {
      currentTarget = null;
      return;
    }

    const baseDelay = 1000 / charsPerSec;
    const delay = random
      ? baseDelay + Math.random() * 150
      : baseDelay;

    typingTimeout = setTimeout(() => {
      if (paused || !currentTarget) return;

      // Ensure element still exists and is editable
      if (!document.body.contains(currentTarget) ||
          (!currentTarget.isContentEditable && !(currentTarget instanceof HTMLTextAreaElement))) {
        alert("Typing target was removed or is no longer editable.");
        currentTarget = null;
        return;
      }

      currentTarget.value += text[index];
      currentTarget.dispatchEvent(new Event("input", { bubbles: true }));
      index++;

      if (index < text.length) {
        typeChar(charsPerSec, random);
      } else {
        currentTarget = null;
      }
    }, delay);
  }

  chrome.runtime.onMessage.addListener((msg) => {
    switch (msg.command) {
      case "start": {
        clearTimeout(typingTimeout);
        let target;
        if (msg.selector) {
          target = document.querySelector(msg.selector);
        } else {
          target = document.activeElement;
        }

        if (!target || 
            (!(target instanceof HTMLTextAreaElement) && !target.isContentEditable)) {
          alert("Target not found or not editable!");
          return;
        }

        // Focus it (helps with activeElement fallback)
        target.focus();

        text = msg.text;
        index = 0;
        paused = false;
        currentTarget = target;
        typeChar(msg.speed, msg.random);
        break;
      }

      case "pause":
        paused = true;
        break;

      case "resume":
        if (paused && currentTarget) {
          paused = false;
          typeChar(msg.speed, msg.random);
        }
        break;

      case "stop":
        clearTimeout(typingTimeout);
        paused = false;
        index = 0;
        currentTarget = null;
        break;
    }
  });
})();