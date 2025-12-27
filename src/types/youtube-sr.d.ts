declare module 'youtube-sr' {
  export interface Video {
    title?: string;
    url: string;
    duration?: {
      seconds: number;
    };
    thumbnail?: {
      url: string;
    };
  }

  export default class YouTube {
    static search(
      query: string,
      options?: { limit?: number; type?: 'video' | 'channel' | 'playlist' | 'film' | 'all' }
    ): Promise<Video[]>;
  }
}

