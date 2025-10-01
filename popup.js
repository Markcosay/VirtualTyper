const essayEl = document.getElementById('essay');
const speedEl = document.getElementById('speed');
const speedVal = document.getElementById('speedValue');
const randomDelayEl = document.getElementById('randomDelay');
const selectorEl = document.getElementById('selector');
const statusEl = document.getElementById('status');
const charCount = document.getElementById('charCount');

// Load saved draft
chrome.storage.sync.get(['essay','speed','random','selector'], data => {
  if(data.essay) essayEl.value = data.essay;
  if(data.speed) speedEl.value = data.speed;
  if(data.random) randomDelayEl.checked = data.random;
  if(data.selector) selectorEl.value = data.selector;
  speedVal.textContent = speedEl.value;
  charCount.textContent = essayEl.value.length;
});

// Update char counter and store
essayEl.addEventListener('input', () => {
  charCount.textContent = essayEl.value.length;
  chrome.storage.sync.set({essay: essayEl.value});
});

speedEl.addEventListener('input', () => {
  speedVal.textContent = speedEl.value;
  chrome.storage.sync.set({speed: speedEl.value});
});
randomDelayEl.addEventListener('change', () => {
  chrome.storage.sync.set({random: randomDelayEl.checked});
});
selectorEl.addEventListener('input', () => {
  chrome.storage.sync.set({selector: selectorEl.value});
});

document.getElementById('pasteClipboard').addEventListener('click', async () => {
  essayEl.value = await navigator.clipboard.readText();
  charCount.textContent = essayEl.value.length;
  chrome.storage.sync.set({essay: essayEl.value});
});

function sendCmd(cmd) {
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const tab = tabs[0];
    if (!tab.id) return;

    // Check if content script is already loaded
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.virtualTyperLoaded
    });

    const isLoaded = result[0]?.result === true;

    if (!isLoaded) {
      // Inject content script only if not loaded
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
    }

    // Now send message
    chrome.tabs.sendMessage(tab.id, {
      command: cmd,
      text: essayEl.value,
      speed: parseInt(speedEl.value, 10),
      random: randomDelayEl.checked,
      selector: selectorEl.value
    });
  });
}

['start','pause','resume','stop'].forEach(id => {
  document.getElementById(id).addEventListener('click', () => {
    statusEl.textContent = `Status: ${id[0].toUpperCase()+id.slice(1)}`;
    sendCmd(id);
  });
});
