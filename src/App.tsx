import React, { useState, useEffect } from "react";
import { auraApi, formatCurrency, formatDate } from "./api";
import { User, InvestmentProduct, UserInvestment, DepositRequest, WithdrawalRequest, ForumNews } from "./types";
import PhoneAuth from "./components/PhoneAuth";
import Navbar from "./components/Navbar";
import { 
  PlusCircle, 
  MinusCircle, 
  RefreshCw, 
  Share2, 
  Copy, 
  Check, 
  TrendingUp, 
  Award, 
  ChevronRight, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Compass, 
  Clock, 
  Coins, 
  Users, 
  ShieldCheck, 
  ShieldAlert,
  ExternalLink,
  ChevronDown,
  HelpCircle,
  HelpCircle as QuestionIcon,
  MessageCircle,
  Send,
  X
} from "lucide-react";

const SECTORS = [
  { backendLabel: "5000 IDR Prize Value", label: "5,000 IQD", icon: "💵", color: "#10b981", rgb: "16, 185, 129" },
  { backendLabel: "10000 IDR grand Prize", label: "10,000 IQD", icon: "💰", color: "#f59e0b", rgb: "245, 158, 11" },
  { backendLabel: "Iphone 17", label: "iPhone 17", icon: "📱", color: "#3b82f6", rgb: "59, 130, 246" },
  { backendLabel: "600k IDR", label: "600k IQD", icon: "💸", color: "#ec4899", rgb: "236, 72, 153" },
  { backendLabel: "Playstation", label: "Playstation", icon: "🎮", color: "#8b5cf6", rgb: "139, 92, 246" },
  { backendLabel: "Better luck next time", label: "Better Luck", icon: "✨", color: "#06b6d4", rgb: "6, 182, 212" },
  { backendLabel: "AC", label: "Air Cond.", icon: "💨", color: "#6b7280", rgb: "107, 114, 128" }
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("aura_token") || sessionStorage.getItem("aura_token"));
  const [activeTab, setActiveTab] = useState<string>("marketplace"); // marketplace, financials, news, settings, admin
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Categories states
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Core list states
  const [products, setProducts] = useState<InvestmentProduct[]>([]);
  const [userInvestments, setUserInvestments] = useState<UserInvestment[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [news, setNews] = useState<ForumNews[]>([]);
  const [adminSettings, setAdminSettings] = useState<any>(null);

  // Financial inputs
  const [financialSubTab, setFinancialSubTab] = useState<"deposit" | "withdraw">("deposit");
  const [depositAmount, setDepositAmount] = useState<string>("5000");
  const [depositTxid, setDepositTxid] = useState<string>("");
  const [depositMethod, setDepositMethod] = useState<string>("USDT (TRC20)");
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("5000");
  const [withdrawalPaymentDetails, setWithdrawalPaymentDetails] = useState<string>("");

  // Rejection notification modal/popup
  const [rejectionBox, setRejectionBox] = useState<{ type: 'deposit' | 'withdrawal'; amount: number; reason: string } | null>(null);

  // Account Settings update inputs
  const [newUsername, setNewUsername] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Admin Dashboard Management Lists
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [adminDeposits, setAdminDeposits] = useState<DepositRequest[]>([]);
  const [adminWithdrawals, setAdminWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [adminInvestments, setAdminInvestments] = useState<UserInvestment[]>([]);
  const [adminRejectionReason, setAdminRejectionReason] = useState<string>("");
  const [adminSelectedReqId, setAdminSelectedReqId] = useState<string | null>(null);
  const [adminSelectedType, setAdminSelectedType] = useState<'deposit' | 'withdrawal' | null>(null);
  
  // Custom interactive systems
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showNoticeModal, setShowNoticeModal] = useState<boolean>(() => {
    return !sessionStorage.getItem("aura_notice_shown");
  });
  const closeNoticeModal = () => {
    setShowNoticeModal(false);
    sessionStorage.setItem("aura_notice_shown", "true");
  };
  const [selectedProductDetail, setSelectedProductDetail] = useState<InvestmentProduct | null>(null);
  const [spinResult, setSpinResult] = useState<{ outcome: string; prize: number } | null>(null);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [wheelDegree, setWheelDegree] = useState<number>(0);
  const [spinError, setSpinError] = useState<string | null>(null);

  // Notification Banner triggers
  const [globalBannerMessage, setGlobalBannerMessage] = useState<string | null>(
    "AURA ALERT: Real-time node computations are active. Simulated Day cycle is set to 45 seconds for testing purposes."
  );

  // Categories definitions
  const categories = [
    { id: "all", label: "Marketplace", icon: "🛒", description: "Licensed computing keys" },
    { id: "active-bonds", label: "Active Nodes", icon: "⚡", description: "Your active computation nodes" },
    { id: "lucky-wheel", label: "Lucky Wheel", icon: "🎡", description: "Spin and earn dividends" },
    { id: "deposit", label: "Deposit", icon: "💰", description: "Credit your account with bank or cryptos" },
    { id: "cash-out", label: "Cash Out", icon: "💸", description: "Withdraw instantly with minimal fees" },
    { id: "vip-plan", label: "VIP Plan", icon: "👑", description: "Premium customized asset pools" },
    { id: "global-news", label: "Global News", icon: "📰", description: "Latest company news bulletins" },
    { id: "company-info", label: "Company Info", icon: "🏢", description: "Aura Escrow credentials and reserves" },
    { id: "invitation", label: "Invitation", icon: "🤝", description: "Aura affiliate program link builder" },
    { id: "account-settings", label: "Account Settings", icon: "⚙️", description: "Adjust keys and credential nicknames" }
  ];

  // Try auto-loading profile on boot
  useEffect(() => {
    async function loadMe() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await auraApi.getMe();
        setUser(res.user);
        await updateUserData();
      } catch (err) {
        console.error("Token invalid or expired. Resetting.", err);
        localStorage.removeItem("aura_token");
        sessionStorage.removeItem("aura_token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadMe();
  }, [token]);

  // Periodic user profile & state synchronization to capture real-time passive mining rewards instantly (every 4 seconds)
  useEffect(() => {
    let interval: any = null;
    if (user && token) {
      interval = setInterval(async () => {
        try {
          const res = await auraApi.getMe();
          setUser(res.user);
          
          // Fast-refresh my active nodes to visualize ticks growing
          const invData = await auraApi.getMyInvestments();
          setUserInvestments(invData.investments);
        } catch (err: any) {
          console.error("Failed to background sync ticks", err);
          if (err?.message && (err.message.includes("Unauthorized") || err.message.includes("login") || err.message.includes("expired") || err.message.includes("token"))) {
            localStorage.removeItem("aura_token");
            sessionStorage.removeItem("aura_token");
            setToken(null);
            setUser(null);
            setActiveTab("marketplace");
            setActiveCategory("all");
            setSpinResult(null);
          }
        }
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [user, token]);

  // Handle successful login/registration
  const handleAuthSuccess = (authenticatedUser: User, sessionToken: string) => {
    setUser(authenticatedUser);
    setToken(sessionToken);
    if (!sessionStorage.getItem("aura_token")) {
      localStorage.setItem("aura_token", sessionToken);
    }
    const noticeShown = sessionStorage.getItem("aura_notice_shown");
    setShowNoticeModal(!noticeShown);
    updateUserData();
  };

  const handleLogout = () => {
    localStorage.removeItem("aura_token");
    sessionStorage.removeItem("aura_token");
    setToken(null);
    setUser(null);
    setActiveTab("marketplace");
    setActiveCategory("all");
    setSpinResult(null);
    setShowNoticeModal(true);
  };

  // Main UI Data Syncer
  const updateUserData = async () => {
    if (!token) return;
    try {
      // 1. Fetch products selection
      const prodRes = await auraApi.getProducts();
      setProducts(prodRes.products);

      // 2. Fetch my investment bonds
      const invRes = await auraApi.getMyInvestments();
      setUserInvestments(invRes.investments);

      // 3. Fetch deposits and withdrawals
      const transRes = await auraApi.getMyTransactions();
      setDeposits(transRes.deposits);
      setWithdrawals(transRes.withdrawals);

      // Check if any deposit or withdrawal was newly rejected since last view to trigger Rejection Reason Dialog
      const newlyRejectedDeposit = transRes.deposits.find(d => d.status === 'rejected');
      const newlyRejectedWithdrawal = transRes.withdrawals.find(w => w.status === 'rejected');
      
      if (newlyRejectedDeposit && !localStorage.getItem(`dismiss_dep_${newlyRejectedDeposit.id}`)) {
        setRejectionBox({
          type: 'deposit',
          amount: newlyRejectedDeposit.amount,
          reason: newlyRejectedDeposit.adminReason || "No audit details supplied by compliance."
        });
        localStorage.setItem(`dismiss_dep_${newlyRejectedDeposit.id}`, "true");
      } else if (newlyRejectedWithdrawal && !localStorage.getItem(`dismiss_with_${newlyRejectedWithdrawal.id}`)) {
        setRejectionBox({
          type: 'withdrawal',
          amount: newlyRejectedWithdrawal.amount,
          reason: newlyRejectedWithdrawal.adminReason || "Compliance audit: Insufficient verifiable volume or reference mismatch."
        });
        localStorage.setItem(`dismiss_with_${newlyRejectedWithdrawal.id}`, "true");
      }

      // 4. Fetch admin financial context instructions
      const settingsRes = await auraApi.getFinancialSettings();
      setAdminSettings(settingsRes.adminSettings);

      // 5. Fetch global bulletins news
      const newsRes = await auraApi.getNews();
      setNews(newsRes.news);

      // 6. If Admin, pull global metrics logs
      if (user && user.role === 'admin') {
        const adminData = await auraApi.getAdminMetrics();
        setAdminUsers(adminData.users);
        setAdminDeposits(adminData.deposits);
        setAdminWithdrawals(adminData.withdrawals);
        setAdminInvestments(adminData.investments);
      }
    } catch (err: any) {
      console.error("Error synchronizing Aura terminal states:", err);
      if (err?.message && (err.message.includes("Unauthorized") || err.message.includes("login") || err.message.includes("expired") || err.message.includes("token"))) {
        localStorage.removeItem("aura_token");
        sessionStorage.removeItem("aura_token");
        setToken(null);
        setUser(null);
        setActiveTab("marketplace");
        setActiveCategory("all");
        setSpinResult(null);
      }
    }
  };

  // CATEGORY ACTIONS CLICK ROUTINGS
  const handleCategoryClick = (catId: string) => {
    setActiveCategory(catId);
    
    // Smoothly routes navigation focus based on interactive selection
    if (catId === "all") {
      setActiveTab("marketplace");
    } else if (catId === "active-bonds") {
      setActiveTab("marketplace");
    } else if (catId === "lucky-wheel") {
      setActiveTab("marketplace");
    } else if (catId === "cash-out") {
      setActiveTab("financials");
      setFinancialSubTab("withdraw");
    } else if (catId === "deposit") {
      setActiveTab("financials");
      setFinancialSubTab("deposit");
    } else if (catId === "global-news") {
      setActiveTab("news");
    } else if (catId === "company-info") {
      setActiveTab("companynews");
    } else if (catId === "invitation") {
      setActiveTab("invitation");
    } else if (catId === "account-settings") {
      setActiveTab("settings");
      setNewUsername(user?.username || "");
    } else if (catId === "invitation") {
      setActiveTab("settings");
      setTimeout(() => {
        document.getElementById("referral-affiliate-section")?.scrollIntoView({ behavior: "smooth" });
      }, 200);
    } else if (catId === "company-info") {
      setActiveTab("news");
      setTimeout(() => {
        document.getElementById("company-info-bulletin")?.scrollIntoView({ behavior: "smooth" });
      }, 200);
    } else if (catId === "vip-plan") {
      setActiveTab("marketplace");
    }
  };

  // INTERACTIVE LUCKY WHEEL SPIN ACTION
  const handleSpinLuckyWheel = async () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setSpinError(null);
    setSpinResult(null);

    try {
      const res = await auraApi.spinLuckyWheel();
      
      const targetSectorIndex = SECTORS.findIndex(s => s.backendLabel === res.outcome);
      const safeTargetIndex = targetSectorIndex !== -1 ? targetSectorIndex : 0;
      
      const sliceAngle = 360 / 7;
      const finalAngleOfSector = (safeTargetIndex * sliceAngle) + (sliceAngle / 2);
      const additionalRotations = 2160; // 6 full rotational spins for maximum dramatic effect
      const offsetWithinSector = (Math.random() - 0.5) * (sliceAngle * 0.45); // Safe natural padding representation
      
      // Calculate target stopping angle (ensuring top position corresponds to 270 degrees)
      const targetRotationAngle = wheelDegree + additionalRotations + (270 - finalAngleOfSector) + offsetWithinSector;
      setWheelDegree(targetRotationAngle);

      // Match transition duration precisely (4.2 seconds) to allow stopping animation physics to fully complete
      setTimeout(async () => {
        setIsSpinning(false);
        setSpinResult({
          outcome: SECTORS[safeTargetIndex].label, // Keep matching labeled currency or physical gadget
          prize: res.reward
        });
        setUser(prev => prev ? { ...prev, balance: res.newBalance } : null);
        await updateUserData();
      }, 4200);

    } catch (err: any) {
      setIsSpinning(false);
      setSpinError(err.message || "Lucky spin failed. Verify available balance.");
    }
  };

  // SUBMIT DEPOSIT COMPLETED DETAILS BACKEND
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setProfileSuccess(null);
    setProfileError(null);

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < 5000 || amount > 30000) {
      setProfileError("Deposit amount must reside strictly between 5,000 IQD and 30,000 IQD.");
      setActionLoading(false);
      setTimeout(() => {
        setProfileError(null);
      }, 5000);
      return;
    }

    if (!depositTxid.trim()) {
      setProfileError("A valid reference Transaction ID (TXID) is mandatory to initiate audits.");
      setActionLoading(false);
      setTimeout(() => {
        setProfileError(null);
      }, 5000);
      return;
    }

    try {
      const res = await auraApi.submitDeposit(amount, depositMethod, depositTxid, screenshotPreview || undefined);
      if (res.success) {
        setProfileSuccess(`Deposit reference submitted! Code: ${res.deposit.id}. Standard audit takes 10 minutes.`);
        setDepositTxid("");
        setScreenshotPreview(null);
        await updateUserData();
      }
    } catch (err: any) {
      setProfileError(err.message || "Failed to initiate deposit request.");
      setTimeout(() => {
        setProfileError(null);
      }, 5000);
    } finally {
      setActionLoading(false);
    }
  };

  // SUBMIT WITHDRAW SUBMITTED TRANSACTION DETAILS 
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setProfileSuccess(null);
    setProfileError(null);

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 5000) {
      setProfileError("Withdrawal amount must be at least 5,000 IQD.");
      setActionLoading(false);
      return;
    }

    // Protection rule - must have at least one active device (product node) inside portfolio
    const activeDevicesCount = userInvestments.filter(inv => inv.status === 'active').length;
    if (activeDevicesCount === 0) {
      setProfileError("To protect the rights and interests of the platform and users, you must have at least one device to activate the withdrawal feature.");
      setActionLoading(false);
      return;
    }

    if (!withdrawalPaymentDetails.trim()) {
      setProfileError("Receiving address details are strictly required to execute transfers.");
      setActionLoading(false);
      return;
    }

    try {
      const res = await auraApi.submitWithdraw(amount, withdrawalPaymentDetails);
      if (res.success) {
        setProfileSuccess(`Withdrawal successfully queued! Authorized with ID: ${res.withdrawal.id}.`);
        setWithdrawalPaymentDetails("");
        await updateUserData();
      }
    } catch (err: any) {
      setProfileError(err.message || "Insufficient balance or invalid credential constraints.");
    } finally {
      setActionLoading(false);
    }
  };

  // PURCHASE KEY-BOND UNIT (INVEST)
  const handlePurchaseNode = async (productId: string) => {
    setActionLoading(true);
    setProfileSuccess(null);
    setProfileError(null);

    try {
      const res = await auraApi.investProduct(productId);
      if (res.success) {
        setProfileSuccess(res.message);
        // update memory states directly
        setUser(prev => prev ? { ...prev, balance: res.newBalance } : null);
        await updateUserData();
      }
    } catch (err: any) {
      setProfileError(err.message || "Balance insufficient or node key unavailable.");
    } finally {
      setActionLoading(false);
    }
  };

  // PROFILE CHANGES
  const handleProfileUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setProfileSuccess(null);
    setProfileError(null);

    try {
      const res = await auraApi.updateProfile(newUsername, newPassword || undefined);
      if (res.success) {
        setProfileSuccess("Member details updated successfully in secure database.");
        setUser(res.user);
        setNewPassword("");
        await updateUserData();
      }
    } catch (err: any) {
      setProfileError(err.message || "Error updating credentials.");
    } finally {
      setActionLoading(false);
    }
  };

  // --- ADMIN DESK ACTIONS ---
  const handleApproveDeposit = async (id: string) => {
    try {
      const res = await auraApi.approveDeposit(id);
      alert(res.message);
      await updateUserData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleRejectDeposit = async (id: string) => {
    if (!adminRejectionReason.trim()) {
      alert("You must provide an audit reason first before rejecting.");
      return;
    }
    try {
      const res = await auraApi.rejectDeposit(id, adminRejectionReason);
      alert("Deposit request rejected.");
      setAdminRejectionReason("");
      setAdminSelectedReqId(null);
      setAdminSelectedType(null);
      await updateUserData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleApproveWithdrawal = async (id: string) => {
    try {
      const res = await auraApi.approveWithdrawal(id);
      alert(res.message);
      await updateUserData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleRejectWithdrawal = async (id: string) => {
    if (!adminRejectionReason.trim()) {
      alert("You must provide an audit reason first before rejecting.");
      return;
    }
    try {
      const res = await auraApi.rejectWithdrawal(id, adminRejectionReason);
      alert("Withdrawal request rejected.");
      setAdminRejectionReason("");
      setAdminSelectedReqId(null);
      setAdminSelectedType(null);
      await updateUserData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleAdminSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const form = e.currentTarget as HTMLFormElement;
      const data = new FormData(form);
      const payload = {
        bankName: data.get("bankName") as string,
        accountNumber: data.get("accountNumber") as string,
        accountName: data.get("accountName") as string,
        usdtAddress: data.get("usdtAddress") as string,
        instructions: data.get("instructions") as string,
      };
      await auraApi.updateAdminSettings(payload);
      alert("Deposit credentials updated successfully.");
      await updateUserData();
    } catch (err: any) {
      alert("Settings error: " + err.message);
    }
  };

  const handleAdminAdjustBalance = async (phone: string, currentBal: number) => {
    const val = prompt(`Enter new balance value for user ${phone} (in $):`, currentBal.toString());
    if (val === null) return;
    const parsed = parseFloat(val);
    if (isNaN(parsed)) {
      alert("Invalid balance format.");
      return;
    }
    try {
      await auraApi.adminAdjustBalance(phone, parsed);
      alert("Balance adjusted.");
      await updateUserData();
    } catch (err: any) {
      alert("Adjustment failed: " + err.message);
    }
  };

  // Copy referral affiliate code
  const copyReferralLink = () => {
    if (!user) return;
    const link = `${window.location.origin}/?ref=${user.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0c0c0e]">
        <div className="p-8 text-center">
          <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-mono tracking-widest text-zinc-400">INITIALIZING SECURE TERMINAL...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, load the direct phone auth landing page
  if (!user) {
    return (
      <div className="bg-[#0c0c0e] min-h-screen font-sans">
        <PhoneAuth onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  // FILTERED PRODUCTS
  const filteredProducts = activeCategory === "all" 
    ? products 
    : products.filter(p => p.category === activeCategory);

  return (
    <div className="bg-[#0c0c0e] min-h-screen pb-3 font-sans text-zinc-300 antialiased selection:bg-zinc-800 selection:text-white">
      
      {/* GLOBAL NOTIFICATION BANNER */}
      {globalBannerMessage && (
        <div id="global-broadcast-banner" className="bg-zinc-950 border-b border-zinc-900 text-zinc-400 py-2.5 px-4 text-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
              {/* <span className="flex-shrink-0 inline-flex items-center justify-center w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> */}
              <span className="font-mono text-emerald-400 text-[10px] bg-emerald-950/40 border border-emerald-900/60 px-1.5 py-0.5 rounded uppercase">LIVE BROADCAST</span>
              <span className="truncate">{globalBannerMessage}</span>
            </div>
            <button 
              onClick={() => setGlobalBannerMessage(null)}
              className="text-zinc-500 hover:text-white text-xs font-mono lowercase pl-2 cursor-pointer border-l border-zinc-800"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* STICKY LUXURY NAVIGATION */}
      <Navbar 
        user={user} 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === "marketplace") {
            setActiveCategory("all");
          }
          setProfileSuccess(null);
          setProfileError(null);
        }} 
        onLogout={handleLogout} 
      />

      {/* CORE WRAPPER */}
      <div id="main-content-canvas" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* REJECTION MESSAGE ALERT POPUP (Crucial requirement fulfilled gracefully with a high context modal) */}
        {rejectionBox && (
          <div id="rejection-reason-dialog" className="mb-6 bg-rose-950/45 border-2 border-rose-900/70 p-5 rounded-[1.25rem] text-rose-300 font-sans shadow-xl relative animate-fade-in">
            <button 
              onClick={() => setRejectionBox(null)}
              className="absolute top-4 right-4 text-rose-400 hover:text-white bg-rose-950/60 w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs cursor-pointer"
            >
              ✕
            </button>
            <div className="flex items-start gap-4">
              <XCircle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold tracking-tight text-white mb-1 uppercase font-display">AURA COMPLIANCE AUDIT AUDITING NOTICE</h4>
                <p className="text-xs text-rose-200/90 leading-relaxed mb-3">
                  Your recent transaction of <span className="font-mono font-semibold underline text-white">{formatCurrency(rejectionBox.amount)}</span> has been rejected by compliance administration under verification protocols.
                </p>
                <div className="bg-zinc-950/60 border border-rose-900/40 p-3 rounded-lg text-xs font-mono text-rose-200">
                  <span className="text-rose-400 font-bold block mb-1">Reason code given:</span>
                  "{rejectionBox.reason}"
                </div>
                <p className="text-[10px] text-zinc-500 mt-2">
                  Please adjust transfer metrics, check instruction parameters, and submit an authoritative ticket to resume liquidity processing.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PROFILE SUCCESS/ERROR FEEDBACK */}
        {(profileSuccess || profileError) && (
          <div className="mb-6">
            {profileSuccess && (
              <div className="p-4 bg-emerald-950/40 border border-emerald-900/80 rounded-xl text-xs text-emerald-300 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p className="font-sans font-medium">{profileSuccess}</p>
              </div>
            )}
            {profileError && (
              <div className="p-4 bg-rose-950/40 border border-rose-900/80 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <p className="font-sans font-medium">{profileError}</p>
              </div>
            )}
          </div>
        )}

        {/* CATEGORIES HORIZONTAL CAROUSEL */}
        <div className="mb-6">
          
          {/* HORIZONTAL CAROUSEL LIST */}
          <div className="flex gap-3 overflow-x-auto pb-3Scrollbar select-none scroll-smooth">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`flex-shrink-0 flex items-center gap-3 px-4 py-3 border rounded-[1rem] text-left transition-all cursor-pointer group min-w-[150px] ${
                  activeCategory === cat.id 
                    ? "bg-white text-zinc-950 border-white shadow-lg shadow-white/5 font-semibold" 
                    : "bg-zinc-900/35 border-zinc-800/80 text-zinc-300 hover:border-zinc-700/80 hover:bg-zinc-900/60"
                }`}
              >
                <span className="text-xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                <div>
                  <h3 className="text-xs font-semibold tracking-tight">{cat.label}</h3>
                  <p className={`text-[9px] truncate max-w-[100px] ${activeCategory === cat.id ? "text-zinc-500" : "text-zinc-500"}`}>
                    {cat.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

         {/* -------------------- TAB 1: MARKETPLACE -------------------- */}
        {activeTab === "marketplace" && (
          <div className="space-y-6">

            {/* INTERACTIVE LUCKY WHEEL COMPONENT SECTION */}
            {activeCategory === "lucky-wheel" && (
              <div id="lucky-wheel-widget" className="bg-zinc-900/40 border border-zinc-800/80 rounded-[1.25rem] p-6 backdrop-blur-md animate-fade-in">
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="flex-1 space-y-2">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 block font-bold">🎡 CATEGORY LUNCH: ACTIVE GAME</span>
                    <h3 className="text-lg font-bold tracking-tight font-display text-white">Cosmic Lucky Dividend Wheel</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Test your yield luck! Spinning costs <span className="font-mono text-white">$2.00</span> deducted from your capital pool. Stand a chance to draw any of our premium physical gadgets or raw currency packets, calculated live by secure Aura backend protocols.
                    </p>
                    
                    <div className="pt-3 flex flex-wrap gap-2">
                      <span className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-[10px] font-mono text-emerald-400 font-semibold">5000 IDR (90% win)</span>
                      <span className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-[10px] font-mono text-amber-500 font-semibold">10000 IDR (5% win)</span>
                      <span className="px-2.5 py-1 bg-zinc-950 border border-zinc-850 rounded-lg text-[10px] font-mono text-blue-400 font-semibold">Iphone 17 (1% win)</span>
                      <span className="px-2.5 py-1 bg-zinc-950 border border-zinc-850 rounded-lg text-[10px] font-mono text-pink-400 font-semibold">600k IDR (1% win)</span>
                      <span className="px-2.5 py-1 bg-zinc-950 border border-zinc-850 rounded-lg text-[10px] font-mono text-violet-400 font-semibold">Playstation (1% win)</span>
                      {/* <span className="px-2.5 py-1 bg-zinc-950 border border-zinc-850 rounded-lg text-[10px] font-mono text-cyan-400 font-semibold">Better luck next time (1% win)</span> */}
                      <span className="px-2.5 py-1 bg-zinc-950 border border-zinc-850 rounded-lg text-[10px] font-mono text-zinc-400 font-semibold">AC (1% win)</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center shrink-0 w-full md:w-auto">
                    {/* Beautiful Casino Style Physical Wheel */}
                    <div className="relative w-72 h-72 bg-zinc-950 border-4 border-zinc-900 rounded-full flex items-center justify-center shadow-[0_15px_35px_rgba(0,0,0,0.8)] overflow-visible">
                      
                      {/* Real Physical Outer Pointer at 12 o'clock (270 degrees) pointing downwards */}
                      <div className="absolute -top-3.5 z-20 w-8 h-8 flex justify-center items-center pointer-events-none drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]">
                        <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-rose-500 rounded-2xs"></div>
                        {/* Dynamic status light bead on top */}
                        <div className="absolute top-0.5 w-3 h-3 bg-white rounded-full border border-rose-600 animate-ping"></div>
                        <div className="absolute top-0.5 w-3 h-3 bg-white rounded-full border border-rose-600"></div>
                      </div>

                      {/* Rotating Wheel Container wrapper with CSS easing physics */}
                      <div 
                        className="absolute w-full h-full rounded-full overflow-hidden"
                        style={{
                          transform: `rotate(${wheelDegree}deg)`,
                          transition: isSpinning 
                            ? "transform 4.2s cubic-bezier(0.15, 0.88, 0.12, 1)" 
                            : "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)"
                        }}
                      >
                        <svg viewBox="0 0 400 400" className="w-full h-full">
                          <defs>
                            <radialGradient id="goldCenter" cx="50%" cy="50%" r="50%">
                              <stop offset="0%" stopColor="#f59e0b" />
                              <stop offset="60%" stopColor="#d97706" />
                              <stop offset="100%" stopColor="#78350f" />
                            </radialGradient>
                          </defs>

                          {/* Sector pies */}
                          {SECTORS.map((sector, idx) => {
                            const sliceAngle = 360 / 7;
                            const startAngle = idx * sliceAngle;
                            const endAngle = (idx + 1) * sliceAngle;
                            const radius = 196;
                            const cx = 200;
                            const cy = 200;
                            
                            const rad = (deg: number) => (deg * Math.PI) / 180;
                            
                            const x1 = cx + radius * Math.cos(rad(startAngle));
                            const y1 = cy + radius * Math.sin(rad(startAngle));
                            const x2 = cx + radius * Math.cos(rad(endAngle));
                            const y2 = cy + radius * Math.sin(rad(endAngle));
                            
                            const d = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
                            const middleAngle = startAngle + (sliceAngle / 2);

                            return (
                              <g key={`slice-${idx}`}>
                                <path 
                                  d={d} 
                                  fill={sector.color} 
                                  stroke="#09090b" 
                                  strokeWidth="2.5" 
                                  className="transition-opacity hover:opacity-95"
                                />
                                {/* Label and Icon rotated radially outward */}
                                <g transform={`rotate(${middleAngle} 200 200) translate(300, 200) rotate(90)`}>
                                  <text 
                                    textAnchor="middle" 
                                    dominantBaseline="central" 
                                    className="text-2xl filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] select-none"
                                    y="-13"
                                  >
                                    {sector.icon}
                                  </text>
                                  <text 
                                    textAnchor="middle" 
                                    dominantBaseline="central" 
                                    fill="#ffffff" 
                                    className="text-[9px] font-mono tracking-tighter uppercase font-extrabold select-none filter drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.95)]"
                                    y="13"
                                  >
                                    {sector.label}
                                  </text>
                                </g>
                              </g>
                            );
                          })}

                          {/* Las Vegas style pulsing marquee lights along the outer brass rim */}
                          {Array.from({ length: 14 }).map((_, i) => {
                            const angle = i * (360 / 14);
                            const r = 188;
                            const x = 200 + r * Math.cos((angle * Math.PI) / 180);
                            const y = 200 + r * Math.sin((angle * Math.PI) / 180);
                            return (
                              <circle 
                                key={`marquee-${i}`} 
                                cx={x} 
                                cy={y} 
                                r="5.5" 
                                fill="#ffffff" 
                                stroke="#d97706" 
                                strokeWidth="1.5" 
                                className="animate-pulse"
                                style={{ 
                                  animationDuration: '0.8s', 
                                  animationDelay: `${i * 120}ms` 
                                }}
                              />
                            );
                          })}

                          {/* Central gold metallic hub pin */}
                          <circle cx="200" cy="200" r="32" fill="url(#goldCenter)" stroke="#18181b" strokeWidth="4" className="filter drop-shadow-[0_3px_5px_rgba(0,0,0,0.5)]" />
                          <circle cx="200" cy="200" r="14" fill="#09090b" />
                        </svg>
                      </div>

                      {/* Display center chip overlay - remains static inside the central gold circle */}
                      <div className="absolute z-10 bg-[#09090b]/90 border border-zinc-800 w-16 h-16 rounded-full flex flex-col items-center justify-center shadow-inner font-bold font-mono text-[10px] text-zinc-300">
                        <span className="text-[8px] text-zinc-500 uppercase tracking-widest block scale-90 mb-0.5">SPINS</span>
                        <span className="text-emerald-400 text-xs font-extrabold">{user?.spins ?? 0}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleSpinLuckyWheel}
                      disabled={isSpinning || (user?.spins ?? 0) < 1}
                      id="btn-spin-wheel"
                      className="mt-5 px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-xs font-mono font-bold tracking-widest uppercase rounded-xl transition-all shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.4)] active:scale-95 text-center cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                    >
                      {isSpinning ? "🎰 SPINNING..." : `⚡ FREE SPIN NOW (${user?.spins ?? 0} LEFT)`}
                    </button>

                    {spinError && (
                      <p className="text-[10px] text-rose-400 mt-2 font-mono bg-rose-950/20 px-3 py-1.5 border border-rose-900/30 rounded-lg">{spinError}</p>
                    )}

                    {spinResult && (
                      <div className="mt-4 text-center animate-bounce bg-emerald-950/20 border border-emerald-900/30 px-4 py-2 rounded-xl">
                        <span className="block text-[9px] text-zinc-400 uppercase font-mono tracking-widest">Aura Wheel Drew</span>
                        <span className="font-mono text-emerald-400 font-extrabold text-xs">
                          {spinResult.outcome} Received!
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PRODUCTS DIRECTORY SECTION (Satisfying Mobile cols-2 layout constraint with premium non-overlapping borders) */}
            {(activeCategory === "all" || activeCategory === "vip-plan") && (
              <div className="animate-fade-in space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2">
                  <div>
                    <h3 className="text-lg font-bold font-display text-white">High-Yield computing keys marketplace</h3>
                    <p className="text-xs text-zinc-500">
                      Aura licensed virtual nodes. Optimized double-column grid layouts perfectly sized for all screen densities.
                    </p>
                  </div>
                  
                  {/* CATEGORIES PICKER FILTER */}
                  <div className="flex gap-1.5 self-start bg-zinc-950 p-1 rounded-xl border border-zinc-900 shrink-0">
                    <button 
                      onClick={() => setActiveCategory("all")}
                      className={`px-3 py-1 text-[10px] font-mono rounded-lg cursor-pointer ${
                        activeCategory === "all" ? "bg-zinc-800 text-white font-bold" : "text-zinc-500 hover:text-white"
                      }`}
                    >
                      All Keys
                    </button>
                   
                    <button 
                      onClick={() => setActiveCategory("vip-plan")}
                      className={`px-3 py-1 text-[10px] font-mono rounded-lg cursor-pointer ${
                        activeCategory === "vip-plan" ? "bg-zinc-800 text-white font-bold" : "text-zinc-500 hover:text-white"
                      }`}
                    >
                      VIP Plans
                    </button>
                  </div>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="bg-zinc-950 border border-zinc-900/60 rounded-xl p-8 text-center text-zinc-500 font-mono text-xs">
                    No active premium dividend packages found for this filter.
                  </div>
                ) : (
                  /* DOUBLE COLUMN GRID ON MOBILE. Elegant and rich package cards */
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    {filteredProducts.map((prod) => (
                      <div 
                        key={prod.id}
                        onClick={() => setSelectedProductDetail(prod)}
                        className="bg-zinc-900 border border-zinc-805/85 border-zinc-800/80 rounded-[1.25rem] flex flex-col justify-between overflow-hidden p-3 md:p-4 hover:border-zinc-700/80 transition-all shadow-md group relative hover:-translate-y-0.5 cursor-pointer"
                      >
                        <div className="space-y-2.5">
                          {/* Rich Package Image */}
                          <div className="w-full !h-full sm:h-28 md:h-32 bg-zinc-950/40 rounded-xl overflow-hidden relative border border-zinc-950">
                            <img 
                              src={prod.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80"} 
                              alt={prod.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full group-hover:scale-102 transition-transform duration-300"
                            />
                            {prod.status === "inactive" && (
                              <span className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] font-mono font-bold text-red-500 tracking-wider">
                                DISABLED
                              </span>
                            )}
                          </div>

                          <div>
                            <h4 className="text-xs font-bold font-display text-white line-clamp-1 group-hover:text-emerald-400 transition-colors">
                              {prod.name}
                            </h4>
                          </div>
                        </div>

                        {/* Interactive Info Block & ROI metrics */}
                        <div className="mt-3 pt-3 border-t border-zinc-950 space-y-2.5 text-[10px]">
                          <div className="grid grid-cols-2 gap-y-1.5 gap-x-1 font-mono text-[9px] text-zinc-400">
                            <div>
                              <span className="block text-zinc-500 font-sans">Daily Income</span>
                              <span className="text-emerald-400 font-bold">{formatCurrency(prod.dailyIncome || prod.dailyEarning || 0)}</span>
                            </div>
                            <div className="text-right">
                              <span className="block text-zinc-500 font-sans">Total Income</span>
                              <span className="text-cyan-400 font-bold">
                                {formatCurrency(prod.totalIncome || ((prod.dailyIncome || prod.dailyEarning || 0) * prod.durationDays))}
                              </span>
                            </div>
                            <div>
                              <span className="block text-zinc-500 font-sans">Duration</span>
                              <span className="text-zinc-300 font-medium">{prod.durationDays} days</span>
                            </div>
                            <div className="text-right">
                              <span className="block text-zinc-500 font-sans">Price</span>
                              <span className="text-white font-bold">{formatCurrency(prod.price)}</span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProductDetail(prod);
                            }}
                            className="w-full bg-zinc-950 hover:bg-white hover:text-zinc-950 text-white font-semibold text-[9px] md:text-[10px] font-mono py-1.5 rounded-lg border border-zinc-800 transition-all cursor-pointer"
                          >
                            STAKE / DETAILS
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* USER ACTIVE INVESTMENT NODES STATUS SECTION */}
            {activeCategory === "active-bonds" && (
              <div className="bg-zinc-900/50 border border-zinc-900 rounded-[1.5rem] p-5 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-sm font-bold tracking-tight uppercase font-mono text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      your active bond computers ({userInvestments.filter(i => i.status === 'active').length})
                    </h3>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Node payout is simulated. Yield tokens credit directly to your capital balance every 45 seconds (1 demo day).
                    </p>
                  </div>
                  <button
                    onClick={updateUserData}
                    className="p-1.5 bg-zinc-950 hover:bg-zinc-900 rounded-lg text-zinc-500 hover:text-white transition-colors cursor-pointer border border-zinc-850"
                    title="Refresh node calculations"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {userInvestments.length === 0 ? (
                  <div className="bg-zinc-950/40 p-10 border border-zinc-850/60 rounded-xl text-center text-zinc-500 font-mono text-xs">
                    ⚡ Terminal connection online. No bond contracts active on this profile. Purchase a node voucher from the high-yield registry to begin compounding.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {userInvestments.map((inv) => (
                      <div 
                        key={inv.id} 
                        className={`p-3.5 border rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3 font-mono transition-colors ${
                          inv.status === 'active' 
                            ? "bg-zinc-950/80 border-emerald-950 hover:border-emerald-900" 
                            : "bg-zinc-950/20 border-zinc-900 opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                          <div>
                            <span className="text-[11px] font-bold text-white block">{inv.productName}</span>
                            <span className="text-[9px] text-zinc-500 block">Unique Node ID: {inv.id}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto text-[10px]">
                          <div>
                            <span className="block text-zinc-650 text-[9px] font-sans">Purchased For</span>
                            <span className="text-zinc-300 font-semibold">{formatCurrency(inv.price)}</span>
                          </div>
                          
                          <div>
                            <span className="block text-zinc-650 text-[9px] font-sans">Compounding Yield</span>
                            <span className="text-emerald-400 font-semibold">{formatCurrency(inv.dailyEarning)}/day</span>
                          </div>

                          <div>
                            <span className="block text-zinc-650 text-[9px] font-sans">Days Compounded</span>
                            <span className="text-zinc-300">{inv.daysPassed} / {inv.durationDays} days</span>
                          </div>

                          <div>
                            <span className="block text-zinc-650 text-[9px] font-sans">Earned Dividends</span>
                            <span className="text-emerald-400 font-bold">{formatCurrency(inv.earnedSoFar)}</span>
                          </div>
                        </div>

                        <div className="self-end md:self-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase font-bold ${
                            inv.status === 'active' 
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-900" 
                              : "bg-zinc-900 text-zinc-500 border border-zinc-850"
                          }`}>
                            {inv.status === 'active' ? "MINING / ONLINE" : "COMPLETED / RECLAIMED"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* -------------------- TAB 2: FINANCIAL OPERATIONS -------------------- */}
        {activeTab === "financials" && (
          <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
            
            {financialSubTab === "deposit" && (
              <div className="space-y-6">
                {/* COMPONENT: SECURE DEPOSIT MODULE (Admin-controlled finance details) */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-[1.5rem] p-5 space-y-4 shadow-xl">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase block">Capital Refunding Desk</span>
                    <h3 className="text-lg font-bold font-display text-white">Deposit Secure Assets</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Refuel your capital pool balance instantly. Minimum: <span className="font-mono text-white">5,000 IQD</span>, Maximum: <span className="font-mono text-white">30,000 IQD</span>. Review escrow details provided below, make transfer, and submit Transaction Hash details to the audit board.
                    </p>
                  </div>

                  {/* ADMIN SETTINGS BANK DETAILS BOX */}
                  {adminSettings ? (
                    <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl space-y-3 font-sans">
                      <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                        <span className="text-xs font-bold text-zinc-300">Target Crypto USDT (TRC-20)</span>
                        <span className="text-[9px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full font-mono">ONLINE</span>
                      </div>
                      
                      <div className="space-y-1.5 font-mono text-xs">
                        <div>
                          <span className="text-[10px] text-zinc-500 font-sans block">Escrow Wallet Address:</span>
                          <div className="flex gap-2 items-center">
                            <span className="text-[11px] text-white break-all bg-zinc-900/40 p-1.5 rounded">{adminSettings.paymentDetails.usdtAddress}</span>
                            <button 
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(adminSettings.paymentDetails.usdtAddress);
                                alert("USDT Address saved to clipboard.");
                              }}
                              className="p-1.5 bg-zinc-900 hover:bg-zinc-850 font-mono text-xs text-zinc-400 hover:text-white rounded-lg cursor-pointer shrink-0 border border-zinc-800"
                            >
                              Copy
                            </button>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-zinc-900">
                          <span className="text-[10px] text-zinc-500 font-sans block mb-1">Domestic Fiat Route:</span>
                          <div className="space-y-1 text-zinc-300 text-xs">
                            <p><span className="text-zinc-500 font-sans">Bank:</span> {adminSettings.paymentDetails.bankName}</p>
                            <p><span className="text-zinc-500 font-sans">A/C:</span> {adminSettings.paymentDetails.accountNumber}</p>
                            <p><span className="text-zinc-500 font-sans">Name:</span> {adminSettings.paymentDetails.accountName}</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-zinc-900 text-[10px] text-zinc-500 italic bg-zinc-900/20 p-2.5 rounded-lg border border-dashed border-zinc-850">
                        <span className="text-zinc-400 font-sans font-bold block mb-0.5">Compliance Instructions:</span>
                        {adminSettings.paymentDetails.instructions}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-zinc-950 p-4 rounded-xl text-center text-xs font-mono text-zinc-600">
                      Retrieving financial instruction sets...
                    </div>
                  )}

                  {/* ACTION INPUT FORM */}
                  <form onSubmit={handleDepositSubmit} className="space-y-3 font-sans">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-medium text-zinc-500 mb-1">Drawn Amount (IQD)</label>
                        <input 
                          type="number" 
                          required 
                          min="5000" 
                          max="30000"
                          value={depositAmount} 
                          onChange={(e) => setDepositAmount(e.target.value)} 
                          placeholder="5000"
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-zinc-500 mb-1">Transfer Gateway</label>
                        <select
                          value={depositMethod}
                          onChange={(e) => setDepositMethod(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-xs text-white outline-none"
                        >
                          <option value="USDT (TRC20)">USDT (TRC20)</option>
                          <option value="USDT (BEP20)">USDT (BEP20)</option>
                          <option value="Binance ID">Binance ID</option>
                          <option value="Iraq Bank Account">Iraq Bank Account</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-zinc-500 mb-1">Verification TXID / Transfer Reference</label>
                      <input 
                        type="text" 
                        required 
                        value={depositTxid} 
                        onChange={(e) => setDepositTxid(e.target.value)} 
                        placeholder="e.g. TRx827hHksadU7s6vB"
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                      />
                      <p className="text-[8px] text-zinc-500 mt-1 pl-1">
                        Provide the clear transaction hash generated from your crypto wallet or bank payload.
                      </p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-zinc-500 mb-1">Upload Receipt Screenshot</label>
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center justify-center gap-1.5 py-2 px-3 bg-zinc-950 border border-dashed border-zinc-800 hover:border-zinc-750 text-zinc-400 text-xs font-medium rounded-xl cursor-pointer transition-colors">
                          <input 
                            type="file" 
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setScreenshotPreview(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <span>{screenshotPreview ? "Change Receipt Screenshot" : "Upload Screenshot (Proof of Payment)"}</span>
                        </label>
                        {screenshotPreview && (
                          <div className="relative w-full max-h-40 rounded-xl overflow-hidden border border-zinc-800">
                            <img src={screenshotPreview} alt="Screenshot preview" className="w-full h-full object-contain" />
                            <button 
                              type="button"
                              onClick={() => setScreenshotPreview(null)}
                              className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white rounded-full hover:bg-black/80 text-[10px]"
                            >
                              ✕ Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="w-full bg-white text-zinc-950 hover:bg-zinc-200 font-bold font-mono text-xs py-2.5 rounded-xl transition-all shadow-md active:scale-98 cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading ? "SUBMITTING REFERENCE..." : "SUBMIT AUDITING REQUEST"}
                    </button>
                  </form>
                </div>

                {/* DEPOSIT CLAIMS LISTING IN SEPARATED BLOCK */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-[1.5rem] p-5">
                  <h3 className="text-xs font-bold uppercase tracking-widest font-mono text-zinc-400 mb-3 block">
                    Deposit Claims Auditing Logs ({deposits.length})
                  </h3>
                  {deposits.length === 0 ? (
                    <div className="bg-zinc-950/40 p-6 border border-zinc-850/40 text-center text-zinc-500 font-mono text-[11px] rounded-xl">
                      No deposit records identified for this profile.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                      {deposits.map((item) => (
                        <div key={item.id} className="bg-zinc-950 p-3 border border-zinc-900 rounded-xl text-[11px] font-mono flex justify-between items-center gap-2">
                          <div>
                            <span className="text-white block font-bold text-xs">{formatCurrency(item.amount)}</span>
                            <span className="text-zinc-500 block text-[9px]">ID: {item.id} | TXID: {item.txid}</span>
                            {item.adminReason && (
                              <span className="block text-rose-400 text-[9px] mt-1.5 bg-rose-950/20 border border-rose-900/30 p-1 rounded font-sans">
                                ⚠️ Reject Code: "{item.adminReason}"
                              </span>
                            )}
                          </div>
                          
                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-zinc-500 block mb-0.5">{formatDate(item.createdAt)}</span>
                            <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold tracking-wider ${
                              item.status === 'approved' ? "bg-emerald-950 text-emerald-400" :
                              item.status === 'rejected' ? "bg-rose-950 text-rose-400" :
                              "bg-zinc-900 text-zinc-400"
                            }`}>
                              {item.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {financialSubTab === "withdraw" && (
              <div className="space-y-6">
                {/* INTEGRATED WITHDRAW MODULE (Minimum: 5,000, Maximum: Unlimited, minus 18% GST deducted from balance!) */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-[1.5rem] p-5 space-y-4 shadow-xl">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase block">Secure Payout Portal</span>
                    <h3 className="text-lg font-bold font-display text-white">Request Digital Withdrawal</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Convert compounding asset dividends to raw capital. Minimum: <span className="font-mono text-white">5,000 IQD</span> (Maximum: Unlimited).
                    </p>
                    <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl text-xs font-mono space-y-1 text-zinc-400">
                      <p className="text-[11px] text-white font-sans font-bold flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        Regulatory Mandate — GST Audit Rule
                      </p>
                      <p className="text-[10px] text-zinc-500 leading-relaxed">
                        According to jurisdictional compliance regulations, approved withdrawals deduct the base amount request <strong className="text-white">+ 18% GST</strong> directly from your pool card balance. For example: To withdraw 10,000 IQD, your available capital must reflect at least 11,800 IQD in verified funds.
                      </p>
                    </div>
                  </div>

                  {/* ACTION WITHDRAW INPUT FORM */}
                  <form onSubmit={handleWithdrawSubmit} className="space-y-3 font-sans">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-medium text-zinc-500 mb-1">Base Amount to Cashout</label>
                        <input 
                          type="number" 
                          required 
                          min="5000" 
                          value={withdrawAmount} 
                          onChange={(e) => setWithdrawAmount(e.target.value)} 
                          placeholder="10000"
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                        />
                      </div>

                      <div>
                        <span className="block text-[10px] font-medium text-zinc-500 mb-1">Deducted from Balance</span>
                        <div className="bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs font-bold font-mono text-rose-400">
                          {formatCurrency(parseFloat(withdrawAmount || "0") * 1.18)} 
                          <span className="text-[8px] font-normal text-zinc-500 ml-1">(inc 18% GST)</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-zinc-500 mb-1">Your Receiving Payout Details</label>
                      <input 
                        type="text" 
                        required 
                        value={withdrawalPaymentDetails} 
                        onChange={(e) => setWithdrawalPaymentDetails(e.target.value)} 
                        placeholder="TRC20 Wallet Address or Bank Account info"
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                      />
                      <p className="text-[8px] text-zinc-500 mt-1 pl-1">
                        Ensure exact alphanumeric accuracy to prevent complete non-reversible capital transmission loss.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="w-full bg-white text-zinc-950 hover:bg-zinc-200 font-bold font-mono text-xs py-2.5 rounded-xl transition-all shadow-md active:scale-98 cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading ? "QUEUING TRANSFER..." : "AUTHORIZE CASHOUT DISBURSEMENT"}
                    </button>
                  </form>
                </div>

                {/* WITHDRAWAL COMPLIANCE RULES BOX */}
                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-[1.5rem] p-5 space-y-3 shadow-lg font-sans">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-zinc-800">
                    <ShieldAlert className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-white">Withdrawal Rules & Guidelines</span>
                  </div>
                  <ul className="space-y-2 text-[11px] text-zinc-400 leading-relaxed list-none pl-0">
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold shrink-0">•</span>
                      <span>The minimum withdrawal is <strong>5,000 Iraqi dinars</strong>; the maximum withdrawal is <strong>unlimited</strong>.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold shrink-0">•</span>
                      <span>Withdrawal hours are from <strong>9:00 AM to 9:00 PM daily</strong>.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold shrink-0">•</span>
                      <span>Withdrawals are unlimited; multiple withdrawals are allowed per day.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold shrink-0">•</span>
                      <span>Withdrawal fees are <strong>18%</strong>.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold shrink-0">•</span>
                      <span>Withdrawals are processed within a minimum of two hours, and within 24 hours in exceptional cases.</span>
                    </li>
                    <li className="flex items-start gap-1.5 pt-1">
                      <span className="text-rose-450 text-[10px] shrink-0">⚠️</span>
                      <span className="text-zinc-300">Please enter your withdrawal account information correctly. Incorrect information will result in the withdrawal process failing.</span>
                    </li>
                    <li className="flex items-start gap-1.5 border-t border-zinc-850/50 pt-2.5 mt-2">
                      <span className="text-emerald-500 text-xs shrink-0">🛡️</span>
                      <span className="text-emerald-400 text-[10px] font-medium font-mono">To protect the rights and interests of the platform and users, you must have at least one device to activate the withdrawal feature.</span>
                    </li>
                  </ul>
                </div>

                {/* WITHDRAWAL DISBURSALS LISTING IN SEPARATED BLOCK */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-[1.5rem] p-5">
                  <h3 className="text-xs font-bold uppercase tracking-widest font-mono text-zinc-400 mb-3 block">
                    Withdrawal Disbursals Auditing Logs ({withdrawals.length})
                  </h3>
                  {withdrawals.length === 0 ? (
                    <div className="bg-zinc-950/40 p-6 border border-zinc-850/40 text-center text-zinc-500 font-mono text-[11px] rounded-xl">
                      No withdrawal records identified for this profile.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                      {withdrawals.map((item) => (
                        <div key={item.id} className="bg-zinc-950 p-3 border border-zinc-900 rounded-xl text-[11px] font-mono flex justify-between items-center gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 text-white">
                              <span className="font-bold text-xs">{formatCurrency(item.amount)}</span>
                              <span className="text-[9px] text-rose-400">({formatCurrency(item.deductedAmount)} deducted)</span>
                            </div>
                            <span className="text-zinc-550 block text-[9px] truncate max-w-[210px] mt-0.5">Addr: {item.paymentDetails}</span>
                            {item.adminReason && (
                              <span className="block text-rose-400 text-[9px] mt-1.5 bg-rose-950/20 border border-rose-900/30 p-1 rounded font-sans">
                                ⚠️ Reject Code: "{item.adminReason}"
                              </span>
                            )}
                          </div>
                          
                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-zinc-500 block mb-0.5">{formatDate(item.createdAt)}</span>
                            <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold tracking-wider ${
                              item.status === 'approved' ? "bg-emerald-950 text-emerald-400" :
                              item.status === 'rejected' ? "bg-rose-950 text-rose-400" :
                              "bg-zinc-900 text-zinc-400"
                            }`}>
                              {item.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        )}

        {/* -------------------- TAB 3: GLOBAL BULLETIN FORUM (NEWS) -------------------- */}
        {activeTab === "companynews" && (
          <div className="space-y-6">
            
            <div id="company-info-bulletin" className="bg-zinc-900 border border-zinc-800 rounded-[1.5rem] p-6 md:p-8 relative overflow-hidden flex flex-col md:flex-row gap-6 justify-between items-start">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_80%,rgba(16,163,74,0.05),transparent_40%)]"></div>
              
              <div className="space-y-3 z-10 max-w-2xl font-sans">
                <span className="text-xs uppercase tracking-widest font-mono text-emerald-400 font-bold">🏢 CATEGORY BULLETIN: COMPANY INFO</span>
                <h2 className="text-2xl font-bold tracking-tight font-display text-white">Aura Swiss Cryptographic Escrow Association</h2>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Established in Zug, Switzerland, Aura Security Group functions as a high-liquidity escrow interface that permits digital product retailers to monetize computational cycles safely. All user capital reserve limits stay backed 1:1 in secure audited reserves.
                </p>
                <div className="grid grid-cols-2 gap-4 pb-1 font-mono text-[11px] text-zinc-500">
                  <div className="bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-850">
                    <span className="text-zinc-600 font-sans block mb-0.5">Registration</span>
                    <span className="text-white">UID-AURA-918239CH</span>
                  </div>
                  <div className="bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-850">
                    <span className="text-zinc-600 font-sans block mb-0.5">Asset Capital Reserves</span>
                    <span className="text-emerald-405 font-semibold">$14.2M Audited</span>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-950/70 p-4 rounded-xl border border-zinc-800/80 font-mono text-[11px] w-full md:w-64 max-w-sm">
                <span className="text-white font-bold block mb-2 font-sans text-xs">⚠️ COMPLIANCE DISCLAIMER</span>
                <p className="text-zinc-500 leading-relaxed text-[10px]">
                  Users are strictly warned against duplicate account registration. Any attempts to cheat affiliate referral hierarchies are swept under automatic internal anti-fraud scripts. Keep one master register key active per domestic physical address.
                </p>
              </div>
            </div>
             </div>
        )}
        {activeTab === "news" && (
<div className="space-y-6">
            {/* NEWS BULLETIN BLOG LISTING */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-mono tracking-widest text-zinc-500 font-bold uppercase">📰 LIVE NEWS BULLETINS</span>
                <span className="text-[10px] text-emerald-400 font-mono">Platform online updates</span>
              </div>

              {news.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-850 p-10 text-center font-mono text-xs text-zinc-600 rounded-xl">
                  No company newsletters available at this coordinate.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {news.map((item) => (
                    <div 
                      key={item.id} 
                      className="bg-zinc-900 border border-zinc-800 rounded-[1.25rem] p-5 space-y-2 relative group hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex justify-between items-start text-[10px] font-mono text-zinc-500">
                        <span>Issued: {item.date}</span>
                        <span className="bg-zinc-950 px-2 py-0.5 rounded text-[9px]">{item.author}</span>
                      </div>
                      <h4 className="text-sm font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs text-zinc-400 leading-relaxed font-sans mt-2">
                        {item.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* -------------------- TAB 4: USER SETTINGS (AFFILIATE PROGRAM DETAILS) -------------------- */}
        {activeTab === "settings" && (
          <div className="space-y-6">


            {/* BIO EDIT/ACCOUNT INFORMATIONS */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-[1.5rem] p-5 shadow-xl">
              <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase block">Terminal Management</span>
              <h3 className="text-lg font-bold font-display text-white mb-3">Adjust Account Profile Details</h3>
              
              <form onSubmit={handleProfileUpdateSubmit} className="space-y-4 max-w-md font-sans">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Display Profile Nickname</label>
                    <input 
                      type="text" 
                      required 
                      value={newUsername} 
                      onChange={(e) => setNewUsername(e.target.value)} 
                      placeholder="Display nickname"
                      className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-750 focus:border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">Change Authentication Password</label>
                    <input 
                      type="password" 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      placeholder="Leave blank to preserve keys"
                      className="w-full bg-zinc-950 border border-zinc-850 hover:border-zinc-750 focus:border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs font-medium text-zinc-650 mb-1">Authenticated Phone ID</span>
                    <div className="bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs font-mono text-zinc-500">
                      {user.phone}
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs font-medium text-zinc-650 mb-1">Date Created</span>
                    <div className="bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs font-mono text-zinc-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-white text-zinc-900 hover:bg-zinc-200 text-xs font-bold rounded-xl transition-all shadow cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? "SAVING MEMORY..." : "UPDATE PROFILE CREDENTIALS"}
                </button>
              </form>
            </div>
              </div>
        )}
{activeTab === "invitation" && (
          <div className="space-y-6">
            {/* INTEGRATION REFERRAL AFFILIATE ENGINE LINK BUILDER */}
            <div id="referral-affiliate-section" className="bg-zinc-900 border border-zinc-800 rounded-[1.5rem] p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/20 to-zinc-900/5 pointer-events-none"></div>

              <div className="relative z-10 space-y-4">
                <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-bold block">🤝 CATEGORY MODULE: AFFILIATE COMMISSION PROGRAM</span>
                <h3 className="text-xl font-bold font-display text-white">Generate Aura Referral Invitation Codes</h3>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                  Aura operates strictly as an invite-only platform. When users utilize your referral link, the referral code is automatically secured as read-only. In addition, you will receive a <strong className="text-emerald-400 font-mono">10% first deposit bonus commission</strong> directly into your active capital balances upon admin approval.
                </p>

                <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl max-w-xl font-mono text-xs space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch">
                    <div className="flex-1">
                      <span className="text-[10px] text-zinc-500 font-sans block mb-1">Your Direct Invitation Link:</span>
                      <div className="bg-zinc-900/60 p-2 border border-zinc-850 rounded text-[11px] text-white select-all break-all pr-2">
                        {`${window.location.origin}/?ref=${user.referralCode}`}
                      </div>
                    </div>

                    <button
                      onClick={copyReferralLink}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-200 hover:text-zinc-950 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all self-end h-10 w-full sm:w-auto shrink-0 cursor-pointer"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          COPIED LINK
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          COPY LINK
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-zinc-900 text-[11px]">
                    <div>
                      <span className="text-zinc-600 block font-sans">Direct Referral Code</span>
                      <span className="text-white font-bold">{user.referralCode}</span>
                    </div>
                    <div>
                      <span className="text-zinc-650 block font-sans">Commission Payout</span>
                      <span className="text-emerald-400 font-bold">10.0% of Deposit Approval</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* -------------------- TAB 5: ADMINISTRATION LEVEL PANEL CONTROL -------------------- */}
        {activeTab === "admin" && user.role === 'admin' && (
          <div className="space-y-6">
            
            <div className="bg-emerald-950/20 border border-emerald-900/60 rounded-[1.5rem] p-5">
              <h2 className="text-xl font-bold tracking-tight font-display text-white text-emerald-400 flex items-center gap-2 mb-1">
                👑 Aura Executive Desk Control
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                Review financial requests, update global domestic wire instructions, override user balances, and inject news bulletins directly.
              </p>
            </div>

            {/* ADM PANEL PANEL STATS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div className="bg-zinc-900 p-3.5 border border-zinc-800 rounded-xl font-mono">
                <span className="text-[10px] text-zinc-500 uppercase block">Registered Users</span>
                <span className="text-lg font-bold text-white">{adminUsers.length}</span>
              </div>
              <div className="bg-zinc-900 p-3.5 border border-zinc-800 rounded-xl font-mono">
                <span className="text-[10px] text-zinc-500 uppercase block">Pending Claims</span>
                <span className="text-lg font-bold text-amber-500">{adminDeposits.filter(d=>d.status === 'pending').length}</span>
              </div>
              <div className="bg-zinc-900 p-3.5 border border-zinc-800 rounded-xl font-mono">
                <span className="text-[10px] text-zinc-500 uppercase block">Pending Disbursements</span>
                <span className="text-lg font-bold text-teal-400">{adminWithdrawals.filter(w=>w.status === 'pending').length}</span>
              </div>
              <div className="bg-zinc-900 p-3.5 border border-zinc-800 rounded-xl font-mono">
                <span className="text-[10px] text-zinc-500 uppercase block">Stake Vouchers Active</span>
                <span className="text-lg font-bold text-emerald-405">{adminInvestments.length}</span>
              </div>
            </div>

            {/* ADMIN PENDING TRANSACTIONS CONTROLS */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono uppercase font-bold tracking-widest text-zinc-400">
                PENDING FINANCIAL LIQUIDITY REQUESTS FOR AUDIT
              </h3>

              {/* REJECTION POPUP INJECTION DIALOGUE */}
              {adminSelectedReqId && (
                <div className="bg-zinc-905 border-2 border-rose-900 p-4 rounded-xl space-y-3 font-sans">
                  <h4 className="text-xs font-bold text-rose-400 uppercase">Input Reason for Request Rejection / Audit Failure</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    This message will instantly reflect in the user's rejection dashboard alert as the precise rationale.
                  </p>
                  <div>
                    <input 
                      type="text" 
                      value={adminRejectionReason}
                      onChange={(e) => setAdminRejectionReason(e.target.value)}
                      placeholder="e.g. Transaction Details Mismatch - Verification Hash non-existent"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (adminSelectedType === 'deposit') {
                          handleRejectDeposit(adminSelectedReqId);
                        } else {
                          handleRejectWithdrawal(adminSelectedReqId);
                        }
                      }}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold font-mono text-[10px] rounded"
                    >
                      EXECUTE REJECTION
                    </button>
                    <button
                      onClick={() => {
                        setAdminSelectedReqId(null);
                        setAdminSelectedType(null);
                        setAdminRejectionReason("");
                      }}
                      className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-mono text-[10px] rounded"
                    >
                      CANCEL
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* DEPOSIT CLAIMS CONTROL */}
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-[1.25rem] space-y-3">
                  <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase font-semibold block">Pending Deposits</span>
                  {adminDeposits.filter(d => d.status === 'pending').length === 0 ? (
                    <div className="bg-zinc-950 p-6 text-center text-xs font-mono text-zinc-650 rounded-xl">
                      Deposit pipeline clean. No claims pending.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {adminDeposits.filter(d => d.status === 'pending').map((item) => (
                        <div key={item.id} className="bg-zinc-955 p-3 border border-zinc-850 rounded-xl space-y-2 text-[10px] font-mono">
                          <div className="flex justify-between">
                            <span className="text-white block font-bold">{formatCurrency(item.amount)} ({item.method})</span>
                            <span className="text-zinc-500">{formatDate(item.createdAt)}</span>
                          </div>
                          <div>
                            <p className="text-zinc-400">Phone: <strong className="text-zinc-200">{item.phone}</strong></p>
                            <p className="text-zinc-400">Hash/TXID: <strong className="text-emerald-400 break-all">{item.txid}</strong></p>
                          </div>
                          {item.screenshot && (
                            <div className="mt-1 pb-1">
                              <p className="text-zinc-400 mb-1">Receipt proof screenshot (click to view):</p>
                              <a href={item.screenshot} target="_blank" rel="noopener noreferrer" className="inline-block p-1 bg-zinc-950 border border-zinc-800 rounded hover:border-zinc-700">
                                <img src={item.screenshot} alt="Payment receipt" className="max-h-20 max-w-full object-contain" />
                              </a>
                            </div>
                          )}
                          <div className="flex gap-2 justify-end pt-1">
                            <button
                              onClick={() => handleApproveDeposit(item.id)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold rounded text-[9px] cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setAdminSelectedReqId(item.id);
                                setAdminSelectedType('deposit');
                              }}
                              className="px-3 py-1 bg-rose-650/40 hover:bg-rose-600 text-rose-300 font-bold border border-rose-900 rounded text-[9px] cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* WITHDRAW CLAIMS CONTROL */}
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-[1.25rem] space-y-3">
                  <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase font-semibold block">Pending Withdrawals</span>
                  {adminWithdrawals.filter(w => w.status === 'pending').length === 0 ? (
                    <div className="bg-zinc-950 p-6 text-center text-xs font-mono text-zinc-650 rounded-xl">
                      Disbursement pipeline clean. No claims pending.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {adminWithdrawals.filter(w => w.status === 'pending').map((item) => (
                        <div key={item.id} className="bg-zinc-955 p-3 border border-zinc-850 rounded-xl space-y-2 text-[10px] font-mono">
                          <div className="flex justify-between">
                            <div>
                              <span className="text-white block font-bold">{formatCurrency(item.amount)} Payout</span>
                              <span className="text-rose-400 text-[9px]">Deduct balance by {formatCurrency(item.deductedAmount)}</span>
                            </div>
                            <span className="text-zinc-500">{formatDate(item.createdAt)}</span>
                          </div>
                          <div>
                            <p className="text-zinc-400">Phone: <strong className="text-zinc-200">{item.phone}</strong></p>
                            <p className="text-zinc-400">Recipient Details: <strong className="text-rose-300 break-all">{item.paymentDetails}</strong></p>
                          </div>
                          <div className="flex gap-2 justify-end pt-1">
                            <button
                              onClick={() => handleApproveWithdrawal(item.id)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold rounded text-[9px] cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setAdminSelectedReqId(item.id);
                                setAdminSelectedType('withdrawal');
                              }}
                              className="px-3 py-1 bg-rose-650/40 hover:bg-rose-600 text-rose-300 font-bold border border-rose-900 rounded text-[9px] cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* MANAGE DOMESTIC BANK & CRYPTO DETAILS INSTRUCTIONS FORM */}
            {adminSettings && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-[1.5rem] p-5">
                <span className="text-[10px] font-mono text-zinc-500 uppercase block font-semibold mb-1">Global Configuration Parameters</span>
                <h3 className="text-sm font-bold tracking-tight text-white font-display mb-3">Update Deposit instructions credentials</h3>
                
                <form onSubmit={handleAdminSettingsUpdate} className="space-y-3 font-sans max-w-2xl text-xs text-zinc-300">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-zinc-500 mb-0.5">Domestic Bank Name</label>
                      <input 
                        type="text" 
                        name="bankName"
                        defaultValue={adminSettings.paymentDetails.bankName}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white font-mono outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-500 mb-0.5">Account Number</label>
                      <input 
                        type="text" 
                        name="accountNumber"
                        defaultValue={adminSettings.paymentDetails.accountNumber}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white font-mono outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-500 mb-0.5">Account Name</label>
                      <input 
                        type="text" 
                        name="accountName"
                        defaultValue={adminSettings.paymentDetails.accountName}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-500 mb-0.5">USDT Receiving Address (TRC20)</label>
                    <input 
                      type="text" 
                      name="usdtAddress"
                      defaultValue={adminSettings.paymentDetails.usdtAddress}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white font-mono outline-none animate-[pulse-slow]"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-500 mb-0.5">Aura Auditing Instructions Text</label>
                    <textarea 
                      name="instructions"
                      rows={2}
                      defaultValue={adminSettings.paymentDetails.instructions}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-550 bg-white text-zinc-950 font-bold font-mono rounded-lg hover:bg-zinc-200 transition-colors cursor-pointer"
                  >
                    SAVE CHANNELS CONFIG
                  </button>
                </form>
              </div>
            )}

            {/* ADM USER BALANCES OVERRIDES DIRECTORY LISTING */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-[1.5rem] p-5">
              <span className="text-[10px] font-mono text-zinc-500 uppercase block font-semibold mb-1">Internal Ledger Overlap</span>
              <h3 className="text-sm font-bold tracking-tight text-white mb-3 text-emerald-404">Adjust User Ledgers</h3>
              
              <div className="space-y-1 w-full max-h-[250px] overflow-y-auto">
                {adminUsers.map((item) => (
                  <div key={item.phone} className="bg-zinc-950 p-2.5 border border-zinc-900 rounded-xl text-[10px] font-mono flex justify-between items-center">
                    <div>
                      <span className="text-white block font-bold">{item.username} ({item.phone})</span>
                      <span className="text-[9px] text-zinc-650 block">Ref Code: {item.referralCode} | Referred By: {item.referredBy || "System Admin"}</span>
                    </div>
                    
                    <div className="flex gap-4 items-center">
                      <span className="font-bold text-emerald-400">{formatCurrency(item.balance)}</span>
                      <button
                        onClick={() => handleAdminAdjustBalance(item.phone, item.balance)}
                        className="px-3 py-1 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 rounded cursor-pointer"
                      >
                        Adjust Overrides
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ADMIN INVESTMENT PACKAGES MANAGEMENT SECTION */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-[1.5rem] p-5 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-950/60">
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block font-semibold">Contract Customizer</span>
                  <h3 className="text-sm font-bold tracking-tight text-white font-display">Manage Product Packages</h3>
                </div>
                <span className="text-[9px] font-mono text-zinc-500 px-2 py-1 bg-zinc-950 rounded-lg">
                  Total Active Registry Keys: {products.length}
                </span>
              </div>

              {/* Add New Package Form */}
              <div className="bg-zinc-950/60 p-4 border border-zinc-850 rounded-xl space-y-3 font-sans">
                <span className="text-[9px] font-mono text-emerald-400 block font-bold uppercase tracking-wider">★ Create New Product Package</span>
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setProfileError(null);
                    setProfileSuccess(null);
                    setActionLoading(true);

                    try {
                      const fd = new FormData(e.currentTarget);
                      const payload = {
                        id: (fd.get("p_id") as string || "").trim(),
                        name: (fd.get("p_name") as string || "").trim(),
                        image: (fd.get("p_image") as string || "").trim() || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
                        price: Number(fd.get("p_price")),
                        dailyIncome: Number(fd.get("p_daily")),
                        durationDays: Number(fd.get("p_duration")),
                        description: (fd.get("p_desc") as string || "").trim() || "High-yield premium stable income return package.",
                        purchaseLimit: fd.get("p_limit") ? Number(fd.get("p_limit")) : undefined
                      };

                      if (!payload.id || !payload.name || isNaN(payload.price) || isNaN(payload.dailyIncome) || isNaN(payload.durationDays)) {
                        throw new Error("Missing or invalid numeric fields: id, name, price, dailyIncome, durationDays are required.");
                      }

                      const res = await auraApi.addProduct(payload);
                      if (res.success) {
                        setProfileSuccess(res.message);
                        // Refresh products list
                        const freshProds = await auraApi.getProducts();
                        setProducts(freshProds.products);
                        e.currentTarget.reset();
                      }
                    } catch (err: any) {
                      setProfileError(err.message || "Failure creating product package.");
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs text-zinc-300"
                >
                  <div>
                    <label className="block text-zinc-500 text-[10px] mb-0.5 font-mono">Unique ID (e.g. S5)</label>
                    <input name="p_id" type="text" required placeholder="e.g. S5" className="w-full bg-zinc-90 w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white font-mono outline-none" />
                  </div>
                  <div>
                    <label className="block text-zinc-500 text-[10px] mb-0.5 font-sans">Package Name</label>
                    <input name="p_name" type="text" required placeholder="e.g. Aura Gold Rush S5" className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white outline-none" />
                  </div>
                  <div>
                    <label className="block text-zinc-500 text-[10px] mb-0.5 font-sans">Price (IQD)</label>
                    <input name="p_price" type="number" required placeholder="e.g. 500000" className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white font-mono outline-none" />
                  </div>
                  <div>
                    <label className="block text-zinc-500 text-[10px] mb-0.5 font-sans">Daily Income (IQD)</label>
                    <input name="p_daily" type="number" required placeholder="e.g. 6000" className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white font-mono outline-none" />
                  </div>

                  <div>
                    <label className="block text-zinc-500 text-[10px] mb-0.5 font-sans">Duration (Days)</label>
                    <select name="p_duration" className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white font-mono outline-none">
                      <option value="30">30 days</option>
                      <option value="60">60 days</option>
                      <option value="90">90 days</option>
                      <option value="180">180 days</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-zinc-500 text-[10px] mb-0.5 font-sans">Product Image URL / Path</label>
                    <input name="p_image" type="text" placeholder="https://..." className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white outline-none" />
                  </div>
                  <div>
                    <label className="block text-zinc-500 text-[10px] mb-0.5 font-sans">Purchase Limit (Optional)</label>
                    <input name="p_limit" type="number" placeholder="No Limit" className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-white font-mono outline-none" />
                  </div>
                  <div className="flex items-end">
                    <button type="submit" className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold font-mono rounded transition-colors cursor-pointer text-center">
                      ADD PACKAGE
                    </button>
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-zinc-500 text-[10px] mb-0.5 font-sans">Short Package Description Message</label>
                    <textarea name="p_desc" rows={2} placeholder="Brief editorial package description message..." className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white outline-none text-xs" />
                  </div>
                </form>
              </div>

              {/* Live Inline Editing list of packages */}
              <div className="space-y-3 pt-2">
                <span className="text-[9px] font-mono text-amber-500 block font-bold uppercase tracking-wider">⚡ Edit / Disable Existing Registry Packages</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {products.map((p) => (
                    <div key={p.id} className="bg-zinc-950 p-4 border border-zinc-850 rounded-xl space-y-3 font-mono text-xs text-zinc-300">
                      <div className="flex justify-between items-center pb-1.5 border-b border-zinc-900">
                        <span className="text-white font-bold font-sans uppercase truncate text-[11px] block">{p.name} (ID: {p.id})</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${p.status === 'active' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-500'}`}>
                          {p.status.toUpperCase()}
                        </span>
                      </div>

                      <form 
                        onSubmit={async (e) => {
                          e.preventDefault();
                          setProfileError(null);
                          setProfileSuccess(null);
                          setActionLoading(true);

                          try {
                            const fd = new FormData(e.currentTarget);
                            const updates = {
                              name: (fd.get("e_name") as string || "").trim(),
                              image: (fd.get("e_image") as string || "").trim(),
                              price: Number(fd.get("e_price")),
                              dailyIncome: Number(fd.get("e_dailyIncome")),
                              durationDays: Number(fd.get("e_duration")),
                              description: (fd.get("e_desc") as string || "").trim(),
                              status: fd.get("e_status") as 'active' | 'inactive',
                              purchaseLimit: fd.get("e_limit") ? Number(fd.get("e_limit")) : null
                            };

                            const res = await auraApi.editProduct(p.id, updates);
                            if (res.success) {
                              setProfileSuccess(res.message);
                              const freshProds = await auraApi.getProducts();
                              setProducts(freshProds.products);
                            }
                          } catch (err: any) {
                            setProfileError(err.message || "Failed updating package.");
                          } finally {
                            setActionLoading(false);
                          }
                        }}
                        className="space-y-2 text-[11px]"
                      >
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div>
                            <label className="block text-zinc-500 mb-0.5">Package Name</label>
                            <input name="e_name" type="text" defaultValue={p.name} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-white outline-none font-sans" />
                          </div>
                          <div>
                            <label className="block text-zinc-500 mb-0.5">Image URL / Select</label>
                            <input name="e_image" type="text" defaultValue={p.image} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-white outline-none" />
                          </div>
                          <div>
                            <label className="block text-zinc-500 mb-0.5">Price (IQD)</label>
                            <input name="e_price" type="number" defaultValue={p.price} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-white font-mono outline-none" />
                          </div>
                          <div>
                            <label className="block text-zinc-500 mb-0.5">Daily Income (IQD)</label>
                            <input name="e_dailyIncome" type="number" defaultValue={p.dailyIncome || p.dailyEarning || 0} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-white font-mono outline-none" />
                          </div>
                          <div>
                            <label className="block text-zinc-500 mb-0.5">Duration (Days)</label>
                            <select name="e_duration" defaultValue={p.durationDays} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-white font-mono outline-none">
                              <option value="30">30 days</option>
                              <option value="60">60 days</option>
                              <option value="90">90 days</option>
                              <option value="180">180 days</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-zinc-500 mb-0.5">Purchase Limit (Optional)</label>
                            <input name="e_limit" type="number" defaultValue={p.purchaseLimit || ""} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-white font-mono outline-none" />
                          </div>
                          <div>
                            <label className="block text-zinc-500 mb-0.5 text-cyan-400 font-bold">Total Return (Auto Calc)</label>
                            <span className="block font-bold text-cyan-400 py-1">
                              {formatCurrency((p.dailyIncome || p.dailyEarning || 0) * p.durationDays)}
                            </span>
                          </div>
                          <div>
                            <label className="block text-zinc-500 mb-0.5 text-amber-500 font-bold">Package Status</label>
                            <select name="e_status" defaultValue={p.status} className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-white font-mono outline-none text-amber-500">
                              <option value="active">Active (Visible)</option>
                              <option value="inactive">Inactive (Disabled)</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-zinc-550 mb-0.5 text-[10px]">Description Message</label>
                          <textarea name="e_desc" rows={1} defaultValue={p.description} className="w-full bg-zinc-900 border border-zinc-800 rounded p-1.5 text-white outline-none text-[10px]" />
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1.5">
                          <button 
                            type="button"
                            onClick={async () => {
                              setProfileError(null);
                              setProfileSuccess(null);
                              setActionLoading(true);
                              try {
                                const newStatus = p.status === 'active' ? 'inactive' : 'active';
                                const res = await auraApi.editProduct(p.id, { status: newStatus });
                                if (res.success) {
                                  setProfileSuccess(res.message);
                                  const freshProds = await auraApi.getProducts();
                                  setProducts(freshProds.products);
                                }
                              } catch (err: any) {
                                setProfileError(err.message);
                              } finally {
                                setActionLoading(false);
                              }
                            }}
                            className={`py-1.5 rounded text-center text-[9px] font-bold tracking-wider cursor-pointer font-sans border transition-all ${
                              p.status === 'active' 
                                ? 'bg-red-950/20 border-red-900/60 hover:bg-red-900 hover:text-white text-red-400' 
                                : 'bg-emerald-950/20 border-emerald-900/60 hover:bg-emerald-900 hover:text-white text-emerald-400'
                            }`}
                          >
                            {p.status === 'active' ? "DISABLE PACKAGE" : "ENABLE PACKAGE"}
                          </button>

                          <button 
                            type="submit" 
                            className="py-1.5 bg-zinc-900 hover:bg-white hover:text-zinc-950 text-white font-bold border border-zinc-800 rounded text-center text-[9px] tracking-wider cursor-pointer font-sans transition-colors"
                          >
                            SAVE PACKAGE VALUES
                          </button>
                        </div>
                      </form>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ADM NEWS FORM BULLETIN GENERATION */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-[1.5rem] p-5">
              <span className="text-[10px] font-mono text-zinc-500 uppercase block font-semibold mb-1">News Desk Bulletin Injection</span>
              <h3 className="text-sm font-bold tracking-tight text-white mb-3">Publish Secure Board Updates</h3>
              
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const data = new FormData(form);
                  const title = data.get("title") as string;
                  const content = data.get("content") as string;
                  if (!title || !content) return;
                  try {
                    await auraApi.addNewsItem(title, content);
                    alert("News article published successfully to users.");
                    form.reset();
                    await updateUserData();
                  } catch (err: any) {
                    alert("Error: " + err.message);
                  }
                }}
                className="space-y-3 font-sans text-xs text-zinc-300 max-w-2xl"
              >
                <div>
                  <label className="block text-zinc-500 mb-0.5">Article Title</label>
                  <input 
                    name="title" 
                    required 
                    placeholder="e.g. Server-pool maintenance update..." 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-0.5">Article details / newsletter text content</label>
                  <textarea 
                    name="content" 
                    required 
                    rows={3} 
                    placeholder="Provide article description parameters..." 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white outline-none"
                  />
                </div>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-white text-zinc-950 hover:bg-zinc-200 font-bold font-mono rounded-lg transition-colors cursor-pointer"
                >
                  PUBLISH NEWS ARTICLE
                </button>
              </form>
            </div>

          </div>
        )}

      </div>

      {/* PLATFORM METIC FOOTER */}
      <footer id="aura-editorial-footer" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 border-t border-zinc-900 pt-4 flex flex-col md:flex-row justify-between items-center gap-6 text-[11px] font-mono text-zinc-600">
        {/* <div className="space-y-1 text-center md:text-left">
          <p className="text-zinc-500 font-bold font-display uppercase tracking-wider text-xs">
            AURA CRYPTO BROKERAGE & SECURE TRUST GMBH
          </p>
          <p className="mt-0.5">Aura escrow is secured legally in Zug, Switzerland. uid: CHE-441-238-981.</p>
        </div> */}

        {/* <div className="flex gap-4 flex-wrap justify-center font-sans uppercase tracking-widest text-[9px] font-semibold">
          <a href="#" className="hover:text-zinc-400">Swiss Escrow association</a>
          <a href="#" className="hover:text-zinc-400">Privacy & Cryptographic standards</a>
          <a href="#" className="hover:text-zinc-400">Node Liquidity Index</a>
        </div> */}

        <p className="text-zinc-700 select-none">
          © {new Date().getFullYear()} Aura Inc. Secure terminal live.
        </p>
      </footer>

      {/* PLATFORM NOTICE MODAL POPUP */}
      {showNoticeModal && (
        <div id="platform-notice-modal" className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Overlay Background */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={closeNoticeModal}
          ></div>
          
          {/* Modal Card Container */}
          <div className="relative bg-white text-zinc-950 max-w-sm sm:max-w-md w-full rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden p-6 flex flex-col space-y-5 animate-fade-in z-10 font-sans">
            {/* Centered Large Red Title Header */}
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-extrabold text-red-650 text-red-600 tracking-tight uppercase">
                Platform Notice
              </h2>
              <div className="h-0.5 w-16 bg-red-600 mx-auto mt-1.5 rounded-full"></div>
            </div>

            {/* List Content Section */}
            <div className="space-y-4 text-left font-sans text-xs sm:text-sm text-zinc-900 leading-relaxed max-h-[300px] overflow-y-auto pr-1">
              
              {/* Item 1 */}
              <div className="flex items-start gap-2.5">
                <span className="text-emerald-600 font-bold shrink-0 text-sm mt-0.5">✔</span>
                <p className="font-semibold text-zinc-950">
                  Register now and get 5000 Iraqi dinars!
                </p>
              </div>

              {/* Item 2 */}
              <div className="flex items-start gap-2.5">
                <span className="text-zinc-650 font-bold shrink-0 text-sm mt-0.5">➥</span>
                <div className="space-y-1">
                  <p className="font-bold text-zinc-950">
                    Invite new users to invest and earn instant rewards:
                  </p>
                  <div className="pl-3 space-y-0.5 text-zinc-850 font-semibold">
                    <p>Level 1: 25%</p>
                    <p>Level 2: 3%</p>
                    <p>Level 3: 1%.</p>
                  </div>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex items-start gap-2.5">
                <span className="text-zinc-650 font-bold shrink-0 text-sm mt-0.5">➥</span>
                <p className="text-zinc-850 font-semibold">
                  Deposits and withdrawals are available daily from <span className="font-bold text-zinc-950">9:00 AM to 9:00 PM</span>, with no maximum daily withdrawal limit.
                </p>
              </div>

              {/* Item 4 */}
              <div className="flex items-start gap-2.5">
                <span className="text-emerald-600 font-bold shrink-0 text-sm mt-0.5">✔</span>
                <p className="font-semibold text-zinc-850">
                  Premium members enjoy daily earnings.
                </p>
              </div>

              {/* Item 5 */}
              <div className="flex items-start gap-2.5">
                <span className="text-zinc-950 font-bold shrink-0 text-sm mt-0.5">➤</span>
                <p className="font-bold text-zinc-950">
                  Rewarding returns, daily income!
                </p>
              </div>

              {/* CTA Final Hook */}
              <div className="text-center pt-2 font-extrabold text-emerald-600 text-sm">
                Start growing your money now!
              </div>
            </div>

            {/* Buttons Section */}
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <a
                  href="https://t.me/AuraEscrowChannel"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-[#0088cc] hover:bg-[#007cbd] text-white text-[10px] font-bold uppercase rounded-xl transition-all text-center cursor-pointer shadow-[0_3px_8px_rgba(0,136,204,0.25)]"
                >
                  <Send className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Telegram Channel</span>
                </a>
                <a
                  href="https://t.me/AuraEscrowGroup"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-[#0088cc] hover:bg-[#007cbd] text-white text-[10px] font-bold uppercase rounded-xl transition-all text-center cursor-pointer shadow-[0_3px_8px_rgba(0,136,204,0.25)]"
                >
                  <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Telegram Group</span>
                </a>
              </div>
              
              <button
                onClick={closeNoticeModal}
                className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-900 text-white text-xs font-bold tracking-widest uppercase rounded-xl transition-colors text-center cursor-pointer shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED INVESTMENT PACKAGE VIEW MODAL */}
      {selectedProductDetail && (
        <div id="product-detail-modal" className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          {/* Overlay Background */}
          <div 
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            onClick={() => {
              setSelectedProductDetail(null);
              setProfileError(null);
              setProfileSuccess(null);
            }}
          ></div>
          
          <div className="relative bg-zinc-950 text-white max-w-sm sm:max-w-md w-full rounded-2xl border border-zinc-900 shadow-2xl overflow-hidden p-5 flex flex-col space-y-4 animate-fade-in z-10 font-sans">
            {/* Package Image Block */}
            <div className="w-full h-40 bg-zinc-950 rounded-xl overflow-hidden relative border border-zinc-900">
              <img 
                src={selectedProductDetail.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80"} 
                alt={selectedProductDetail.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Header / Info */}
            <div className="space-y-1 text-center">
              <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-snug">
                {selectedProductDetail.name}
              </h3>
              <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                Safe Escrow Contract Pool
              </p>
            </div>

            {/* Message / Description */}
            <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-900/60 text-zinc-400 text-xs leading-relaxed">
              {selectedProductDetail.description}
            </div>

            {/* Package Detail Table Metrics */}
            <div className="bg-zinc-900/20 rounded-xl p-3 border border-zinc-900/80 space-y-2 text-[11px] font-mono">
              <div className="flex justify-between border-b border-zinc-900/30 pb-1.5">
                <span className="text-zinc-500">Purchase Price</span>
                <span className="text-amber-500 font-bold">{formatCurrency(selectedProductDetail.price)}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900/30 pb-1.5">
                <span className="text-zinc-500">Daily Income</span>
                <span className="text-emerald-400 font-bold">+{formatCurrency(selectedProductDetail.dailyIncome || selectedProductDetail.dailyEarning || 0)}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900/30 pb-1.5">
                <span className="text-zinc-500">Duration Period</span>
                <span className="text-white font-medium">{selectedProductDetail.durationDays} Days</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900/30 pb-1.5">
                <span className="text-zinc-500">Total Income Return</span>
                <span className="text-cyan-400 font-extrabold">
                  {formatCurrency(selectedProductDetail.totalIncome || ((selectedProductDetail.dailyIncome || selectedProductDetail.dailyEarning || 0) * selectedProductDetail.durationDays))}
                </span>
              </div>
              <div className="flex flex-col gap-1 pt-1">
                <span className="text-[9px] text-zinc-400 font-sans font-bold uppercase tracking-wider text-center">Settlement Period Information</span>
                <span className="text-[9px] text-zinc-500 text-center font-sans tracking-tight leading-normal">
                  Yield payouts credit directly to your active capital profile dashboard every 45 SECONDS representing 1 full simulated business day cycle.
                </span>
              </div>
            </div>

            {/* Account Checking Balance Status Display */}
            <div className="flex justify-between items-center px-1 text-[11px] font-mono">
              <span className="text-zinc-500">Your Current Balance</span>
              <span className={`font-bold ${user && user.balance >= selectedProductDetail.price ? "text-emerald-400" : "text-amber-500"}`}>
                {user ? formatCurrency(user.balance) : "0 IQD"}
              </span>
            </div>

            {/* Error/Feedback display inside modal */}
            {profileError && (
              <div className="bg-red-950/20 border border-red-900/50 text-red-400 text-[10px] p-2 rounded-lg font-mono text-center">
                ⚠️ {profileError}
              </div>
            )}
            {profileSuccess && (
              <div className="bg-emerald-950/20 border border-emerald-900/50 text-emerald-400 text-[10px] p-2 rounded-lg font-mono text-center">
                ✓ {profileSuccess}
              </div>
            )}

            {/* Modal Actions */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedProductDetail(null);
                  setProfileError(null);
                  setProfileSuccess(null);
                }}
                className="py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold tracking-wider uppercase rounded-xl transition-colors text-center cursor-pointer border border-zinc-850"
              >
                Cancel
              </button>
              
              <button
                type="button"
                disabled={actionLoading || !user || user.balance < selectedProductDetail.price || selectedProductDetail.status === "inactive"}
                onClick={async () => {
                  setProfileError(null);
                  setProfileSuccess(null);
                  try {
                    const res = await auraApi.investProduct(selectedProductDetail.id);
                    if (res.success) {
                      setProfileSuccess(res.message);
                      setUser(prev => prev ? { ...prev, balance: res.newBalance } : null);
                      await updateUserData();
                      // Close modal on success after a short delay
                      setTimeout(() => {
                        setSelectedProductDetail(null);
                        setProfileSuccess(null);
                      }, 1800);
                    }
                  } catch (err: any) {
                    setProfileError(err.message || "Balance insufficient or stake error.");
                  }
                }}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold tracking-wider uppercase rounded-xl transition-all text-center cursor-pointer shadow-[0_4px_12px_rgba(16,185,129,0.2)] disabled:opacity-40 disabled:pointer-events-none"
              >
                {actionLoading ? "Processing..." : (user && user.balance >= selectedProductDetail.price) ? "Confirm Purchase" : "Low Balance"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
