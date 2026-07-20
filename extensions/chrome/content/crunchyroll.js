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
  let epMatch = fullTitle.match(/(?:Episode|Episodio|Episódio|Épisode|Bölüm|Ep|E)\s*[:\.]?\s*(\d+)/i);
  if (epMatch) {
    episode = epMatch[1];
  }

  // 3. Fallback for title if DOM failed
  if (!title) {
    let cleanTitle = fullTitle.replace(/^(Watch|Tonton|Menonton|Ver|Regarder|Guarda|Assistir|Sehe)\s+/i, '');
    if (epMatch) {
      title = cleanTitle.split(/(?:Episode|Episodio|Episódio|Épisode|Bölüm)/i)[0].trim();
    } else {
      const parts = cleanTitle.split('-');
      if (parts.length >= 2) {
        title = parts[0].trim();
      } else {
        title = cleanTitle.split('-')[0].trim();
      }
    }
  }

  // 4. Aggressive fallback for episode if still not found
  if (!episode) {
    // Look in DOM text for Episode \d+ or E12
    const headers = document.querySelectorAll('h1, h2, h3, h4, h5');
    for (const h of headers) {
      const match = h.innerText.match(/(?:Episode|Episodio|Episódio|Épisode|Bölüm|Ep|E)\s*[:\.]?\s*(\d+)/i);
      if (match) {
        episode = match[1];
        break;
      }
    }

    // Try to extract isolated number from title parts (e.g. "Anime - 4 - Title")
    if (!episode) {
      const parts = fullTitle.split('-');
      for (let i = 1; i < parts.length; i++) {
        const potentialEp = parts[i].trim();
        if (/^\d+$/.test(potentialEp)) {
          episode = potentialEp;
          break;
        }
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
