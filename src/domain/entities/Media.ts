/**
 * Domain Entity: Media
 * Represents an anime media item with its core properties
 */
export interface Media {
  id: number;
  title: string;
  coverImage?: string;
}

export interface MediaListEntry {
  mediaId: number;
  title: string;
  progress: number;
  status: MediaStatus;
}

export type MediaStatus =
  | "CURRENT"
  | "PLANNING"
  | "COMPLETED"
  | "DROPPED"
  | "PAUSED"
  | "REPEATING";
