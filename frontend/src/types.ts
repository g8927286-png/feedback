export interface Feedback {
  id: number;
  name: string | null;
  email: string | null;
  category: string;
  rating: number;
  message: string;
  created_at: string;
  audio_url?: string | null;
}

export interface Stats {
  total: number;
  average_rating: number;
  satisfaction_rate: number;
  rating_distribution: Record<string, number>;
  category_distribution: Record<string, number>;
  trend: { date: string; count: number }[];
}

export interface FeedbackDraft {
  name: string;
  email: string;
  category: string;
  rating: number;
  message: string;
}
