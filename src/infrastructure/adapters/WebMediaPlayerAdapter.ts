import * as http from 'http';
import { IMediaPlayerAdapter, PlaybackStatus } from "../../domain";
import { logger } from "../logger";

export interface WebSyncPayload {
  title: string;
  episode?: string;
  length: number;
  time: number;
  state: 'playing' | 'paused' | 'stopped';
}

export class WebMediaPlayerAdapter implements IMediaPlayerAdapter {
  private server: http.Server | null = null;
  private port = 47392;

  // In-memory state
  private currentState: 'playing' | 'paused' | 'stopped' = 'stopped';
  private currentTitle = "";
  private currentEpisode = "";
  private currentLength = 0;
  private currentTime = 0;
  private lastPingTime = 0;

  constructor(port = 47392) {
    this.port = port;
    this.startServer();
  }

  private startServer() {
    this.server = http.createServer((req, res) => {
      // CORS headers to allow extension to send data
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      if (req.method === 'POST' && req.url === '/api/sync') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', () => {
          try {
            const data: WebSyncPayload = JSON.parse(body);
            this.updateState(data);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } catch (e) {
            logger.error("WebMediaPlayerAdapter: Failed to parse payload", e);
            res.writeHead(400);
            res.end('Invalid JSON');
          }
        });
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    this.server.on('error', (err: any) => {
      logger.error(`WebMediaPlayerAdapter: Failed to start server on port ${this.port}`, err);
    });

    this.server.listen(this.port, '127.0.0.1', () => {
      logger.info(`🌐 WebMediaPlayerAdapter listening on http://127.0.0.1:${this.port}`);
    });
  }

  private updateState(data: WebSyncPayload) {
    this.currentTitle = data.title;
    this.currentEpisode = data.episode || "";
    this.currentLength = data.length || 0;
    this.currentTime = data.time || 0;
    this.currentState = data.state;
    this.lastPingTime = Date.now();
  }

  private isStale(): boolean {
    // If no ping for 15 seconds, assume closed/stopped
    return Date.now() - this.lastPingTime > 15000;
  }

  async getPlaybackStatus(): Promise<PlaybackStatus | null> {
    if (this.isStale()) {
      this.currentState = 'stopped';
    }

    if (this.currentState === 'stopped') {
      return null;
    }

    return {
      title: this.currentEpisode 
        ? `${this.currentTitle} - Episode ${this.currentEpisode}` 
        : this.currentTitle,
      state: this.currentState,
      time: this.currentTime,
      length: this.currentLength,
    };
  }

  stop() {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }
}
