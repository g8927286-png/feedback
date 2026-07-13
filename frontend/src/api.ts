import type { Feedback, FeedbackDraft, Stats } from "./types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

class ApiError extends Error {
  fieldErrors?: Record<string, string>;
  constructor(message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.fieldErrors = fieldErrors;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(data.error || "Ocorreu um erro. Tente novamente.", data.errors);
  }

  return data as T;
}

export function getCategories() {
  return request<{ categories: string[] }>("/categories");
}

export function submitFeedback(draft: FeedbackDraft) {
  return request<{ message: string; feedback: Feedback }>("/feedback", {
    method: "POST",
    body: JSON.stringify(draft),
  });
}

export async function submitFeedbackForm(form: FormData) {
  const res = await fetch(`${API_BASE}/feedback`, {
    method: 'POST',
    body: form,
    // Do not set Content-Type — browser will add multipart boundary
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new ApiError(data.error || 'Ocorreu um erro. Tente novamente.', data.errors)
  }

  return res.json() as Promise<{ message: string; feedback: Feedback }> 
}

export function adminLogin(password: string) {
  return request<{ token: string; institution: string }>("/admin/login", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}

export function listFeedback(
  token: string,
  filters: { category?: string; rating?: string; search?: string } = {}
) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString() ? `?${params.toString()}` : "";
  return request<{ feedback: Feedback[]; total: number }>(`/feedback${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((data) => {
    // Normalize audio URLs: backend returns "/uploads/xxx", so prefix with origin
    const origin = API_BASE.replace(/\/api\/?$/, "");
    data.feedback = data.feedback.map((f) => {
      if ((f as any).audio_url && (f as any).audio_url.startsWith("/")) {
        return { ...f, audio_url: `${origin}${(f as any).audio_url}` } as Feedback;
      }
      return f;
    });
    return data;
  });
}

export function deleteFeedback(token: string, id: number) {
  return request<{ message: string }>(`/feedback/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getStats(token: string) {
  return request<Stats>("/stats", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export { ApiError };
