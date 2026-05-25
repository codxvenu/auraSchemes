import express from "express";
import path from "path";
import fs from "fs";
import { 
  User, 
  InvestmentProduct, 
  UserInvestment, 
  DepositRequest, 
  WithdrawalRequest, 
  AdminSettings, 
  ForumNews 
} from "../src/types";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "aura_db.json");

app.use(express.json());

// --- DATABASE IN-MEMORY AND FILE PERSISTENCE ENGINE ---
interface DatabaseSchema {
  users: User[];
  passwords: Record<string, string>; // phone -> password
  products: InvestmentProduct[];
  investments: UserInvestment[];
  deposits: DepositRequest[];
  withdrawals: WithdrawalRequest[];
  adminSettings: AdminSettings;
  news: ForumNews[];
}

let db: DatabaseSchema = {
  users: [],
  passwords: {},
  products: [],
  investments: [],
  deposits: [],
  withdrawals: [],
  adminSettings: {
    paymentDetails: {
      bankName: "Aura Global Liquidity Bank",
      accountNumber: "9100-2443-8822-09",
      accountName: "Aura Escrow Services LLC",
      usdtAddress: "TY9H2jKw87hsdKKjsdf8892hhKasdk",
      instructions: "Transfer the amount via USDT (TRC20) or your Local Bank Account. Enter your exact Transaction Hash/TXID or Transfer reference below. The Admin will review and credit your balance within 10 minutes."
    }
  },
  news: []
};

// Seed initial default products and admin
function seedDatabase() {
  // Pre-seed core investment products
  const hasLegacyOrMissingNew = !db.products.some(p => p.id === "s1") || db.products.some(p => p.id === "prod-basic" || p.id === "S1");
  if (hasLegacyOrMissingNew || db.products.length === 0) {
    db.products = [
      {
        id: "s1",
        name: "S1",
        image: "https://lqcaso.com/ui7/pro/1.jpg",
        price: 10000,
        dailyIncome: 1000,
        dailyEarning: 1000,
        durationDays: 90,
        totalIncome: 90000,
        status: "active",
        category: "deposit",
        icon: "⌚",
        description: "Starter investment package S1 featuring high quality catalog assets.",
        rating: 4.8
      },
      {
        id: "s2",
        name: "S2",
        image: "https://lqcaso.com/ui7/pro/2.jpg",
        price: 40000,
        dailyIncome: 7300,
        dailyEarning: 7300,
        durationDays: 90,
        totalIncome: 657000,
        status: "active",
        category: "deposit",
        icon: "⚡",
        description: "Advanced investment package S2 with premium compound earnings model.",
        rating: 4.9
      },
      {
        id: "s3",
        name: "S3",
        image: "https://lqcaso.com/ui7/pro/3.jpg",
        price: 100000,
        dailyIncome: 20700,
        dailyEarning: 20700,
        durationDays: 90,
        totalIncome: 1863000,
        status: "active",
        category: "vip-plan",
        icon: "👑",
        description: "Pro VIP investment package S3 with maximum daily payout yields.",
        rating: 5.0
      }
    ];
  }

  // Pre-seed news
  if (db.news.length === 0) {
    db.news = [
      {
        id: "news-1",
        title: "Aura Platform Launch & Node Pool Upgrades",
        content: "We are thrilled to launch Aura - the premium editorial marketplace for high-performance key-vouchers and micro-node bonding. Enjoy zero-fee local deposits and swift automated audits.",
        date: "2026-05-24",
        author: "Aura Admin Team"
      },
      {
        id: "news-2",
        title: "USDT (TRC20) Liquidity Reserves Audited",
        content: "Our corporate reserve wallets have passed third-party Swiss liquidity audits. All global withdrawals remain 100% liquid and instant.",
        date: "2026-05-23",
        author: "Aura Compliance"
      }
    ];
  }

  // Pre-seed Admin account if none exists
  const adminExists = db.users.some(u => u.role === "admin");
  if (!adminExists) {
    // Default Admin
    const adminUser: User = {
      phone: "+1111111111",
      username: "Aura CEO",
      referralCode: "AURA",
      referredBy: undefined,
      balance: 10000,
      role: 'admin',
      createdAt: new Date().toISOString()
    };
    db.users.push(adminUser);
    db.passwords["+1111111111"] = "admin"; // phone -> password
  }
}

