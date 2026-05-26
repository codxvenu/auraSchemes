import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import { 
  User, 
  InvestmentProduct, 
  UserInvestment, 
  DepositRequest, 
  WithdrawalRequest, 
  AdminSettings, 
  ForumNews 
} from "../src/types";

export interface DatabaseSchema {
  users: User[];
  passwords: Record<string, string>; // phone -> password
  products: InvestmentProduct[];
  investments: UserInvestment[];
  deposits: DepositRequest[];
  withdrawals: WithdrawalRequest[];
  adminSettings: AdminSettings;
  news: ForumNews[];
}

const DB_FILE = path.join(process.cwd(), "aura_db.json");

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
      trc: "TY9H2jKw87hsdKKjsdf8892hhKasdk",
      bep: "TY9H2jKw87hsdKKjsdf8892hhKasdk",
      binance: "TY9H2jKw87hsdKKjsdf8892hhKasdk",
      instructions: "Transfer the amount via USDT (TRC20) or your Local Bank Account. Enter your exact Transaction Hash/TXID or Transfer reference below. The Admin will review and credit your balance within 10 minutes."
    }
  },
  news: []
};

// Seeding Default database rows
function seedDatabase() {
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

  const adminExists = db.users.some(u => u.role === "admin");
  if (!adminExists) {
    const adminUser: User = {
      phone: "+964111111111",
      username: "Aura CEO",
      referralCode: "AURA",
      referredBy: undefined,
      balance: 10000,
      role: 'admin',
      createdAt: new Date().toISOString(),
      spins: 1
    };
    db.users.push(adminUser);
    db.passwords["+1111111111"] = "admin";
  }
}

// MySQL connection pool holder
let pool: mysql.Pool | null = null;
const isMySqlConfigured = true;

