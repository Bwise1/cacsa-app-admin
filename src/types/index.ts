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

export interface Location {
  id: number;
  name: string;
  state_id: number;
  address: string;
  location: {
    x: number;
    y: number;
  };
  type: string;
  website: string;
  phone: string;
  is_HQ: number;
}

export type ApiResponse = {
  status: string;
  link: string;
};

export type AddLocationPayload = {
  name: string;
  stateId: number | null;
  address: string;
  type: string;
  website: string;
  longitude: number | null;
  latitude: number | null;
  phone: string;
  isHQ: string;
};
