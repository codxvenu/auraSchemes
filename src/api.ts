import { User, InvestmentProduct, UserInvestment, DepositRequest, WithdrawalRequest, AdminSettings, ForumNews } from "./types";

const getAuthToken = () => localStorage.getItem("aura_token") || "";

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "An unexpected error occurred from Aura system.");
  }

  return response.json() as Promise<T>;
}

export const auraApi = {
  // Authentication
  async register(phone: string, nickName: string, password: string, referralCode: string): Promise<{ token: string; user: User }> {
    return apiFetch<{ token: string; user: User }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ phone, username: nickName, password, referralCode })
    });
  },

  async login(phone: string, password: string): Promise<{ token: string; user: User }> {
    return apiFetch<{ token: string; user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ phone, password })
    });
  },

  async getMe(): Promise<{ user: User }> {
    return apiFetch<{ user: User }>("/api/auth/me");
  },

  async updateProfile(username?: string, newPassword?: string): Promise<{ success: boolean; user: User }> {
    return apiFetch<{ success: boolean; user: User }>("/api/auth/update-profile", {
      method: "POST",
      body: JSON.stringify({ username, newPassword })
    });
  },

  // Financial User Actions
  async getFinancialSettings(): Promise<{ adminSettings: AdminSettings }> {
    return apiFetch<{ adminSettings: AdminSettings }>("/api/financial/settings");
  },

  async getMyTransactions(): Promise<{ deposits: DepositRequest[]; withdrawals: WithdrawalRequest[] }> {
    return apiFetch<{ deposits: DepositRequest[]; withdrawals: WithdrawalRequest[] }>("/api/financial/my-transactions");
  },

  async submitDeposit(amount: number, method: string, txid: string): Promise<{ success: boolean; deposit: DepositRequest }> {
    return apiFetch<{ success: boolean; deposit: DepositRequest }>("/api/financial/deposit", {
      method: "POST",
      body: JSON.stringify({ amount, method, txid })
    });
  },

  async submitWithdraw(amount: number, paymentDetails: string): Promise<{ success: boolean; withdrawal: WithdrawalRequest }> {
    return apiFetch<{ success: boolean; withdrawal: WithdrawalRequest }>("/api/financial/withdraw", {
      method: "POST",
      body: JSON.stringify({ amount, paymentDetails })
    });
  },

  // Interactive Mini-game (Lucky Wheel)
  async spinLuckyWheel(): Promise<{ success: boolean; outcome: string; reward: number; cost: number; newBalance: number }> {
    return apiFetch<{ success: boolean; outcome: string; reward: number; cost: number; newBalance: number }>("/api/mini-game/spin", {
      method: "POST"
    });
  },

  // Investments Nodes Marketplace
  async getProducts(): Promise<{ products: InvestmentProduct[] }> {
    return apiFetch<{ products: InvestmentProduct[] }>("/api/products");
  },

  async getMyInvestments(): Promise<{ investments: UserInvestment[] }> {
    return apiFetch<{ investments: UserInvestment[] }>("/api/investments/my-investments");
  },

  async investProduct(productId: string): Promise<{ success: boolean; investment: UserInvestment; newBalance: number; message: string }> {
    return apiFetch<{ success: boolean; investment: UserInvestment; newBalance: number; message: string }>("/api/products/invest", {
      method: "POST",
      body: JSON.stringify({ productId })
    });
  },

  // News bulletins
  async getNews(): Promise<{ news: ForumNews[] }> {
    return apiFetch<{ news: ForumNews[] }>("/api/news");
  },

  // --- ADMIN CONSOLE OPERATIONS ---
  async getAdminMetrics(): Promise<{
    users: User[];
    deposits: DepositRequest[];
    withdrawals: WithdrawalRequest[];
    investments: UserInvestment[];
    adminSettings: AdminSettings;
  }> {
    return apiFetch<any>("/api/admin/metrics");
  },

  async updateAdminSettings(settings: Partial<AdminSettings["paymentDetails"]>): Promise<{ success: boolean; adminSettings: AdminSettings }> {
    return apiFetch<{ success: boolean; adminSettings: AdminSettings }>("/api/admin/update-settings", {
      method: "POST",
      body: JSON.stringify(settings)
    });
  },

  async approveDeposit(depositId: string): Promise<{ success: boolean; message: string }> {
    return apiFetch<{ success: boolean; message: string }>("/api/admin/deposits/approve", {
      method: "POST",
      body: JSON.stringify({ depositId })
    });
  },

  async rejectDeposit(depositId: string, reason: string): Promise<{ success: boolean; message: string }> {
    return apiFetch<{ success: boolean; message: string }>("/api/admin/deposits/reject", {
      method: "POST",
      body: JSON.stringify({ depositId, reason })
    });
  },

  async approveWithdrawal(withdrawalId: string): Promise<{ success: boolean; message: string }> {
    return apiFetch<{ success: boolean; message: string }>("/api/admin/withdrawals/approve", {
      method: "POST",
      body: JSON.stringify({ withdrawalId })
    });
  },

  async rejectWithdrawal(withdrawalId: string, reason: string): Promise<{ success: boolean; message: string }> {
    return apiFetch<{ success: boolean; message: string }>("/api/admin/withdrawals/reject", {
      method: "POST",
      body: JSON.stringify({ withdrawalId, reason })
    });
  },

  async adminAdjustBalance(phone: string, balance: number): Promise<{ success: boolean; message: string }> {
    return apiFetch<{ success: boolean; message: string }>("/api/admin/users/adjust", {
      method: "POST",
      body: JSON.stringify({ phone, balance })
    });
  },

  async addNewsItem(title: string, content: string): Promise<{ success: boolean; item: ForumNews }> {
    return apiFetch<{ success: boolean; item: ForumNews }>("/api/admin/news/add", {
      method: "POST",
      body: JSON.stringify({ title, content })
    });
  }
};

// Utilities for cleaner human display metrics
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch (err) {
    return isoStr;
  }
}
