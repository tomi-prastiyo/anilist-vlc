// Crunchyroll Content Script
const SYNC_URL = 'http://127.0.0.1:47392/api/sync';

function sendSyncData(data) {
  fetch(SYNC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }).catch(err => {
    // Desktop app might not be running, silently fail
  });
}

function parseCrunchyroll() {
  const video = document.querySelector('video');
  if (!video) return;

  // Crunchyroll page title format: "Anime Name - Episode X - Episode Title - Watch on Crunchyroll"
  const fullTitle = document.title || "";
  let title = fullTitle;
  let episode = "";

  const epMatch = fullTitle.match(/Episode\s+(\d+)/i);
  if (epMatch) {
    episode = epMatch[1];
    title = fullTitle.split('-')[0].trim();
  } else {
      // Sometimes it's e.g. "One Piece - 1071 - Luffy's Peak"
      const parts = fullTitle.split('-');
      if (parts.length >= 2) {
          title = parts[0].trim();
          const potentialEp = parts[1].trim();
          if (!isNaN(Number(potentialEp))) {
              episode = potentialEp;
          }
      }
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
setInterval(parseCrunchyroll, 5000);
