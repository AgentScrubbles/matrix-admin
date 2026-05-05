const BASE = "/api/v1";

async function request<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...opts?.headers },
    ...opts,
  });
  if (res.status === 401) {
    window.dispatchEvent(new Event("auth:expired"));
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  uploadFile: async <T>(path: string, file: File): Promise<T> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    if (res.status === 401) {
      window.dispatchEvent(new Event("auth:expired"));
      throw new Error("Unauthorized");
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || `Upload failed: ${res.status}`);
    }
    return res.json();
  },
};
