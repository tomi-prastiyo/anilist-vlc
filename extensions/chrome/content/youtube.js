// YouTube Content Script

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

function parseYouTube() {
  const video = document.querySelector('video');
  if (!video) return;

  // Only track if we are on a watch page
  if (!window.location.pathname.includes('/watch')) return;

  const fullTitle = document.title.replace(/^\(\d+\)\s*/, '').replace(' - YouTube', '').trim(); // Remove (1) notification counts
  let title = fullTitle;
  let episode = "";

  // Muse Asia format: "[Multi Subs] Anime Title - Episode 12" or "【MUSE ASIA】Anime Title Episode 1"
  // Ani-One format: "Anime Title | EP01" or "Anime Title Ep. 1"
  const epMatch = fullTitle.match(/(?:Episode|Ep\.?|EP)\s*(\d+)/i);
  if (epMatch) {
    episode = epMatch[1];
    title = fullTitle.substring(0, epMatch.index).trim();
  } else {
    // Sometimes it's just "Anime Title - 12"
    const dashMatch = fullTitle.match(/\s+-\s+(\d+)(?:\s+|$)/);
    if (dashMatch) {
      episode = dashMatch[1];
      title = fullTitle.split(dashMatch[0])[0];
    }
  }

  // Clean up brackets like [Multi Subs] or 【MUSE ASIA】
  title = title.replace(/\[.*?\]/g, '').replace(/【.*?】/g, '').trim();
  // Remove trailing dashes or pipes
  title = title.replace(/[-|]+$/, '').trim();

  const length = Math.floor(video.duration || 0);
  const time = Math.floor(video.currentTime || 0);
  const state = video.paused ? 'paused' : 'playing';

  // Only sync if video has actual length and is not an ad
  // YouTube ads usually don't have the normal video title, but to be safe we check length > 0
  const isAd = document.querySelector('.ad-showing');
  
  if (length > 0 && !isAd) {
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
      chrome.storage.local.get(['enable_youtube'], (result) => {
        if (result.enable_youtube !== false) {
          parseYouTube();
        }
      });
    } else {
      parseYouTube();
    }
  } catch (e) {
    parseYouTube();
  }
}, 5000);
