const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:4000/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const res = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 304 Not Modified responses
  if (res.status === 304) {
    // For 304 responses, the browser should use cached data
    // Since we can't access the cached response directly, we'll make a fresh request
    // without cache headers to get the actual data
    console.log(`304 Not Modified response for ${url} - making fresh request`);
    const freshRes = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
    });
    
    const freshIsJson = freshRes.headers.get("content-type")?.includes("application/json");
    const freshBody = freshIsJson ? await freshRes.json().catch(() => undefined) : undefined;
    
    if (!freshRes.ok) {
      const message = (freshBody as { message?: string })?.message || freshRes.statusText || "Request failed";
      const error = new Error(message) as Error & { status: number; body: unknown };
      error.status = freshRes.status;
      error.body = freshBody;
      console.error(`API Error for ${url} (fresh request):`, { status: freshRes.status, message, body: freshBody });
      throw error;
    }
    
    return freshBody as T;
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => undefined) : undefined;

  if (!res.ok) {
    const message = (body as { message?: string })?.message || res.statusText || "Request failed";
    const error = new Error(message) as Error & { status: number; body: unknown };
    error.status = res.status;
    error.body = body;
    console.error(`API Error for ${url}:`, { status: res.status, message, body });
    throw error;
  }
  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  put: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PUT", body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
