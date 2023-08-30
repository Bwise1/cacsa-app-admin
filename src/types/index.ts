export type AudioInfo = {
  title: string;
  description: string;
  artist: string;
  date: string;
  category_id: number;
  audio_url: string;
  thumbnail_url: string;
  duration: string;
  [key: string]: string | number;
};

export type AudioUpload = {
  audiofile: File;
};

export type ThumbNailUpload = {
  thumbfile: File;
};

export interface Category {
  id: number;
  name: string;
}