function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(data);
      db = { ...db, ...parsed };
      console.log("Database loaded successfully with", db.users.length, "users.");
    } else {
      console.log("Database file not found, seeding fresh defaults.");
    }
    seedDatabase();
    saveDatabase();
  } catch (err) {
    console.error("Error loading database:", err);
    seedDatabase();
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving database:", err);
  }
}

loadDatabase();

// --- AUTH TOKENS MAP ---
// Simple token generator for direct iframe stability
const sessions: Record<string, string> = {}; // token -> phone

function getAuthenticatedUser(req: express.Request): User | null {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "").trim();
  const phone = sessions[token];
  if (!phone) return null;
  return db.users.find(u => u.phone === phone) || null;
}

// --- AUTOMATIC DAILY REWARD CRON SIMULATION ---
// To simulate daily earnings, when the user visits the page, we calculate passed time
// and credit daily yield directly from current user investments.
function tickUserInvestments(userPhone: string) {
  const userInvestments = db.investments.filter(inv => inv.phone === userPhone && inv.status === 'active');
  let totalCredited = 0;
  const userIndex = db.users.findIndex(u => u.phone === userPhone);
  if (userIndex === -1 || userInvestments.length === 0) return;

  const now = Date.now();
  
  userInvestments.forEach(inv => {
    const lastCollect = new Date(inv.lastCollectAt).getTime();
    const diffMs = now - lastCollect;
    
    // Simulate speeded-up days in a demo environment or standard daily schedule.
    // Let's treat every 45 SECONDS as a "Day" of investment payout so users can actually 
    // witness their balances growing in real-time in the AI Studio preview! 
    // This is an incredible design choice for a sandbox platform, but we'll fall back to 
    // 45s for instant demonstration, and keep track elegantly!
    const DAY_MS = 45 * 1000; 
    const earnedCycles = Math.floor(diffMs / DAY_MS);
    
    if (earnedCycles > 0) {
      const cyclesToCollect = Math.min(earnedCycles, inv.durationDays - inv.daysPassed);
      if (cyclesToCollect > 0) {
        const yieldAmount = cyclesToCollect * inv.dailyEarning;
        inv.earnedSoFar += yieldAmount;
        inv.daysPassed += cyclesToCollect;
        totalCredited += yieldAmount;
        
        if (inv.daysPassed >= inv.durationDays) {
          inv.status = 'completed';
        }
      }
      // Update last collect date by increments of cycles to preserve accurate clocks
      inv.lastCollectAt = new Date(lastCollect + (cyclesToCollect * DAY_MS)).toISOString();
    }
  });

  if (totalCredited > 0) {
    db.users[userIndex].balance += totalCredited;
    saveDatabase();
  }
}

// --- API ENDPOINTS ---

// Check configuration / health
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// 1. PHONE AUTHENTICATION APIs
// Register user
app.post("/api/auth/register", (req, res) => {
  const { phone, password, username, referralCode } = req.body;

  if (!phone || !password || !username) {
    return res.status(400).json({ error: "Phone number, password, and nickName are required." });
  }

  // Referral code is strictly required!
  if (!referralCode) {
    return res.status(400).json({ error: "Registration blocked! A valid referral code is required to register." });
  }

  // Validate referrer exists
  const referrerIndex = db.users.findIndex(u => u.referralCode.toUpperCase() === referralCode.toUpperCase());
  if (referrerIndex === -1) {
    return res.status(400).json({ error: "Registration blocked! The referral code entered is invalid." });
  }
  const referrer = db.users[referrerIndex];

  // Check if double phone
  const existingUser = db.users.find(u => u.phone === phone);
  if (existingUser) {
    return res.status(400).json({ error: "This phone number is already registered inside Aura." });
  }

  // Generate unique referral code for the new user
  const ownRefCode = "AURA-" + Math.floor(1000 + Math.random() * 9000);

  // Default initial sign-up balance (0 Dinars as requested)
  const newUser: User = {
    phone,
    username,
    referralCode: ownRefCode,
    referredBy: referrer.referralCode,
    balance: 0, 
    role: 'user',
    createdAt: new Date().toISOString(),
    spins: 1 // Start with exactly 1 free spin!
  };

  db.users.push(newUser);
  db.passwords[phone] = password;
  saveDatabase();

  // Auto-log the user in
  const token = "TOKEN_" + phone + "_" + Date.now();
  sessions[token] = phone;

  res.json({
    message: "Registration successful!",
    token,
    user: newUser
  });
});

