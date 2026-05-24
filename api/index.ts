import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
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
  if (db.products.length === 0) {
    db.products = [
      {
        id: "prod-basic",
        name: "Aura Micro-Bond Key",
        price: 15,
        dailyEarning: 0.9,
        durationDays: 30,
        category: "deposit",
        icon: "🔌",
        description: "Low-barrier entrance token. Yields steady Micro-Bond payouts daily.",
        rating: 4.8
      },
      {
        id: "prod-silver",
        name: "Slate High-Yield Node",
        price: 50,
        dailyEarning: 3.5,
        durationDays: 30,
        category: "deposit",
        icon: "⚡",
        description: "Standard node computing key in the Swiss Slate pool. Exceptional risk/reward.",
        rating: 4.9
      },
      {
        id: "prod-gold",
        name: "Emerald VIP Liquidity Pool",
        price: 150,
        dailyEarning: 12.0,
        durationDays: 30,
        category: "vip-plan",
        icon: "📈",
        description: "Escrow-backed investment tier generating premium daily dividends.",
        rating: 4.95
      },
      {
        id: "prod-diamond",
        name: "Cosmic Apex Arbitrage Voucher",
        price: 300,
        dailyEarning: 32.0,
        durationDays: 20,
        category: "vip-plan",
        icon: "💎",
        description: "Our highest yielding VIP license. Leveriges flash loans to produce massive daily payouts.",
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
  const referrer = db.users.find(u => u.referralCode.toUpperCase() === referralCode.toUpperCase());
  if (!referrer) {
    return res.status(400).json({ error: "Registration blocked! The referral code entered is invalid." });
  }

  // Check if double phone
  const existingUser = db.users.find(u => u.phone === phone);
  if (existingUser) {
    return res.status(400).json({ error: "This phone number is already registered inside Aura." });
  }

  // Generate unique referral code for the new user
  const ownRefCode = "AURA-" + Math.floor(1000 + Math.random() * 9000);

  // Default initial sign-up balance
  const newUser: User = {
    phone,
    username,
    referralCode: ownRefCode,
    referredBy: referrer.referralCode,
    balance: 10, // Generous starting balance
    role: 'user',
    createdAt: new Date().toISOString()
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

  // Complete reward updates
  tickUserInvestments(phone);

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

  if (isNaN(parsedAmt) || parsedAmt < 5 || parsedAmt > 300) {
    return res.status(400).json({ error: "Invalid withdrawal amount. Must be between $5 and $300." });
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
      error: `Insufficient balance! To withdraw $${parsedAmt}, your account requires $${totalDeduction.toFixed(2)} (including 18% GST). Current Balance: $${freshUser.balance.toFixed(2)}` 
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
    message: `Withdrawal request submitted! Pending $${totalDeduction.toFixed(2)} authorization.`, 
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

  if (!product) return res.status(400).json({ error: "Selected product node key not found" });

  // Update ticks first
  tickUserInvestments(user.phone);
  const userIndex = db.users.findIndex(u => u.phone === user.phone);
  const freshUser = db.users[userIndex];

  if (freshUser.balance < product.price) {
    return res.status(400).json({ error: `Insufficient funds. Purchase cost is $${product.price}, your current balance is $${freshUser.balance.toFixed(2)}.` });
  }

  // Deduct
  db.users[userIndex].balance -= product.price;

  // Add Investment node
  const userInv: UserInvestment = {
    id: "INV-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
    phone: user.phone,
    productId: product.id,
    productName: product.name,
    price: product.price,
    dailyEarning: product.dailyEarning,
    earnedSoFar: 0,
    durationDays: product.durationDays,
    daysPassed: 0,
    status: 'active',
    createdAt: new Date().toISOString(),
    lastCollectAt: new Date().toISOString()
  };

  db.investments.push(userInv);
  saveDatabase();

  res.json({
    success: true,
    message: `${product.name} customized successfully at $${product.price}! Yielding $${product.dailyEarning.toFixed(2)} active daily returns.`,
    investment: userInv,
    newBalance: db.users[userIndex].balance
  });
});

// Interactive Category Mini-Game: Lucky Wheel Spin
// Costs $2, yields various rewards back to balance!
app.post("/api/mini-game/spin", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const SPIN_COST = 2;

  // Check ticks
  tickUserInvestments(user.phone);
  const userIndex = db.users.findIndex(u => u.phone === user.phone);
  const freshUser = db.users[userIndex];

  if (freshUser.balance < SPIN_COST) {
    return res.status(400).json({ error: `Insufficient funds to spin. The Cosmic Lucky Wheel costs $2.00 per spin. Your Balance: $${freshUser.balance.toFixed(2)}` });
  }

  // Deduct Spin Cost
  db.users[userIndex].balance -= SPIN_COST;

  // Spin yields: 
  // 0.5, 1.0, 2.0 (money back), 5.0 (good), 10.0 (super), 50.0 (grand jackpot!)
  const outcomes = [
    { label: "Consolation Dividend", prize: 0.5, weight: 35 },
    { label: "Stable Yield Refund", prize: 1.0, weight: 30 },
    { label: "Equity Breakeven Reward", prize: 2.0, weight: 20 },
    { label: "Slate Node Energy Voucher", prize: 5.0, weight: 10 },
    { label: "Aura Cosmic Booster Bundle", prize: 10.0, weight: 4 },
    { label: "GRAND APEX JACKPOT", prize: 50.0, weight: 1 }
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

  // Credit prize
  db.users[userIndex].balance += selected.prize;
  saveDatabase();

  res.json({
    success: true,
    outcome: selected.label,
    reward: selected.prize,
    cost: SPIN_COST,
    newBalance: db.users[userIndex].balance,
    message: `Spun! You drew "${selected.label}" and received $${selected.prize.toFixed(2)}.`
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
  deposit.status = 'approved';
  db.users[targetUserIndex].balance += deposit.amount;

  // Add 10% first deposit bonus to Sponsor if referral exists!
  const user = db.users[targetUserIndex];
  if (user.referredBy) {
    const sponsorIndex = db.users.findIndex(u => u.referralCode === user.referredBy);
    if (sponsorIndex !== -1) {
      // credit referral bonus
      const referralBonus = deposit.amount * 0.10;
      db.users[sponsorIndex].balance += referralBonus;
      console.log(`Referral commission of $${referralBonus} paid to Sponsor: ${db.users[sponsorIndex].phone}`);
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

// Get general news list
app.get("/api/news", (req, res) => {
  res.json({ news: db.news });
});


// Serve static frontend and start listening
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind to Port and Host
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Aura Engine running perfectly at http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
