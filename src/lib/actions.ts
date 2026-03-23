import {
  AddAudioPayload,
  AddLocationPayload,
  AudioInfo,
  SubscriptionPlanRow,
} from "@/types";
import { API_ENDPOINTS } from "./endpoints";
import { ApiResponse } from "@/types";

const serverUrl = process.env.NEXT_PUBLIC_REST_API_ENDPOINT;

/** Lazy-loads `next-auth/react` only when these run in the browser — avoids pulling client auth into the API route / RSC server graph. */
async function authenticatedRequest<T>(
  url: string,
  method: string = "GET",
  data: unknown = null
): Promise<T | null> {
  const { authenticatedRequest: impl } = await import("./api");
  return impl<T>(url, method, data);
}

export { loginUser } from "./loginUser";

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
      if (event.lengthComputable && event.total > 0) {
        // Linear 0–99% while bytes are uploading; 100% only after HTTP 200 (S3 + server done).
        const pct = Math.min(
          99,
          Math.round((event.loaded / event.total) * 100)
        );
        onProgress(pct);
      }
    });

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
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

export const updateAudioDetails = async (
  audioId: number,
  audioInfo: AddAudioPayload
): Promise<{ status: string; message?: string }> => {
  const response = await fetch(`${serverUrl}${API_ENDPOINTS.AUDIO}${audioId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(audioInfo),
  });
  const data = (await response.json().catch(() => ({}))) as {
    status?: string;
    message?: string;
  };
  if (!response.ok) {
    return {
      status: "error",
      message: data.message || `Request failed (${response.status})`,
    };
  }
  return { status: data.status || "success", message: data.message };
};

export const fetchAllBranches = async () => {
  const response = await fetch(`${serverUrl}${API_ENDPOINTS.BRANCHES}`, {
    method: "GET",
  });
  const data = (await response.json().catch(() => ({}))) as {
    status?: string;
    branches?: unknown[];
    error?: string;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(
      data.message ||
        data.error ||
        `Failed to load branches (${response.status})`
    );
  }
  return data;
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

export const deleteAudio = async (
  audioId: number
): Promise<{ status: string; message?: string }> => {
  const response = await fetch(`${serverUrl}${API_ENDPOINTS.AUDIO}${audioId}`, {
    method: "DELETE",
  });
  const data = (await response.json().catch(() => ({}))) as {
    status?: string;
    message?: string;
  };
  if (!response.ok) {
    return {
      status: "error",
      message: data.message || `Request failed (${response.status})`,
    };
  }
  return { status: data.status || "success", message: data.message };
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

export type AudioPlayStatsPayload = {
  status: string;
  totalPlays: number;
  totalListenSeconds: number;
  days: number;
  allTime: boolean;
  byDay: { date: string; plays: number; listen_seconds: number }[];
  byTrack: {
    audio_id: number;
    title: string;
    artist: string | null;
    plays: number;
    listen_seconds: number;
  }[];
};

export type OverviewMetricsPayload = {
  status: string;
  adminUserCount: number;
  activeSubscribers: number;
  /** All docs in `subscriptions` (any status); compare to activeSubscribers. */
  subscriptionDocumentsTotal: number | null;
  totalAudioTracks: number;
  firebaseRegisteredUsers: number;
  firebaseRegisteredApproximate: boolean;
};

export type UsersStatsPayload = {
  status: string;
  firebaseRegisteredUsers: number;
  firebaseRegisteredApproximate: boolean;
  activeSubscribers: number;
  subscriptionDocumentsTotal: number | null;
};

export type AdminDevotionalSettingsPayload = {
  status: string;
  settings: {
    min_read_seconds: number;
    min_scroll_percent: number;
    server_timezone: string;
  };
};

export type AdminDevotionalLeaderboardRow = {
  firebaseUid: string;
  fullName: string;
  firstName: string;
  lastName: string;
  currentStreakDays: number;
  longestStreakDays: number;
  totalPoints: number;
  lastCompletedDate: string | null;
};

export type AdminDevotionalLeaderboardPayload = {
  status: string;
  rows: AdminDevotionalLeaderboardRow[];
};

export type AppUserRow = {
  uid: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
  lastSignInAt?: string;
  isSubscribed: boolean;
  /** Firestore subscription doc fields when present (admin list). */
  subscriptionInfo?: {
    planKind?: string;
    familyId?: string;
    role?: string;
    familyTier?: string;
    /** From MySQL join (family_groups + subscription_plans) when available. */
    mysqlPlanKind?: string;
    mysqlPlanName?: string;
    mysqlPlanTier?: string | null;
  };
  /** True when subscription doc exists but Firebase Auth user does not (orphan). */
  authUserMissing?: boolean;
};

export type AppUsersListPayload = {
  status: string;
  users: AppUserRow[];
  nextPageToken: string | null;
};

export const fetchOverviewMetrics = async (): Promise<OverviewMetricsPayload | null> => {
  return authenticatedRequest<OverviewMetricsPayload>(
    `${serverUrl}${API_ENDPOINTS.ADMIN_OVERVIEW_METRICS}`,
    "GET"
  );
};

export const fetchUsersStats = async (): Promise<UsersStatsPayload | null> => {
  return authenticatedRequest<UsersStatsPayload>(
    `${serverUrl}${API_ENDPOINTS.ADMIN_USERS_STATS}`,
    "GET"
  );
};

export const fetchAdminDevotionalSettings = async (): Promise<AdminDevotionalSettingsPayload | null> => {
  return authenticatedRequest<AdminDevotionalSettingsPayload>(
    `${serverUrl}${API_ENDPOINTS.ADMIN_DEVOTIONAL_SETTINGS}`,
    "GET"
  );
};

export const updateAdminDevotionalSettings = async (body: {
  min_read_seconds: number;
  min_scroll_percent?: number;
  server_timezone?: string;
}) => {
  return authenticatedRequest<AdminDevotionalSettingsPayload>(
    `${serverUrl}${API_ENDPOINTS.ADMIN_DEVOTIONAL_SETTINGS}`,
    "PUT",
    body
  );
};

export const fetchAdminDevotionalLeaderboard = async (limit: number = 20) => {
  const q = `?limit=${Math.min(Math.max(limit, 1), 100)}`;
  return authenticatedRequest<AdminDevotionalLeaderboardPayload>(
    `${serverUrl}${API_ENDPOINTS.ADMIN_DEVOTIONAL_LEADERBOARD}${q}`,
    "GET"
  );
};

export const fetchAppUsers = async (opts: {
  pageSize?: number;
  pageToken?: string | null;
  email?: string;
  subscription?: "all" | "subscribed" | "unsubscribed";
}): Promise<AppUsersListPayload | null> => {
  const params = new URLSearchParams();
  if (opts.pageSize) params.set("pageSize", String(opts.pageSize));
  if (opts.pageToken) params.set("pageToken", opts.pageToken);
  if (opts.email?.trim()) params.set("email", opts.email.trim());
  const sub = opts.subscription ?? "all";
  if (sub !== "all") params.set("subscription", sub);
  const q = params.toString();
  const url = `${serverUrl}${API_ENDPOINTS.ADMIN_APP_USERS}${q ? `?${q}` : ""}`;
  return authenticatedRequest<AppUsersListPayload>(url, "GET");
};

export const adminUnsubscribeAppUser = async (uid: string): Promise<{ status: string } | null> => {
  return authenticatedRequest(
    `${serverUrl}${API_ENDPOINTS.ADMIN_APP_USERS}/${encodeURIComponent(uid)}/unsubscribe`,
    "POST"
  );
};

export const adminDeleteAppUser = async (uid: string): Promise<{ status: string } | null> => {
  return authenticatedRequest(
    `${serverUrl}${API_ENDPOINTS.ADMIN_APP_USERS}/${encodeURIComponent(uid)}`,
    "DELETE"
  );
};

/** Server-side play counts (mobile app POSTs to /audio/play/:id). Requires audio:write. */
export const fetchAudioPlayStats = async (
  days: number = 30
): Promise<AudioPlayStatsPayload | null> => {
  const q = days <= 0 ? "?days=0" : `?days=${days}`;
  return authenticatedRequest<AudioPlayStatsPayload>(
    `${serverUrl}${API_ENDPOINTS.ADMIN_AUDIO_PLAY_STATS}${q}`,
    "GET"
  );
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

export const fetchAdminRolesDetailed = async () => {
  return authenticatedRequest(`${serverUrl}${API_ENDPOINTS.ADMIN_ROLES}`, "GET");
};

export const createAdminRole = async (body: {
  slug: string;
  name: string;
  permissionIds?: number[];
}) => {
  return authenticatedRequest(`${serverUrl}${API_ENDPOINTS.ADMIN_ROLES}`, "POST", body);
};

export const updateAdminRole = async (
  id: number,
  body: { name?: string; slug?: string }
) => {
  return authenticatedRequest(
    `${serverUrl}${API_ENDPOINTS.ADMIN_ROLES}/${id}`,
    "PATCH",
    body
  );
};

export const deleteAdminRole = async (id: number) => {
  return authenticatedRequest(
    `${serverUrl}${API_ENDPOINTS.ADMIN_ROLES}/${id}`,
    "DELETE"
  );
};

export const putAdminRolePermissions = async (
  id: number,
  permissionIds: number[]
) => {
  return authenticatedRequest(
    `${serverUrl}${API_ENDPOINTS.ADMIN_ROLES}/${id}/permissions`,
    "PUT",
    { permissionIds }
  );
};

export const fetchAdminInvitations = async () => {
  return authenticatedRequest(
    `${serverUrl}${API_ENDPOINTS.ADMIN_INVITATIONS}`,
    "GET"
  );
};

export const fetchAdminUsersCount = async () => {
  return authenticatedRequest<{ status: string; count: number }>(
    `${serverUrl}${API_ENDPOINTS.ADMIN_ADMIN_USERS_COUNT}`,
    "GET"
  );
};

export const createAdminInvitation = async (body: {
  email: string;
  role_id?: number;
  role_slug?: string;
}) => {
  return authenticatedRequest<{
    status: string;
    message?: string;
    emailSent?: boolean;
    expiresAt?: string;
  }>(`${serverUrl}${API_ENDPOINTS.ADMIN_INVITATIONS}`, "POST", body);
};

export const revokeAdminInvitation = async (id: number) => {
  return authenticatedRequest(
    `${serverUrl}${API_ENDPOINTS.ADMIN_INVITATIONS}/${id}`,
    "DELETE"
  );
};

export const sendBroadcastNotification = async (body: {
  title: string;
  body: string;
}) => {
  return authenticatedRequest(
    `${serverUrl}${API_ENDPOINTS.ADMIN_BROADCAST}`,
    "POST",
    body
  );
};

export const fetchAdminSubscriptionPlans = async () => {
  return authenticatedRequest<{ status: string; plans: SubscriptionPlanRow[] }>(
    `${serverUrl}${API_ENDPOINTS.ADMIN_SUBSCRIPTION_PLANS}`,
    "GET"
  );
};

export const createAdminSubscriptionPlan = async (body: {
  name: string;
  description?: string | null;
  amount: number | string;
  interval?: string;
  currency?: string;
  plan_code?: string | null;
  plan_kind?: string;
  is_active?: boolean;
}) => {
  return authenticatedRequest(
    `${serverUrl}${API_ENDPOINTS.ADMIN_SUBSCRIPTION_PLANS}`,
    "POST",
    body
  );
};

export const updateAdminSubscriptionPlan = async (
  id: number,
  body: Partial<{
    name: string;
    description: string | null;
    amount: number | string;
    interval: string;
    currency: string;
    plan_code: string | null;
    plan_kind: string;
    is_active: boolean;
  }>
) => {
  return authenticatedRequest(
    `${serverUrl}${API_ENDPOINTS.ADMIN_SUBSCRIPTION_PLANS}/${id}`,
    "PUT",
    body
  );
};

export const acceptAdminInvite = async (body: {
  token: string;
  username: string;
  password: string;
}) => {
  const res = await fetch(
    `${serverUrl}${API_ENDPOINTS.ADMIN_ACCEPT_INVITE}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.message || "Could not accept invitation");
  }
  return json;
};

