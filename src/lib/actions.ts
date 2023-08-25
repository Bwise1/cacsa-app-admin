import { AudioInfo } from "@/types";
import { API_ENDPOINTS } from "./endpoints";

const serverUrl = process.env.NEXT_PUBLIC_REST_API_ENDPOINT;

export const uploadAudio = async (formData: FormData) => {
  try {
    const response = await fetch(`${serverUrl}${API_ENDPOINTS.UPLOAD_AUDIO}`, {
      method: "POST",
      body: formData,
    });
    return response.json();
  } catch (err) {
    throw err;
  }
};

export const uploadThumbNail = async (formData: FormData) => {
  try {
    const response = await fetch(
      `${serverUrl}${API_ENDPOINTS.UPLOAD_THUMBNAIL}`,
      {
        method: "POST",
        body: formData,
      }
    );
    return response.json();
  } catch (err) {
    throw err;
  }
};

export const fetchAllCategories = async () => {
  try {
    const response = await fetch(`${serverUrl}${API_ENDPOINTS.CATEGORY}`, {
      method: "GET",
    });
    return response.json();
  } catch (err) {
    throw err;
  }
};

export const saveAudioDetails = async (audioInfo: AudioInfo) => {
  try {
    const response = await fetch(`${serverUrl}${API_ENDPOINTS.AUDIO}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(audioInfo),
    });
    return response.json();
  } catch (err) {
    throw err;
  }
};
