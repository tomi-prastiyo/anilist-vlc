<div align="center">
  <img src="assets/icon.png" width="128" alt="AniList VLC Sync Logo" />
  <h1>🎬 AniList VLC Sync 🎮</h1>
  <p>A beautiful desktop application that automatically syncs your anime watch progress from VLC Media Player to AniList and displays your real-time status on Discord.</p>
</div>

---

## 🌟 What is this?
Ever tired of manually updating your episode count on AniList after watching anime on VLC? Want to show off what you're currently watching to your Discord friends? **AniList VLC Sync** is here for you!

This application runs quietly in the background and connects to **VLC Media Player**, **Web Browsers (Crunchyroll, Bilibili, YouTube)**, **AniList**, and **Discord**. Just sit back, watch your anime, and let the app do the rest.

## ✨ Features
- **VLC Media Player Sync:** Automatically tracks your anime watch progress directly from VLC.
- **Web Browser Sync:** Integrates with **YouTube (Muse, Ani-One)**, **Bilibili**, and **Crunchyroll** via the included Chrome Extension!
- **Discord Rich Presence:** Show off the anime you're currently watching, the exact episode, and the time remaining on your Discord profile.
- **AniList Auto-Update:** Once you reach the end of an episode (last 5 minutes), the app automatically updates your AniList watch count.
- **Smart Detection:** Seamlessly switches between VLC and Web Browsers without any manual configuration.
- **🎨 Beautiful GUI**: Easy-to-use modern desktop interface.
- **🧠 Smart Title Detection**: Intelligently extracts the anime name and episode number from messy filenames.
- **🔒 Secure Login**: Simple PIN-based AniList login directly from the app.

---

## 🚀 How to Install (For Users)

### 1. Download the App
- Go to the [Releases](../../releases) tab on GitHub.
- Download the latest `.exe` setup file (e.g., `AniList VLC Sync Setup 1.1.0.exe`).
- Install and open the application.

### 2. Configure Your Trackers
For the app to know what you're watching, you need to set up either VLC or the Web Extension (or both!).

**Method A: VLC Media Player Sync**
1. Open VLC Media Player.
2. Go to **Tools > Preferences** (or press `Ctrl+P`).
3. At the bottom left under *Show settings*, select **All**.
4. In the left menu, navigate to **Interface > Main interfaces**.
5. Check the box for **Web**.
6. Expand **Main interfaces** and click on **Lua**.
7. Under *Lua HTTP*, set a **Password** (e.g., `1234`).
8. Restart VLC.

**Method B: Web Browser Sync (Crunchyroll, Bilibili, YouTube)**
If you prefer to stream your anime online, install our custom Chrome Extension:
1. Download the `AniList-Web-Sync-1.1.0.zip` file from the [Releases](../../releases) tab.
2. Extract (unzip) the file into a dedicated folder on your computer (Do not delete this folder later).
3. Open Google Chrome (or Edge/Brave) and navigate to `chrome://extensions/`.
4. Enable **Developer mode** using the toggle in the top right corner.
5. Click **Load unpacked** in the top left and select the folder where you extracted the `.zip` file.
6. Start watching on Crunchyroll, Bilibili, or YouTube (Muse Asia/Ani-One), and the desktop app will detect it instantly!

### 3. Connect to AniList
1. Open the **AniList VLC Sync** desktop app.
2. In the **Settings** menu, enter your AniList Username.
3. (Optional) If you are using VLC, enter the VLC port (`8080` by default) and the password you created in Method A.
4. Go to the **Status** page, click **Connect AniList**, authorize the app in your browser, and paste the PIN provided.
5. You're ready to go! Start watching and let the magic happen.

---

## 📸 Previews

![Dashboard Screenshot](assets/dashboard_preview.png)

---

## 💻 For Developers

If you want to contribute or build the app from source, you'll be happy to know that this project is structured using **Clean Architecture** principles!

### Tech Stack
- **Frontend**: React, Vite, TypeScript.
- **Backend**: Electron, Node.js, Winston (Logger).
- **APIs**: AniList GraphQL API, `@xhayper/discord-rpc`, VLC HTTP API.

### Build Instructions
1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/anilist-vlc.git
   cd anilist-vlc
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Run in Development Mode**:
   ```bash
   npm run electron:dev
   ```
4. **Build the Production Executable (.exe)**:
   ```bash
   npm run electron:build
   ```

### Architecture Overview
The application backend is separated into strict layers to maintain a clean dependency flow:
- **Domain**: Pure business rules and entities (`DiscordActivity`, `PlaybackStatus`).
- **Application**: Use cases like `BuildPresenceUseCase` and `UpdateProgressUseCase`.
- **Infrastructure**: Concrete implementations (VLC API adapter, Discord RPC adapter).
- **Presentation**: Electron IPC handlers and background polling controllers.

---

## 📜 License
This project is licensed under the ISC License. Feel free to fork, modify, and distribute!
