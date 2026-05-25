export interface User {
  phone: string;       // serves as unique ID (starts with country code, e.g. +1... or +91...)
  username: string;
  referralCode: string; // their auto-generated code
  referredBy?: string;  // code of user who referred them
  balance: number;      // in dollars ($)
  role: 'user' | 'admin';
  createdAt: string;
  spins?: number;       // available free spin counts
}

export interface InvestmentProduct {
  id: string;
  name: string;
  image: string;        // Package image path/URL
  price: number;        // Purchase price
  dailyIncome: number;  // Daily Income
  dailyEarning: number; // Keep for interface compatibility
  durationDays: number; // Duration in days
  totalIncome: number;  // dailyIncome * durationDays
  description: string;
  status: 'active' | 'inactive';
  createdAt?: string;
  category?: string;     // category ID
  icon?: string;
  rating?: number;
  purchaseLimit?: number; // Optional purchase limit
}

export interface UserInvestment {
  id: string;
  phone: string;        // same as userId in this environment
  userId?: string;      // Unique user ID
  productId: string;
  productName: string;
  price: number;        // Purchase price or purchaseAmount
  purchaseAmount?: number;
  dailyIncome?: number;
  dailyEarning: number;
  earnedSoFar: number;
  totalIncome?: number;
  durationDays: number;
  daysPassed: number;
  status: 'active' | 'completed' | 'inactive';
  createdAt: string;
  startDate?: string;
  endDate?: string;
  lastCollectAt: string; // when earnings were last collected
}

export interface DepositRequest {
  id: string;
  phone: string;
  amount: number;
  method: string;
  txid: string;         // user entered transaction detail (e.g. ID / hash)
  status: 'pending' | 'approved' | 'rejected';
  adminReason?: string; // set if rejected
  screenshot?: string;  // optional screenshot base64 / URL
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  phone: string;
  amount: number;       // base amount
  deductedAmount: number; // amount - gst (or is it amount + GST? The prompt says "if admin accepts the balance is deducted by the money + 18% gst")
  status: 'pending' | 'approved' | 'rejected';
  adminReason?: string; // reason for rejection
  createdAt: string;
  paymentDetails: string; // user's billing/receiving address
}

export interface AdminSettings {
  paymentDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    usdtAddress: string;
    instructions: string;
  };
}

export interface ForumNews {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
}