// Login User
app.post("/api/auth/login", (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ error: "Phone number and password are required." });
  }

  const user = db.users.find(u => u.phone === phone);
  if (!user || db.passwords[phone] !== password) {
    return res.status(400).json({ error: "Invalid phone number or password." });
  }

  // Support initializing spins count on first login to exactly 1
  if (typeof user.spins !== 'number') {
    user.spins = 1;
  }

  // Complete reward updates
  tickUserInvestments(phone);
  saveDatabase();

  const token = "TOKEN_" + phone + "_" + Date.now();
  sessions[token] = phone;

  res.json({
    message: "Login successful!",
    token,
    user
  });
});

// Get user profile state
app.get("/api/auth/me", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized access. Please login." });
  }

  // Trigger investment clock before reflecting balance
  tickUserInvestments(user.phone);

  // Return fresh copy of user details
  const freshUser = db.users.find(u => u.phone === user.phone);
  if (freshUser && typeof freshUser.spins !== 'number') {
    freshUser.spins = 1;
    saveDatabase();
  }
  res.json({ user: freshUser });
});

// Update Account details
app.post("/api/auth/update-profile", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const { username, newPassword } = req.body;
  const userIndex = db.users.findIndex(u => u.phone === user.phone);
  if (userIndex === -1) return res.status(400).json({ error: "User not found" });

  if (username) {
    db.users[userIndex].username = username;
  }
  if (newPassword) {
    db.passwords[user.phone] = newPassword;
  }

  saveDatabase();
  res.json({ success: true, user: db.users[userIndex] });
});

// 2. FINANCIAL TRANSACTIONS
app.get("/api/financial/settings", (req, res) => {
  res.json({ adminSettings: db.adminSettings });
});

// Get all transaction requests for logged in user
app.get("/api/financial/my-transactions", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const userDeposits = db.deposits.filter(d => d.phone === user.phone);
  const userWithdrawals = db.withdrawals.filter(w => w.phone === user.phone);

  res.json({
    deposits: userDeposits,
    withdrawals: userWithdrawals
  });
});

// Submit Deposit request
app.post("/api/financial/deposit", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { amount, method, txid } = req.body;
  const parsedAmt = parseFloat(amount);

  if (isNaN(parsedAmt) || parsedAmt < 5 || parsedAmt > 300) {
    return res.status(400).json({ error: "Invalid deposit amount. Must be between $5 and $300." });
  }

  if (!txid || txid.trim().length === 0) {
    return res.status(400).json({ error: "Transaction verification detail/TXID is required." });
  }

  const newDeposit: DepositRequest = {
    id: "DEP-" + Date.now(),
    phone: user.phone,
    amount: parsedAmt,
    method: method || "USDT",
    txid: txid.trim(),
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  db.deposits.push(newDeposit);
  saveDatabase();

  res.json({ success: true, message: "Deposit submitted! Admin will verify standard proof.", deposit: newDeposit });
});

