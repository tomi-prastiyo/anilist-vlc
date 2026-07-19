// Bilibili.tv Content Script

function sendSyncData(data) {
  try {
    chrome.runtime.sendMessage({ type: 'SYNC_DATA', data }, (response) => {
      if (chrome.runtime.lastError) {
        // Background script not ready or error
      }
    });
  } catch (err) {
    // Silently fail
  }
}

function parseBilibili() {
  const video = document.querySelector('video');
  if (!video) return;

  // Title usually looks like: "Anime Name - Episode X" in some element, or the page title
  // Example page title: "Watch Anime Name Episode X Online - Bilibili"
  const fullTitle = document.title || "";
  let title = fullTitle;
  let episode = "";

  // Very basic regex to extract episode number
  const epMatch = fullTitle.match(/Episode\s+(\d+)/i);
  if (epMatch) {
    episode = epMatch[1];
    title = fullTitle.split('Episode')[0].replace('Watch', '').trim();
  }

  const length = Math.floor(video.duration || 0);
  const time = Math.floor(video.currentTime || 0);
  const state = video.paused ? 'paused' : 'playing';

  // Only sync if video has actual length
  if (length > 0) {
    sendSyncData({
      title,
      episode,
      length,
      time,
      state
    });
  }
}

// Poll every 5 seconds
setInterval(() => {
  try {
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['enable_bilibili'], (result) => {
        if (result.enable_bilibili !== false) {
          parseBilibili();
        }
      });
    } else {
      parseBilibili();
    }
  } catch (e) {
    parseBilibili();
  }
}, 5000);