/** Public: whether an admin username is free (invite signup). */
export type AdminAdRow = {
  id: number;
  public_id: string;
  brand_name: string | null;
  contact: string | null;
  state: string | null;
  asset_url: string;
  link_url: string | null;
  ad_type: string;
  slot: string | null;
  sort_order: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  impression_count: number;
  click_count: number;
  created_at?: string;
  updated_at?: string;
};

export type AdminAdsListPayload = {
  status: string;
  ads: AdminAdRow[];
};

export type AdStatsPayload = {
  status: string;
  stats: {
    adId: number;
    days: number;
    allTime: boolean;
    totalImpressions: number;
    totalClicks: number;
    byDay: { date: string; impressions: number; clicks: number }[];
  };
};

export const fetchAdminAds = async () => {
  return authenticatedRequest<AdminAdsListPayload>(
    `${serverUrl}${API_ENDPOINTS.ADMIN_ADS}`,
    "GET"
  );
};

export const createAdminAd = async (body: {
  brand_name?: string | null;
  contact?: string | null;
  state?: string | null;
  asset_url: string;
  link_url?: string | null;
  ad_type?: string;
  slot?: string | null;
  sort_order?: number;
  is_active?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
}) => {
  return authenticatedRequest<{
    status: string;
    id: number;
    public_id: string;
    ad: AdminAdRow;
  }>(`${serverUrl}${API_ENDPOINTS.ADMIN_ADS}`, "POST", body);
};