// Submit Withdrawal request
app.post("/api/financial/withdraw", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { amount, paymentDetails } = req.body;
  const parsedAmt = parseFloat(amount);

  if (isNaN(parsedAmt) || parsedAmt < 5000 || parsedAmt > 30000) {
    return res.status(400).json({ error: "Invalid withdrawal amount. Must be between 5,000 and 30,000 Dinars." });
  }

  if (!paymentDetails || paymentDetails.trim().length === 0) {
    return res.status(400).json({ error: "Receiving payout details (Wallet address or Account credentials) are required." });
  }

  // Deduct = amount + 18% GST (Total deduction from balance is amount * 1.18)
  const totalDeduction = parsedAmt * 1.18;

  // Refresh balance ticks first
  tickUserInvestments(user.phone);
  const freshUser = db.users.find(u => u.phone === user.phone)!;

  if (freshUser.balance < totalDeduction) {
    return res.status(400).json({ 
      error: `Insufficient balance! To withdraw ${parsedAmt.toLocaleString()} Dinars, your account requires ${totalDeduction.toLocaleString()} Dinars (including 18% GST). Current Balance: ${freshUser.balance.toLocaleString()} Dinars.` 
    });
  }

  const newWithdrawal: WithdrawalRequest = {
    id: "WITH-" + Date.now(),
    phone: user.phone,
    amount: parsedAmt,
    deductedAmount: totalDeduction,
    status: 'pending',
    createdAt: new Date().toISOString(),
    paymentDetails: paymentDetails.trim()
  };

  db.withdrawals.push(newWithdrawal);
  saveDatabase();

  res.json({ 
    success: true, 
    message: `Withdrawal request submitted! Pending ${totalDeduction.toLocaleString()} Dinars authorization.`, 
    withdrawal: newWithdrawal 
  });
});

// 3. INVESTMENTS / MARKETPLACE PRODUCTS APIs
app.get("/api/products", (req, res) => {
  res.json({ products: db.products });
});

app.get("/api/investments/my-investments", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  tickUserInvestments(user.phone);
  const myInvs = db.investments.filter(i => i.phone === user.phone);
  res.json({ investments: myInvs });
});

// Purchase Product Node / Key
app.post("/api/products/invest", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { productId } = req.body;
  const product = db.products.find(p => p.id === productId);

  if (!product) return res.status(400).json({ error: "Selected product/package not found" });
  if (product.status === "inactive") {
    return res.status(400).json({ error: "This package is currently disabled by administration." });
  }

  // Update ticks first
  tickUserInvestments(user.phone);
  const userIndex = db.users.findIndex(u => u.phone === user.phone);
  const freshUser = db.users[userIndex];

  if (freshUser.balance < product.price) {
    return res.status(400).json({ error: `Insufficient funds. Purchase price is ${product.price.toLocaleString()} Dinars, your current balance is ${freshUser.balance.toLocaleString()} Dinars.` });
  }

  // Deduct
  db.users[userIndex].balance -= product.price;

  // Add Investment node with User Purchases Collection Schema
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + product.durationDays * 24 * 60 * 60 * 1000);

  const dailyInc = product.dailyIncome || product.dailyEarning;
  const totalInc = product.totalIncome || (dailyInc * product.durationDays);

  const userInv: UserInvestment = {
    id: "INV-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
    phone: user.phone,
    userId: user.phone,
    productId: product.id,
    productName: product.name,
    price: product.price,
    purchaseAmount: product.price,
    dailyIncome: dailyInc,
    dailyEarning: dailyInc,
    earnedSoFar: 0,
    totalIncome: totalInc,
    durationDays: product.durationDays,
    daysPassed: 0,
    status: 'active',
    createdAt: startDate.toISOString(),
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    lastCollectAt: startDate.toISOString()
  };

  db.investments.push(userInv);
  saveDatabase();

  res.json({
    success: true,
    message: `Package ${product.name} purchased successfully for ${product.price.toLocaleString()} Dinars! Earning ${dailyInc.toLocaleString()} Dinars active daily returns.`,
    investment: userInv,
    newBalance: db.users[userIndex].balance
  });
});

