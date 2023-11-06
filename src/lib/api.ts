import { getSession } from "next-auth/react";

export async function authenticatedRequest<T>(
  url: string,
  method: string = "GET",
  data: any = null
): Promise<T | null> {
  const session = await getSession();

  if (!session || !session.user || !session.user.accessToken) {
    throw new Error("User session or accessToken not found.");
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.user.accessToken}`,
  };

  const options: RequestInit = {
    method,
    headers,
    body: data ? JSON.stringify(data) : null,
  };

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`API request failed with status: ${response.status}`);
  }

  if (response.status === 204) {
    return null; // No content, return null
  }

  return response.json();
}
