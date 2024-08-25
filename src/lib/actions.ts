import { AddAudioPayload, AddLocationPayload, AudioInfo } from "@/types";
import { API_ENDPOINTS } from "./endpoints";
import { ApiResponse } from "@/types";
import { authenticatedRequest } from "./api"; // Import the custom function

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
      if (event.lengthComputable) {
        // Calculate progress, but only up to 90%
        const progress = Math.min((event.loaded / event.total) * 90, 90);
        onProgress(progress);
      }
    });

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          // Upload and processing complete, set progress to 100%
          onProgress(100);
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error("Error uploading audio"));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error occurred"));
    };

    xhr.open("POST", `${serverUrl}${API_ENDPOINTS.UPLOAD_AUDIO}`, true);

    // Set progress to 91% when upload is complete and processing begins
    xhr.upload.onload = () => onProgress(91);

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
      next: { revalidate: 3600 },
    });
    return response.json();
  } catch (err) {
    throw err;
  }
};

export const saveAudioDetails = async (audioInfo: AddAudioPayload) => {
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

//fetch audio stats
export const fetchAudioStats = async () => {
  try {
    const response = await fetch(
      `${serverUrl}${API_ENDPOINTS.AUDIO}stats/all`,
      {
        method: "GET",
      }
    );
    console.log(response.json);
    return response.json();
  } catch (err) {
    throw err;
  }
};

//save location
// export const saveLocations = async (location: AddLocationPayload) => {
//   try {
//     const response = await fetch(`${serverUrl}${API_ENDPOINTS.BRANCHES}`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify(location),
//     });
//     return response.json();
//   } catch (err) {
//     throw err;
//   }
// };

export const saveLocations = async (location: AddLocationPayload) => {
  try {
    // Use the authenticatedRequest function to make the API call
    const response = await authenticatedRequest(
      `${serverUrl}${API_ENDPOINTS.BRANCHES}`,
      "POST",
      location
    );
    return response;
  } catch (err) {
    throw err;
  }
};

//delete
// export const deleteLocation = async (branchId: number) => {
//   try {
//     const response = await fetch(
//       `${serverUrl}${API_ENDPOINTS.BRANCHES}/${branchId}`,
//       {
//         method: "DELETE",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(location),
//       }
//     );
//     console.log(response);
//     return response.status;
//   } catch (err) {
//     throw err;
//   }
// };

export const deleteLocation = async (branchId: number) => {
  try {
    const response = await authenticatedRequest<number>(
      `${serverUrl}${API_ENDPOINTS.BRANCHES}/${branchId}`,
      "DELETE"
    );
    return response; // Return the response status directly
  } catch (err) {
    throw err;
  }
};

export const editLocation = async (
  branchId: number,
  location: AddLocationPayload
) => {
  try {
    // Use the authenticatedRequest function to make the API call
    const response = await authenticatedRequest(
      `${serverUrl}${API_ENDPOINTS.BRANCHES}/${branchId}`, // Include the branchId in the URL
      "PUT", // Use the PUT method for updates
      location // Send the location data in the request body
    );

    return response;
  } catch (err) {
    throw err;
  }
};