// Interactive Category Mini-Game: Lucky Wheel Spin
// Uses a free spin count instead of balance deduction, and adds won money directly to user balance!
app.post("/api/mini-game/spin", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  // Check ticks
  tickUserInvestments(user.phone);
  const userIndex = db.users.findIndex(u => u.phone === user.phone);
  const freshUser = db.users[userIndex];

  const currentSpins = typeof freshUser.spins === "number" ? freshUser.spins : 1;

  if (currentSpins < 1) {
    return res.status(400).json({ 
      error: "You have 0 free spins left! Refer someone using your referral code to earn more free spins." 
    });
  }

  // Deduct 1 Spin
  db.users[userIndex].spins = currentSpins - 1;

  // Spin yields: 
  // 50-50 chances for "Better luck next time" and "5000 IDR Prize Value" as requested
  const outcomes = [
    { label: "5000 IDR Prize Value", prize: 5000, weight: 50 },
    { label: "Better luck next time", prize: 0, weight: 50 },
    { label: "10000 IDR grand Prize", prize: 0, weight: 0 },
    { label: "Iphone 17", prize: 0, weight: 0 },
    { label: "600k IDR", prize: 0, weight: 0 },
    { label: "Playstation", prize: 0, weight: 0 },
    { label: "AC", prize: 0, weight: 0 }
  ];

  // Weighted random logic
  const totalWeight = outcomes.reduce((acc, current) => acc + current.weight, 0);
  let random = Math.random() * totalWeight;
  let selected = outcomes[0];

  for (const outcome of outcomes) {
    if (random < outcome.weight) {
      selected = outcome;
      break;
    }
    random -= outcome.weight;
  }

  // Credit won money directly to the user's account balance
  db.users[userIndex].balance += selected.prize;
  saveDatabase();

  res.json({
    success: true,
    outcome: selected.label,
    reward: selected.prize,
    cost: 0,
    newBalance: db.users[userIndex].balance,
    message: `Spun successfully! You drew "${selected.label}" and received ${selected.prize} Dinars in your account.`
  });
});

// 4. ADMIN LEVEL CONTROLLER OPERATIONS
function verifyAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: "Access Denied. Operations restricted to Aura Administration." });
  }
  next();
}

// Get Admin full logs & stats
app.get("/api/admin/metrics", verifyAdmin, (req, res) => {
  res.json({
    users: db.users.map(u => ({
      phone: u.phone,
      username: u.username,
      referralCode: u.referralCode,
      referredBy: u.referredBy,
      balance: u.balance,
      role: u.role,
      createdAt: u.createdAt
    })),
    deposits: db.deposits,
    withdrawals: db.withdrawals,
    investments: db.investments,
    adminSettings: db.adminSettings
  });
});

// Update deposit instructions
app.post("/api/admin/update-settings", verifyAdmin, (req, res) => {
  const { bankName, accountNumber, accountName, usdtAddress, instructions } = req.body;
  
  if (bankName) db.adminSettings.paymentDetails.bankName = bankName;
  if (accountNumber) db.adminSettings.paymentDetails.accountNumber = accountNumber;
  if (accountName) db.adminSettings.paymentDetails.accountName = accountName;
  if (usdtAddress) db.adminSettings.paymentDetails.usdtAddress = usdtAddress;
  if (instructions) db.adminSettings.paymentDetails.instructions = instructions;

  saveDatabase();
  res.json({ success: true, adminSettings: db.adminSettings });
});