export const updateAdminAd = async (
  id: number,
  body: Partial<{
    brand_name: string | null;
    contact: string | null;
    state: string | null;
    asset_url: string;
    link_url: string | null;
    ad_type: string;
    slot: string | null;
    sort_order: number;
    is_active: boolean;
    starts_at: string | null;
    ends_at: string | null;
  }>
) => {
  return authenticatedRequest<{ status: string; ad: AdminAdRow }>(
    `${serverUrl}${API_ENDPOINTS.ADMIN_ADS}/${id}`,
    "PATCH",
    body
  );
};

export const deleteAdminAd = async (id: number) => {
  return authenticatedRequest<{ status: string }>(
    `${serverUrl}${API_ENDPOINTS.ADMIN_ADS}/${id}`,
    "DELETE"
  );
};

export const fetchAdStats = async (id: number, days: number = 30) => {
  const q = days === 0 ? "?days=0" : `?days=${days}`;
  return authenticatedRequest<AdStatsPayload>(
    `${serverUrl}${API_ENDPOINTS.ADMIN_ADS}/${id}/stats${q}`,
    "GET"
  );
};

export const uploadAdImage = async (formData: FormData) => {
  const { getSession } = await import("next-auth/react");
  const session = await getSession();
  if (!session?.user?.accessToken) {
    throw new Error("User session or accessToken not found.");
  }
  const response = await fetch(
    `${serverUrl}${API_ENDPOINTS.ADMIN_ADS_UPLOAD}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`,
      },
      body: formData,
    }
  );
  const data = (await response.json().catch(() => ({}))) as {
    status?: string;
    link?: string;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(data.message || `Upload failed (${response.status})`);
  }
  return data as { status: string; link: string };
};

