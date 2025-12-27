declare module 'ytdl-core' {
  export interface VideoDetails {
    title: string;
    lengthSeconds: string;
    thumbnails: Array<{ url: string }>;
  }

  export interface VideoInfo {
    videoDetails: VideoDetails;
  }

  export function validateURL(url: string): boolean;
  export function getInfo(url: string): Promise<VideoInfo>;
  export default function ytdl(url: string, options?: any): NodeJS.ReadableStream;
}

