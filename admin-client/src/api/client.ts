const API_BASE = "/api/v1";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getToken(): string | null {
  return localStorage.getItem("admin_token");
}

export function setToken(token: string) {
  localStorage.setItem("admin_token", token);
}

export function clearToken() {
  localStorage.removeItem("admin_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let message = "Request failed";
    try {
      const body = await res.json();
      message = body.message || body.error || message;
      if (Array.isArray(message)) message = message[0];
    } catch {
      message = res.statusText || message;
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return res.json();
  }

  return res as unknown as T;
}

export const api = {
  login: (mobile: string, password: string) =>
    request<{ token: string; user: { name: string; role: string } }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ mobile, password }),
      }
    ),

  getStats: () => request<Stats>("/admin/stats"),

  getUsers: (page = 1, limit = 20, search = "") => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search) params.set("search", search);
    return request<Paginated<AdminUser>>(`/admin/users?${params}`);
  },

  getBarcodes: (
    page = 1,
    limit = 20,
    search = "",
    status?: string
  ) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    return request<Paginated<AdminBarcode>>(`/admin/barcodes?${params}`);
  },

  getAwards: () => request<{ data: Award[] }>("/admin/awards"),

  createAward: (data: CreateAwardInput) =>
    request<{ data: Award }>("/admin/awards", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateAward: (id: number, data: Partial<CreateAwardInput>) =>
    request<{ data: Award }>(`/admin/awards/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  getAgents: () => request<{ data: Agent[] }>("/admin/agents"),

  createAgent: (data: CreateAgentInput) =>
    request<{ data: Agent }>("/admin/agents", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateAgent: (id: number, data: Partial<CreateAgentInput>) =>
    request<{ data: Agent }>(`/admin/agents/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  getTransitions: (page = 1, limit = 20) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    return request<Paginated<AdminTransition>>(`/admin/transitions?${params}`);
  },

  generateBarcodes: async (data: GenerateBarcodeInput) => {
    const token = getToken();
    const res = await fetch(`${API_BASE}/barcodes/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new ApiError("Failed to generate barcodes", res.status);
    }

    const blob = await res.blob();
    const disposition = res.headers.get("content-disposition");
    const fileName =
      disposition?.match(/filename="?([^"]+)"?/)?.[1] ?? "barcodes.xlsx";

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  },
};

export interface Stats {
  totalUsers: number;
  totalBarcodes: number;
  usedBarcodes: number;
  unusedBarcodes: number;
  winnerBarcodes: number;
  totalTransitions: number;
  successfulTransitions: number;
  totalAgents: number;
  totalAwards: number;
  recentScans: RecentScan[];
}

export interface RecentScan {
  barcode_id: string;
  user_name: string | null;
  user_mobile: string | null;
  award_type: string | null;
  award_value: string | null;
  agent_name: string | null;
  used_at: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminUser {
  user_id: number;
  name: string;
  mobile: string;
  points: number;
  role: string;
  sim_provider: string;
  is_verified: boolean;
  created_at: string;
}

export interface AdminBarcode {
  barcode_id: string;
  is_used: boolean;
  winner: boolean;
  is_redeemed: boolean;
  isMetalized: boolean;
  user_name: string | null;
  user_mobile: string | null;
  award_type: string | null;
  award_value: string | null;
  agent_name: string | null;
  used_at: string | null;
  created_at: string;
}

export interface Award {
  award_id: number;
  award_type: "points" | "discount" | "physical";
  award_value: string;
  percentage: number;
  award_description: string;
}

export interface Agent {
  agent_id: number;
  agent_name: string;
  agent_logo: string | null;
  agent_primary_color: string | null;
}

export interface AdminTransition {
  transition_id: number;
  is_success: boolean;
  is_accepted: boolean;
  user_name: string | null;
  user_mobile: string | null;
  amount: number | null;
  provider: string | null;
  sent_at: string;
}

export interface CreateAwardInput {
  award_type: "points" | "discount" | "physical";
  award_value: string;
  percentage: number;
  award_description: string;
}

export interface CreateAgentInput {
  agent_name: string;
  agent_logo?: string;
  agent_primary_color?: string;
}

export interface GenerateBarcodeInput {
  count: number;
  agent_id: number;
  award_id: number;
  isMetalized?: boolean;
}
