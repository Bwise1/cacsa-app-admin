import { API_ENDPOINTS } from "./endpoints";

const serverUrl = process.env.NEXT_PUBLIC_REST_API_ENDPOINT;

export type LoginApiResponse = {
  message: string;
  data: {
    user: {
      id: number;
      username: string;
      email: string;
      role: string;
      permissions: string[];
    };
    token: string;
    refreshToken?: string;
  };
};

/** Used by NextAuth `authorize` only — lives in its own module so `actions.ts` never pulls in `next-auth/react` via `api.ts`. */
export async function loginUser(credentials: {
  username: string;
  password: string;
}): Promise<LoginApiResponse> {
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
    return response.json() as Promise<LoginApiResponse>;
  }
  throw new Error("Login failed");
}
