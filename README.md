# anilist-vlc 🎬🎮

A TypeScript application that bridges VLC Media Player, AniList, and Discord Rich Presence. Automatically syncs your anime watch progress to AniList while displaying real-time playback status on Discord.

---

## Features

- **Automatic Progress Sync** — Detects episode completion in VLC and updates AniList watch progress
- **Discord Rich Presence** — Displays current anime, episode, and playback state to Discord
- **Smart Title Parsing** — Extracts anime titles and episode numbers from various filename formats
- **OAuth Authentication** — Secure AniList API integration with token management

---

## Architecture

This project follows **Clean Architecture** principles with clear separation of concerns and dependency inversion.

```
src/
├── main/                          # Composition Root
│   ├── index.ts                   # Application entry point
│   └── bootstrap.ts               # Dependency injection & wiring
│
├── domain/                        # Core Business Logic (no dependencies)
│   ├── entities/                  # Business objects
│   │   ├── Media.ts               # Anime media entity
│   │   ├── PlaybackStatus.ts      # Playback state entity
│   │   ├── User.ts                # User profile entity
│   │   └── DiscordActivity.ts     # Discord presence payload
│   └── ports/                     # Interface contracts
│       ├── IAnimeRepository.ts    # Anime data operations
│       ├── IMediaPlayerAdapter.ts # Media player interface
│       ├── IPresenceService.ts    # Rich presence interface
│       ├── IAuthService.ts        # Authentication interface
│       └── ITitleParser.ts        # Title parsing interface
│
├── application/                   # Use Cases (depends on domain only)
│   └── useCases/
│       ├── ResolveMediaIdUseCase.ts   # Match title to AniList ID
│       ├── UpdateProgressUseCase.ts   # Update episode progress
│       ├── BuildPresenceUseCase.ts    # Build Discord activity
│       └── AuthenticateUserUseCase.ts # OAuth authentication flow
│
├── infrastructure/                # External Adapters (implements ports)
│   ├── adapters/
│   │   ├── AniListRepository.ts      # AniList GraphQL client
│   │   ├── VlcPlayerAdapter.ts       # VLC HTTP API client
│   │   ├── DiscordPresenceAdapter.ts # Discord RPC client
│   │   ├── AniListAuthAdapter.ts     # OAuth flow handler
│   │   └── AnimeTitleParser.ts       # Filename parser
│   └── config/
│       └── AppConfig.ts              # Environment configuration
│
└── presentation/                  # Controllers & UI
    └── controllers/
        └── StatusPollingController.ts # Main orchestration loop
```

### Layer Responsibilities

| Layer              | Purpose                                                                             | Depends On          |
| ------------------ | ----------------------------------------------------------------------------------- | ------------------- |
| **Domain**         | Core entities & port interfaces. Framework-agnostic business rules.                 | Nothing             |
| **Application**    | Use cases that orchestrate domain logic. Single-responsibility operations.          | Domain              |
| **Infrastructure** | Concrete adapters for external services (APIs, databases, file system).             | Domain              |
| **Presentation**   | Controllers that handle user interaction and coordinate use cases.                  | Application, Domain |
| **Main**           | Composition root. Wires dependencies together. Only place with concrete references. | All layers          |

### Dependency Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      Main (Bootstrap)                       │
│         Creates concrete instances, injects dependencies    │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐   ┌─────────────────┐   ┌─────────────────┐
│ Presentation  │   │ Infrastructure  │   │   Application   │
│  Controllers  │──▶│    Adapters     │◀──│    Use Cases    │
└───────────────┘   └─────────────────┘   └─────────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
                    ┌─────────────────┐
                    │     Domain      │
                    │ Entities, Ports │
                    └─────────────────┘
```

---

## Core Modules

### Domain Layer

**Entities** — Pure data structures with no external dependencies:

- `Media` — Anime media with id, title, cover image
- `PlaybackStatus` — Current playback state (title, time, length, state)
- `ParsedTitle` — Extracted title and episode number
- `DiscordActivity` — Rich presence payload

**Ports** — Interface contracts for dependency inversion:

- `IAnimeRepository` — Anime data operations (list, search, update)
- `IMediaPlayerAdapter` — Media player status polling
- `IPresenceService` — Rich presence connection and updates
- `IAuthService` — OAuth authentication flow
- `ITitleParser` — Filename parsing logic

### Application Layer

**Use Cases** — Single-responsibility operations:

- `ResolveMediaIdUseCase` — Matches parsed title to AniList media ID
- `UpdateProgressUseCase` — Updates episode progress with status transitions
- `BuildPresenceUseCase` — Constructs Discord activity from playback data
- `AuthenticateUserUseCase` — Orchestrates OAuth flow

### Infrastructure Layer

**Adapters** — Concrete implementations of domain ports:

- `AniListRepository` — GraphQL client for AniList API
- `VlcPlayerAdapter` — HTTP client for VLC status.xml
- `DiscordPresenceAdapter` — Discord RPC client wrapper
- `AniListAuthAdapter` — OAuth code/token flow
- `AnimeTitleParser` — Regex-based filename parsing

---

## Configuration

Create a `.env` file in the project root:

```env
# VLC Media Player
VLC_PW=your_vlc_password
VLC_PORT=8080

# AniList OAuth
ANILIST_CLIENT_ID=your_client_id
ANILIST_CLIENT_SECRET=your_client_secret
ANILIST_REDIRECT=your_redirect_uri
ANILIST_USERNAME=your_username

# Discord
DISCORD_CLIENT=your_discord_app_id
```

> **Note:** `ANILIST_AUTHTOKEN` and `ANILIST_JWT` are generated automatically during first-run authentication.

---

## Usage

```bash
# Install dependencies
npm install

# Development mode (hot reload)
npm run dev

# Production
npm start
```

### Prerequisites

1. **VLC** — Enable HTTP interface: `Tools > Preferences > Main Interfaces > Web`
2. **AniList** — Create API client at [AniList Developer Settings](https://anilist.co/settings/developer)
3. **Discord** — Create application at [Discord Developer Portal](https://discord.com/developers/applications)

---

## Extending the Application

### Adding a New Media Player

1. Create an adapter in `infrastructure/adapters/` implementing `IMediaPlayerAdapter`
2. Update `bootstrap.ts` to inject your new adapter

```typescript
// Example: MPV adapter
export class MpvPlayerAdapter implements IMediaPlayerAdapter {
  async getPlaybackStatus(): Promise<PlaybackStatus | null> {
    // Implement MPV IPC communication
  }
}
```

### Adding a New Anime Provider

1. Create a repository in `infrastructure/adapters/` implementing `IAnimeRepository`
2. Update `bootstrap.ts` to use your new provider

---

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Discord RPC:** `@xhayper/discord-rpc`
- **HTTP Client:** `axios`
- **XML Parsing:** `xml-js`
- **Environment:** `dotenv`

---

## License

ISC
