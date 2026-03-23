export type AudioInfo = {
  title: string;
  description: string;
  artist: string;
  date: string;
  category_id: number;
  audio_url: string;
  thumbnail_url: string;
  duration?: string;
  [key: string]: string | number | undefined;
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
  /** Set when the server could read duration from the uploaded file (same as save flow). */
  duration?: string | null;
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

export type AddAudioPayload = {
  title: string;
  description: string;
  artist: string;
  date: string;
  category_id: number | null;
  audio_url: string;
  thumbnail_url: string;
  /** Optional; server derives duration from the file when omitted. */
  duration?: string;
};

/** Row from `subscription_plans` (admin + Paystack). */
export type SubscriptionPlanRow = {
  id: number;
  name: string;
  description: string | null;
  amount: string | number;
  interval: string;
  currency: string;
  is_active: number | boolean;
  plan_code: string | null;
  plan_kind: string;
  created_at?: string;
  updated_at?: string;
};
