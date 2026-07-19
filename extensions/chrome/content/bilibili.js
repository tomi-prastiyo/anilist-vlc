// Bilibili.tv Content Script
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
setInterval(parseBilibili, 5000);
