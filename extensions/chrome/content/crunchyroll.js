// Crunchyroll Content Script

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

function parseCrunchyroll() {
  const video = document.querySelector('video');
  if (!video) return;

  let title = "";
  let episode = "";

  // 1. Try to get Anime Title directly from DOM (Player Overlay)
  // Crunchyroll usually puts the series name in an anchor tag pointing to the series page
  const titleEl = document.querySelector('h1.heading--nKNOf a[href*="/series/"], a[class*="show-title-link"], a[data-t="show-title-link"]');
  if (titleEl && titleEl.innerText) {
    title = titleEl.innerText.trim();
  }

  // 2. Parse episode from document.title
  const fullTitle = document.title || "";
  const epMatch = fullTitle.match(/(?:Episode|Episodio|Episódio|Épisode|Bölüm)\s+(\d+)/i);
  if (epMatch) {
    episode = epMatch[1];
  }

  // 3. Fallback to document.title parsing if DOM extraction failed
  if (!title) {
    let cleanTitle = fullTitle.replace(/^(Watch|Tonton|Menonton|Ver|Regarder|Guarda|Assistir|Sehe)\s+/i, '');
    if (epMatch) {
      title = cleanTitle.split(/(?:Episode|Episodio|Episódio|Épisode|Bölüm)/i)[0].trim();
    } else {
      const parts = cleanTitle.split('-');
      if (parts.length >= 2) {
        title = parts[0].trim();
        const potentialEp = parts[1].trim();
        if (!isNaN(Number(potentialEp))) {
          episode = potentialEp;
        }
      } else {
        title = cleanTitle.split('-')[0].trim();
      }
    }
  }

  // Final cleanup: remove trailing "Crunchyroll", dashes, and "Season X" / "Musim X"
  title = title.replace(/-?\s*Crunchyroll$/i, '')
               .replace(/-$/, '')
               .replace(/\s+(?:Season|Musim|Part)\s+\d+.*$/i, '')
               .trim();

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
      chrome.storage.local.get(['enable_crunchyroll'], (result) => {
        if (result.enable_crunchyroll !== false) {
          parseCrunchyroll();
        }
      });
    } else {
      parseCrunchyroll();
    }
  } catch (e) {
    parseCrunchyroll();
  }
}, 5000);