export const checkAdminInviteUsernameAvailable = async (username: string) => {
  const res = await fetch(
    `${serverUrl}${API_ENDPOINTS.ADMIN_INVITE_CHECK_USERNAME}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    }
  );
  const json = (await res.json().catch(() => ({}))) as {
    status?: string;
    available?: boolean;
    message?: string;
  };
  if (!res.ok) {
    throw new Error(json.message || "Could not verify username");
  }
  return Boolean(json.available);
};


export type AdminUserRow = {
  id: number;
  username: string;
  email: string;
  role: string | null;
  role_id: number | null;
  role_slug?: string | null;
  role_name?: string | null;
  created_at?: string;
};

export const fetchAdminUsers = async () => {
  return authenticatedRequest<{ status: string; users: AdminUserRow[] }>(
    `${serverUrl}${API_ENDPOINTS.ADMIN_ADMIN_USERS}`,
    "GET"
  );
};

export const updateAdminUserRole = async (id: number, role_id: number) => {
  return authenticatedRequest<{ status: string }>(
    `${serverUrl}${API_ENDPOINTS.ADMIN_ADMIN_USERS}/${id}/role`,
    "PATCH",
    { role_id }
  );
};

export const deleteAdminUser = async (id: number) => {
  return authenticatedRequest<{ status: string }>(
    `${serverUrl}${API_ENDPOINTS.ADMIN_ADMIN_USERS}/${id}`,
    "DELETE"
  );
};

export type AdminReferralRow = {
  id: number;
  referred_uid: string;
  referrer_uid: string;
  referral_code: string;
  status: "pending" | "converted" | "rejected";
  captured_at: string;
  converted_at: string | null;
  rejected_reason: string | null;
  subscription_id: number | null;
  reward_points: number | null;
};

export type AdminReferralSummary = {
  totalAttributions: number;
  pendingCount: number;
  convertedCount: number;
  rejectedCount: number;
};

export type AdminReferralsPayload = {
  status: string;
  rows: AdminReferralRow[];
  summary: AdminReferralSummary;
};

export const fetchAdminReferrals = async (opts?: {
  q?: string;
  status?: "all" | "pending" | "converted" | "rejected";
  limit?: number;
}) => {
  const params = new URLSearchParams();
  if (opts?.q?.trim()) params.set("q", opts.q.trim());
  if (opts?.status && opts.status !== "all") params.set("status", opts.status);
  if (opts?.limit) params.set("limit", String(opts.limit));
  const query = params.toString();
  return authenticatedRequest<AdminReferralsPayload>(
    `${serverUrl}${API_ENDPOINTS.ADMIN_REFERRALS}${query ? `?${query}` : ""}`,
    "GET"
  );
};
