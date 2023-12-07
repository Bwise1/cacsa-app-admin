import { AddLocationPayload, AudioInfo } from "@/types";
import { API_ENDPOINTS } from "./endpoints";
import { ApiResponse } from "@/types";

const serverUrl = process.env.NEXT_PUBLIC_REST_API_ENDPOINT;

// export const uploadAudio = async (formData: FormData) => {
//   try {
//     const response = await fetch(`${serverUrl}${API_ENDPOINTS.UPLOAD_AUDIO}`, {
//       method: "POST",
//       body: formData,
//     });
//     return response.json();
//   } catch (err) {
//     throw err;
//   }
// };

export const uploadAudio = async (
  formData: FormData,
  onProgress: (progress: number) => void
): Promise<ApiResponse> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (event) => {
      const progress = (event.loaded / event.total) * 100;
      onProgress(progress);
    });

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error("Error uploading audio"));
        }
      }
    };

    xhr.open("POST", `${serverUrl}${API_ENDPOINTS.UPLOAD_AUDIO}`, true);
    xhr.send(formData);
  });
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

export const loginUser = async (credentials: {
  username: string;
  password: string;
}) => {
  try {
    const response = await fetch(`${serverUrl}${API_ENDPOINTS.AUTH}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: credentials.username,
        password: credentials.password,
      }),
    });

    if (response.ok) {
      const data = await response.json();

      // You might want to handle the received token or user data here
      return data;
    } else {
      throw new Error("Login failed");
    }
  } catch (err) {
    throw err;
  }
};

export const fetchAllBranches = async () => {
  try {
    const response = await fetch(`${serverUrl}${API_ENDPOINTS.BRANCHES}`, {
      method: "GET",
    });
    console.log(response.json);
    return response.json();
  } catch (err) {
    throw err;
  }
};

export const fetchAllStates = async () => {
  try {
    const response = await fetch(`${serverUrl}${API_ENDPOINTS.STATES}`, {
      method: "GET",
    });
    console.log(response.json);
    return response.json();
  } catch (err) {
    throw err;
  }
};
export const fetchAllAudio = async () => {
  try {
    const response = await fetch(`${serverUrl}${API_ENDPOINTS.AUDIO}`, {
      method: "GET",
    });
    console.log(response.json);
    return response.json();
  } catch (err) {
    throw err;
  }
};

//save location
export const saveLocations = async (location: AddLocationPayload) => {
  try {
    const response = await fetch(`${serverUrl}${API_ENDPOINTS.BRANCHES}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(location),
    });
    return response.json();
  } catch (err) {
    throw err;
  }
};

//delete
export const deleteLocation = async (branchId: number) => {
  try {
    const response = await fetch(
      `${serverUrl}${API_ENDPOINTS.BRANCHES}/${branchId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(location),
      }
    );
    console.log(response);
    return response.status;
  } catch (err) {
    throw err;
  }
};