// Approve Deposit
app.post("/api/admin/deposits/approve", verifyAdmin, (req, res) => {
  const { depositId } = req.body;
  const deposit = db.deposits.find(d => d.id === depositId);

  if (!deposit) return res.status(400).json({ error: "Deposit request not found." });
  if (deposit.status !== 'pending') return res.status(400).json({ error: "Deposit request already processed." });

  const targetUserIndex = db.users.findIndex(u => u.phone === deposit.phone);
  if (targetUserIndex === -1) {
    return res.status(400).json({ error: "Target user not found." });
  }

  // Credit amount and update status
  const user = db.users[targetUserIndex];
  const priorApprovedCount = db.deposits.filter(d => d.phone === user.phone && d.status === 'approved').length;

  deposit.status = 'approved';
  db.users[targetUserIndex].balance += deposit.amount;

  // Add 10% first deposit bonus to Sponsor if referral exists!
  if (user.referredBy) {
    const sponsorIndex = db.users.findIndex(u => u.referralCode === user.referredBy);
    if (sponsorIndex !== -1) {
      // credit referral bonus
      const referralBonus = deposit.amount * 0.10;
      db.users[sponsorIndex].balance += referralBonus;
      console.log(`Referral commission of $${referralBonus} paid to Sponsor: ${db.users[sponsorIndex].phone}`);

      // If this is the referred user's first approved deposit, award 1 free spin to their sponsor!
      if (priorApprovedCount === 0) {
        db.users[sponsorIndex].spins = (db.users[sponsorIndex].spins || 0) + 1;
        console.log(`First deposit approved! Awarded 1 free spin to Sponsor: ${db.users[sponsorIndex].phone}`);
      }
    }
  }

  saveDatabase();
  res.json({ success: true, message: "Deposit approved! Account balance credited." });
});

// Reject Deposit
app.post("/api/admin/deposits/reject", verifyAdmin, (req, res) => {
  const { depositId, reason } = req.body;
  
  if (!reason || reason.trim().length === 0) {
    return res.status(400).json({ error: "Rejection requires a supportive audit reason/message." });
  }

  const deposit = db.deposits.find(d => d.id === depositId);
  if (!deposit) return res.status(400).json({ error: "Deposit request not found." });
  if (deposit.status !== 'pending') return res.status(400).json({ error: "Deposit already processed." });

  deposit.status = 'rejected';
  deposit.adminReason = reason.trim();

  saveDatabase();
  res.json({ success: true, message: "Deposit rejected." });
});

// Approve Withdrawal
app.post("/api/admin/withdrawals/approve", verifyAdmin, (req, res) => {
  const { withdrawalId } = req.body;
  const withdrawal = db.withdrawals.find(w => w.id === withdrawalId);

  if (!withdrawal) return res.status(400).json({ error: "Withdrawal request not found." });
  if (withdrawal.status !== 'pending') return res.status(400).json({ error: "Withdrawal already processed." });

  const userIndex = db.users.findIndex(u => u.phone === withdrawal.phone);
  if (userIndex === -1) return res.status(400).json({ error: "Target user not found." });

  const totalDeducted = withdrawal.deductedAmount; // amount + 18% GST

  // Double check if balance remains sufficient (in case user bought standard items since requesting)
  if (db.users[userIndex].balance < totalDeducted) {
    // Force reject or allow admin to see notice. We deduct what's possible or reject
    withdrawal.status = 'rejected';
    withdrawal.adminReason = "System audit: Insufficient user balance due to multiple simultaneous purchases since request.";
    saveDatabase();
    return res.status(400).json({ error: "Target user has depleted funds below authorization values." });
  }

  // Finalize deduction from balance on approval
  db.users[userIndex].balance -= totalDeducted;
  withdrawal.status = 'approved';

  saveDatabase();
  res.json({ success: true, message: "Withdrawal authorized successfully! Balance deducted." });
});

// Reject Withdrawal
app.post("/api/admin/withdrawals/reject", verifyAdmin, (req, res) => {
  const { withdrawalId, reason } = req.body;

  if (!reason || reason.trim().length === 0) {
    return res.status(400).json({ error: "Rejection requires an audit reason/message." });
  }

  const withdrawal = db.withdrawals.find(w => w.id === withdrawalId);
  if (!withdrawal) return res.status(400).json({ error: "Withdrawal request not found." });
  if (withdrawal.status !== 'pending') return res.status(400).json({ error: "Withdrawal already processed." });

  // Withdrawal is rejected, so we do NOT deduct anything
  withdrawal.status = 'rejected';
  withdrawal.adminReason = reason.trim();

  saveDatabase();
  res.json({ success: true, message: "Withdrawal rejected." });
});