if (isMySqlConfigured) {
  const host = "localhost";
  const user = "herox";
  const password = "13!Waheguru!13";
  const database = "herox";
  const port = Number(process.env.DB_PORT) || 3306;

  console.log(`Configuring MySQL database connection: host=${host}:${port}, user=${user}, db=${database}`);
  pool = mysql.createPool({
    host,
    user,
    password,
    database,
    port,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
}

// Helper to sanitize database schema setups in MySQL database
async function setupMySQLTables() {
  if (!pool) return;
  const conn = await pool.getConnection();
  try {
    console.log("Setting up database tables in MySQL...");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        phone VARCHAR(30) PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        referralCode VARCHAR(50) UNIQUE NOT NULL,
        referredBy VARCHAR(50),
        balance DECIMAL(15,2) DEFAULT 0.00,
        role VARCHAR(20) DEFAULT 'user',
        createdAt VARCHAR(50) NOT NULL,
        spins INT DEFAULT 1,
        password VARCHAR(255) NOT NULL
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        image TEXT,
        price DECIMAL(15,2) NOT NULL,
        dailyIncome DECIMAL(15,2) NOT NULL,
        dailyEarning DECIMAL(15,2) NOT NULL,
        durationDays INT NOT NULL,
        totalIncome DECIMAL(15,2) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'active',
        createdAt VARCHAR(50),
        category VARCHAR(50),
        icon VARCHAR(20),
        rating DECIMAL(3,2),
        purchaseLimit INT
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS investments (
        id VARCHAR(50) PRIMARY KEY,
        phone VARCHAR(30) NOT NULL,
        productId VARCHAR(50) NOT NULL,
        productName VARCHAR(100) NOT NULL,
        price DECIMAL(15,2) NOT NULL,
        dailyEarning DECIMAL(15,2) NOT NULL,
        earnedSoFar DECIMAL(15,2) DEFAULT 0.00,
        durationDays INT NOT NULL,
        daysPassed INT DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active',
        createdAt VARCHAR(50) NOT NULL,
        lastCollectAt VARCHAR(50) NOT NULL
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS deposits (
        id VARCHAR(50) PRIMARY KEY,
        phone VARCHAR(30) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        method VARCHAR(50) NOT NULL,
        txid VARCHAR(255) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        adminReason TEXT,
        screenshot LONGTEXT,
        createdAt VARCHAR(50) NOT NULL
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS withdrawals (
        id VARCHAR(50) PRIMARY KEY,
        phone VARCHAR(30) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        deductedAmount DECIMAL(15,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        adminReason TEXT,
        paymentDetails TEXT NOT NULL,
        createdAt VARCHAR(50) NOT NULL
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS news (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        date VARCHAR(50) NOT NULL,
        author VARCHAR(100) NOT NULL
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS admin_settings (
        id INT PRIMARY KEY DEFAULT 1,
        bankName VARCHAR(100),
        accountNumber VARCHAR(100),
        accountName VARCHAR(100),
        trc VARCHAR(255),
        bep VARCHAR(255),
        binance VARCHAR(255),
        instructions TEXT
      )
    `);

    console.log("SQL Tables validated successfully inside MySQL server!");
  } catch (err) {
    console.error("Critical error setting up tables in MySQL:", err);
  } finally {
    conn.release();
  }
}

// Fetch all elements from tables and write to current local db
export async function syncFromMySQL() {
  if (!pool) return;
  try {
    const [usersRows] = await pool.query("SELECT * FROM users") as any[];
    const [productsRows] = await pool.query("SELECT * FROM products") as any[];
    const [investmentsRows] = await pool.query("SELECT * FROM investments") as any[];
    const [depositsRows] = await pool.query("SELECT * FROM deposits") as any[];
    const [withdrawalsRows] = await pool.query("SELECT * FROM withdrawals") as any[];
    const [newsRows] = await pool.query("SELECT * FROM news") as any[];
    const [settingsRows] = await pool.query("SELECT * FROM admin_settings WHERE id = 1") as any[];

    // Map MySQL rows back to TypeScript DatabaseSchema
    db.users = usersRows.map((r: any) => ({
      phone: r.phone,
      username: r.username,
      referralCode: r.referralCode,
      referredBy: r.referredBy || undefined,
      balance: Number(r.balance),
      role: r.role as 'user' | 'admin',
      createdAt: r.createdAt,
      spins: Number(r.spins || 1)
    }));

    db.passwords = {};
    usersRows.forEach((r: any) => {
      db.passwords[r.phone] = r.password;
    });

    db.products = productsRows.map((r: any) => ({
      id: r.id,
      name: r.name,
      image: r.image || "",
      price: Number(r.price),
      dailyIncome: Number(r.dailyIncome),
      dailyEarning: Number(r.dailyEarning),
      durationDays: Number(r.durationDays),
      totalIncome: Number(r.totalIncome),
      description: r.description || "",
      status: r.status as 'active' | 'inactive',
      createdAt: r.createdAt || undefined,
      category: r.category || undefined,
      icon: r.icon || undefined,
      rating: Number(r.rating || 5.0),
      purchaseLimit: r.purchaseLimit || undefined
    }));

    db.investments = investmentsRows.map((r: any) => ({
      id: r.id,
      phone: r.phone,
      productId: r.productId,
      productName: r.productName,
      price: Number(r.price),
      dailyEarning: Number(r.dailyEarning),
      earnedSoFar: Number(r.earnedSoFar),
      durationDays: Number(r.durationDays),
      daysPassed: Number(r.daysPassed),
      status: r.status as 'active' | 'completed' | 'inactive',
      createdAt: r.createdAt,
      lastCollectAt: r.lastCollectAt
    }));

    db.deposits = depositsRows.map((r: any) => ({
      id: r.id,
      phone: r.phone,
      amount: Number(r.amount),
      method: r.method,
      txid: r.txid,
      status: r.status as 'pending' | 'approved' | 'rejected',
      adminReason: r.adminReason || undefined,
      screenshot: r.screenshot || undefined,
      createdAt: r.createdAt
    }));

    db.withdrawals = withdrawalsRows.map((r: any) => ({
      id: r.id,
      phone: r.phone,
      amount: Number(r.amount),
      deductedAmount: Number(r.deductedAmount),
      status: r.status as 'pending' | 'approved' | 'rejected',
      adminReason: r.adminReason || undefined,
      paymentDetails: r.paymentDetails,
      createdAt: r.createdAt
    }));

    db.news = newsRows.map((r: any) => ({
      id: r.id,
      title: r.title,
      content: r.content,
      date: r.date,
      author: r.author
    }));

    if (settingsRows.length > 0) {
      db.adminSettings = {
        paymentDetails: {
          bankName: settingsRows[0].bankName || "",
          accountNumber: settingsRows[0].accountNumber || "",
          accountName: settingsRows[0].accountName || "",
          trc: settingsRows[0].trc || "",
          bep: settingsRows[0].bep || "",
          binance: settingsRows[0].binance || "",
          instructions: settingsRows[0].instructions || ""
        }
      };
    }

    console.log("Synchronized state successfully from MySQL. Users:", db.users.length);
  } catch (err) {
    console.error("Failed synchronizing state from MySQL:", err);
  }
}

// Push all elements to respective tables in MySQL database
export async function syncToMySQL() {
  if (!pool) return;
  try {
    // 1. Save Users & Passwords
    for (const user of db.users) {
      const password = db.passwords[user.phone] || "user";
      await pool.query(`
        INSERT INTO users (phone, username, referralCode, referredBy, balance, role, createdAt, spins, password)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          username = VALUES(username),
          referralCode = VALUES(referralCode),
          referredBy = VALUES(referredBy),
          balance = VALUES(balance),
          role = VALUES(role),
          spins = VALUES(spins),
          password = VALUES(password)
      `, [
        user.phone, user.username, user.referralCode, user.referredBy || null, 
        user.balance, user.role, user.createdAt, user.spins || 1, password
      ]);
    }

    // 2. Save Products
    for (const p of db.products) {
      await pool.query(`
        INSERT INTO products (id, name, image, price, dailyIncome, dailyEarning, durationDays, totalIncome, description, status, createdAt, category, icon, rating, purchaseLimit)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          image = VALUES(image),
          price = VALUES(price),
          dailyIncome = VALUES(dailyIncome),
          dailyEarning = VALUES(dailyEarning),
          durationDays = VALUES(durationDays),
          totalIncome = VALUES(totalIncome),
          description = VALUES(description),
          status = VALUES(status),
          category = VALUES(category),
          icon = VALUES(icon),
          rating = VALUES(rating),
          purchaseLimit = VALUES(purchaseLimit)
      `, [
        p.id, p.name, p.image || null, p.price, p.dailyIncome, p.dailyEarning,
        p.durationDays, p.totalIncome, p.description || null, p.status, 
        p.createdAt || null, p.category || null, p.icon || null, p.rating || null, p.purchaseLimit || null
      ]);
    }

    // 3. Save Investments
    for (const inv of db.investments) {
      await pool.query(`
        INSERT INTO investments (id, phone, productId, productName, price, dailyEarning, earnedSoFar, durationDays, daysPassed, status, createdAt, lastCollectAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          earnedSoFar = VALUES(earnedSoFar),
          daysPassed = VALUES(daysPassed),
          status = VALUES(status),
          lastCollectAt = VALUES(lastCollectAt)
      `, [
        inv.id, inv.phone, inv.productId, inv.productName, inv.price, inv.dailyEarning,
        inv.earnedSoFar, inv.durationDays, inv.daysPassed, inv.status, inv.createdAt, inv.lastCollectAt
      ]);
    }

    // 4. Save Deposits
    for (const dep of db.deposits) {
      await pool.query(`
        INSERT INTO deposits (id, phone, amount, method, txid, status, adminReason, screenshot, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          status = VALUES(status),
          adminReason = VALUES(adminReason),
          screenshot = VALUES(screenshot)
      `, [
        dep.id, dep.phone, dep.amount, dep.method, dep.txid, dep.status, dep.adminReason || null, dep.screenshot || null, dep.createdAt
      ]);
    }

    // 5. Save Withdrawals
    for (const w of db.withdrawals) {
      await pool.query(`
        INSERT INTO withdrawals (id, phone, amount, deductedAmount, status, adminReason, paymentDetails, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          status = VALUES(status),
          adminReason = VALUES(adminReason)
      `, [
        w.id, w.phone, w.amount, w.deductedAmount, w.status, w.adminReason || null, JSON.stringify(w.paymentDetails), w.createdAt
      ]);
    }

    // 6. Save News
    for (const n of db.news) {
      await pool.query(`
        INSERT INTO news (id, title, content, date, author)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          title = VALUES(title),
          content = VALUES(content),
          date = VALUES(date),
          author = VALUES(author)
      `, [
        n.id, n.title, n.content, n.date, n.author
      ]);
    }

    // 7. Save Admin Settings
    const s = db.adminSettings.paymentDetails;
    await pool.query(`
      INSERT INTO admin_settings (id, bankName, accountNumber, accountName, trc, bep, binance, instructions)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        bankName = VALUES(bankName),
        accountNumber = VALUES(accountNumber),
        accountName = VALUES(accountName),
        trc = VALUES(trc),
        bep = VALUES(bep),
        binance = VALUES(binance),
        instructions = VALUES(instructions)
    `, [
      s.bankName, s.accountNumber, s.accountName, s.trc, s.bep, s.binance, s.instructions
    ]);

  } catch (err) {
    console.error("Failed flushing memory states to MySQL tables:", err);
  }
}

// Global initialized database loader
export async function initializeDatabase() {
  try {
    if (pool) {
      await setupMySQLTables();
      await syncFromMySQL();
      seedDatabase();
      await syncToMySQL();
      console.log("Successfully connected to VPS MySQL database & synchronized tables!");
    } else {
      // Use local file system persistence fallback (perfect for preview builds & Sandbox)
      if (fs.existsSync(DB_FILE)) {
        const data = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(data);
        db = { ...db, ...parsed };
        console.log("Local JSON database active with", db.users.length, "users.");
      } else {
        console.log("Local JSON database file missing. Creating fresh seeds.");
      }
      seedDatabase();
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
    }
  } catch (err) {
    console.error("Failed initializer checklist setup:", err);
    seedDatabase();
  }
}

// Write down state modifications
export async function persistDatabase() {
  try {
    if (pool) {
      await syncToMySQL();
    } else {
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
    }
  } catch (err) {
    console.error("Failed write checklist updates:", err);
  }
}

// Export references to in-memory tables directly so we don't need to overwrite any REST logic in /api/index.ts
export { db };
