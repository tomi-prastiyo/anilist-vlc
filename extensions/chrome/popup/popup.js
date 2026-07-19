document.addEventListener('DOMContentLoaded', () => {
  const toggleBilibili = document.getElementById('toggle-bilibili');
  const toggleCrunchyroll = document.getElementById('toggle-crunchyroll');
  const toggleYoutube = document.getElementById('toggle-youtube');

  // Load saved states
  chrome.storage.local.get(['enable_bilibili', 'enable_crunchyroll', 'enable_youtube'], (result) => {
    toggleBilibili.checked = result.enable_bilibili !== false; // Default true
    toggleCrunchyroll.checked = result.enable_crunchyroll !== false; // Default true
    toggleYoutube.checked = result.enable_youtube !== false; // Default true
  });

  // Save states on change
  toggleBilibili.addEventListener('change', () => {
    chrome.storage.local.set({ enable_bilibili: toggleBilibili.checked });
  });

  toggleCrunchyroll.addEventListener('change', () => {
    chrome.storage.local.set({ enable_crunchyroll: toggleCrunchyroll.checked });
  });

  toggleYoutube.addEventListener('change', () => {
    chrome.storage.local.set({ enable_youtube: toggleYoutube.checked });
  });
});