// Admin manually adjust any user balance
app.post("/api/admin/users/adjust", verifyAdmin, (req, res) => {
  const { phone, balance } = req.body;
  const parsedBal = parseFloat(balance);

  if (isNaN(parsedBal)) return res.status(400).json({ error: "Invalid balance format" });

  const userIndex = db.users.findIndex(u => u.phone === phone);
  if (userIndex === -1) return res.status(400).json({ error: "User phone not found." });

  db.users[userIndex].balance = parsedBal;
  saveDatabase();

  res.json({ success: true, message: `Adjusted user ${phone} balance to $${parsedBal.toFixed(2)}` });
});

// Add News Bulletin
app.post("/api/admin/news/add", verifyAdmin, (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: "Title and content required." });

  const item: ForumNews = {
    id: "news-" + Date.now(),
    title,
    content,
    date: new Date().toISOString().split('T')[0],
    author: "Administration"
  };

  db.news.unshift(item);
  saveDatabase();
  res.json({ success: true, item });
});

// Admin product package management: Add product package
app.post("/api/admin/products/add", verifyAdmin, (req, res) => {
  const { id, name, image, price, dailyIncome, durationDays, description, purchaseLimit } = req.body;
  
  if (!id || !name || price === undefined || dailyIncome === undefined || durationDays === undefined) {
    return res.status(400).json({ error: "Required fields are missing: id, name, price, dailyIncome, durationDays" });
  }

  const idSanitized = id.trim();
  const exists = db.products.some(p => p.id === idSanitized);
  if (exists) {
    return res.status(400).json({ error: "Product with this ID already exists." });
  }

  const parsedPrice = Number(price);
  const parsedDaily = Number(dailyIncome);
  const parsedDuration = Number(durationDays);
  const totalInc = parsedDaily * parsedDuration;

  const newProduct: InvestmentProduct = {
    id: idSanitized,
    name: name.trim(),
    image: image ? image.trim() : "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
    price: parsedPrice,
    dailyIncome: parsedDaily,
    dailyEarning: parsedDaily,
    durationDays: parsedDuration,
    totalIncome: totalInc,
    description: description ? description.trim() : `High yield stable cash return package: S-Class.`,
    status: "active",
    category: "deposit",
    icon: "⌚",
    rating: 4.8
  };

  if (purchaseLimit !== undefined && purchaseLimit !== null && purchaseLimit !== "") {
    newProduct.purchaseLimit = Number(purchaseLimit);
  }

  db.products.push(newProduct);
  saveDatabase();

  res.json({ success: true, message: `Investment package ${newProduct.name} successfully created!`, product: newProduct });
});

// Admin product package management: Edit product package
app.post("/api/admin/products/edit", verifyAdmin, (req, res) => {
  const { productId, name, image, price, dailyIncome, durationDays, description, status, purchaseLimit } = req.body;
  
  if (!productId) {
    return res.status(400).json({ error: "Product unique ID (productId) is required to edit." });
  }

  const productIdx = db.products.findIndex(p => p.id === productId);
  if (productIdx === -1) {
    return res.status(404).json({ error: "Target investment package not found." });
  }

  const p = db.products[productIdx];

  if (name !== undefined) p.name = name.trim();
  if (image !== undefined) p.image = image.trim();
  if (price !== undefined) p.price = Number(price);
  
  if (dailyIncome !== undefined || durationDays !== undefined) {
    const daily = dailyIncome !== undefined ? Number(dailyIncome) : p.dailyIncome;
    const duration = durationDays !== undefined ? Number(durationDays) : p.durationDays;
    p.dailyIncome = daily;
    p.dailyEarning = daily; // Compatibility alignment
    p.durationDays = duration;
    p.totalIncome = daily * duration; // Recalculate total returns
  }
  
  if (description !== undefined) p.description = description.trim();
  if (status !== undefined) p.status = status;
  
  if (purchaseLimit !== undefined) {
    p.purchaseLimit = purchaseLimit !== null && purchaseLimit !== "" ? Number(purchaseLimit) : undefined;
  }

  saveDatabase();
  res.json({ success: true, message: `Package ${p.name} updated successfully!`, product: p });
});

// Get general news list
app.get("/api/news", (req, res) => {
  res.json({ news: db.news });
});


export default app;

