import type { Metadata } from '../../types';

export type TrackEntry = {
  id: string;
  metadata: Metadata;
  objectUrl: string | null;
  fileName: string;
  lastModified: number;
};

export type TrackOrder = string[];

export const PLAYLIST_ORDER_KEY = 'dropbeat-playlist-order';
