import React, { useState, useEffect } from "react";
import { auraApi } from "../api";
import { User } from "../types";
import { Phone, Lock, User as UserIcon, LogIn, ArrowRight, Share2, HelpCircle, CheckCircle2, ShieldAlert } from "lucide-react";

interface PhoneAuthProps {
  onAuthSuccess: (user: User, token: string) => void;
}

export default function PhoneAuth({ onAuthSuccess }: PhoneAuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [forgotpass, setForgotPass] = useState(false);
  
  // Country Codes Selection

  const [countryCode, setCountryCode] = useState("+964");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [isReferralReadOnly, setIsReferralReadOnly] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Read URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref") || params.get("referral");
    if (ref) {
      setReferralCode(ref.toUpperCase());
      setIsReferralReadOnly(true);
      setIsLogin(false); // Direct user to Register screen
      setSuccess(`Referral code "${ref}" identified & locked! Fill out credentials below.`);
    } else {
      setIsReferralReadOnly(true);
    }
  }, []);

  // Quick demonstration link simulators
  const simulateReferralClick = (code: string) => {
    setReferralCode(code.toUpperCase());
    setIsReferralReadOnly(true);
    setIsLogin(false);
    setError(null);
    setSuccess(`Simulated referral click with code "${code}". Referral field is now locked as READ-ONLY!`);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const fullPhone = `${countryCode}${phoneNumber.replace(/\D/g, "")}`;

    try {
      if (isLogin) {
        const res = await auraApi.login(fullPhone, password);
        if (rememberMe) {
          localStorage.setItem("aura_token", res.token);
          sessionStorage.removeItem("aura_token");
        } else {
          sessionStorage.setItem("aura_token", res.token);
          localStorage.removeItem("aura_token");
        }
        setSuccess("Welcome to Aura Global Elite. Synchronizing terminal...");
        setTimeout(() => {
          onAuthSuccess(res.user, res.token);
        }, 800);
      } else {
        if (!referralCode.trim()) {
          throw new Error("Registration blocked! Aura requires a pre-existing valid sponsor referral linkage code.");
        }
        const res = await auraApi.register(fullPhone, username, password, referralCode.trim());
        localStorage.setItem("aura_token", res.token);
        setSuccess(`Account registered under sponsor "${referralCode.toUpperCase()}"! Logged in.`);
        setTimeout(() => {
          onAuthSuccess(res.user, res.token);
        }, 1000);
      }
    } catch (err: any) {
      setError(err.message || "An auth error occurred.");
    } finally {
      setLoading(false);
    }
  };
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
        const res = await auraApi.updateProfile(username, password || undefined);
        if (res.success) {
        setSuccess("Password reset successful.");
      }
    } catch (err: any) {
      setError(err.message || "An auth error occurred.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div id="phone-auth-container" className="flex flex-col items-center justify-center min-h-[92vh] px-4 py-8">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs text-zinc-400 font-mono tracking-wide mb-3">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          AURA GLOBAL SECURE DECOY
        </div>
      
      </div>

      <div className="w-full max-w-md bg-zinc-900/60 border border-zinc-800/80 rounded-[1.50rem] overflow-hidden backdrop-blur-xl shadow-2xl p-6 md:p-8">
        {/* Navigation Selector */}
        {!forgotpass && (
          <div className="flex bg-zinc-950 p-1.5 rounded-xl gap-1 mb-6">
            <button
              type="button"
              id="btn-tab-login"
              onClick={() => {
                setIsLogin(true);
              setError(null);
              setSuccess(null);
            }}
            className={`flex-1 py-2.5 text-xs font-medium rounded-lg transition-all ${
              isLogin 
                ? "bg-zinc-800 text-white shadow-md border-b border-white/5" 
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40"
            }`}
          >
            Login Credentials
          </button>
          <button
            type="button"
            id="btn-tab-register"
            onClick={() => {
              setIsLogin(false);
              setError(null);
              setSuccess(null);
            }}
            className={`flex-1 py-2.5 text-xs font-medium rounded-lg transition-all ${
              !isLogin 
                ? "bg-zinc-800 text-white shadow-md border-b border-white/5" 
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40"
            }`}
          >
            Register Account
          </button>
        </div>)}

        {/* Informative Alerts */}
        {error && (
          <div className="flex gap-2.5 items-start p-3.5 bg-rose-950/40 border border-rose-900/50 rounded-xl text-xs text-rose-300 mb-4 font-sans">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="flex gap-2.5 items-start p-3.5 bg-emerald-950/40 border border-emerald-900/50 rounded-xl text-xs text-emerald-300 mb-4 font-sans">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p>{success}</p>
          </div>
        )}

        {/* Authenticate Input Form */}
       { !forgotpass  && (
         <form onSubmit={handleAuthSubmit} className="space-y-4">
          
          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 font-sans">
                Profile Display / Nickname
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                  <UserIcon className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  id="reg-nickname"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. Satoshi"
                  className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700/80 focus:border-zinc-600 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white font-sans placeholder-zinc-600 outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 font-sans">
              Phone Number Authentication
            </label>
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                id="country-code-select"
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 text-xs text-zinc-300 font-mono outline-none focus:border-zinc-600"
              >
                <option value="+964">+964</option>
              </select>
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="tel"
                  required
                  id="auth-phone-num"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="98765 43210"
                  className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700/80 focus:border-zinc-600 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white font-mono placeholder-zinc-600 outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 font-sans">
              Secure Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                id="auth-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700/80 focus:border-zinc-600 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
              />
            </div>
          </div>

          {isLogin && (
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-zinc-800 bg-zinc-950 text-emerald-500 focus:ring-zinc-700 h-3.5 w-3.5 cursor-pointer accent-emerald-500"
                />
                Remember Me (Keep me logged in for 30 days)
              </label>
            </div>
          )}

          {!isLogin && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-medium text-zinc-400 font-sans">
                  Referral Link/Code <span className="text-emerald-500">* Required</span>
                </label>
                {isReferralReadOnly && (
                  <span className="text-[10px] bg-emerald-950/60 border border-emerald-900 text-emerald-400 px-2 py-0.5 rounded-full font-mono">
                    LOCKED/READ-ONLY
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                  <Share2 className="w-4 h-4 text-zinc-500" />
                </span>
                <input
                  type="text"
                  required
                  id="auth-ref-code"
                  readOnly={true}
                  value={referralCode}
                  placeholder=""
                  className="w-full bg-emerald-950/10 border border-emerald-900/40 text-emerald-300 font-semibold rounded-xl py-2.5 pl-10 pr-4 text-sm font-mono cursor-not-allowed opacity-80 outline-none"
                />
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">
                Without a valid sponsor referral code, registration remains system blocked.
              </p>
            </div>
          )}

          <button
            type="submit"
            id="btn-auth-submit"
            disabled={loading}
            className="w-full mt-4 bg-white text-zinc-950 hover:bg-zinc-200 font-medium text-sm py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg active:scale-98 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                {isLogin ? "Authenticate Login" : "Establish Membership Account"}
                <ArrowRight className="w-4 h-4 shrink-0" />
              </>
            )}
          </button>
        </form>)}
       {forgotpass && (
         <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
          

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 font-sans">
              OTP-Send On Phone Number
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="tel"
                  required
                  id="auth-phone-num"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0 0 0 0"
                  className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700/80 focus:border-zinc-600 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white font-mono placeholder-zinc-600 outline-none transition-colors"
                />
              </div>
            </div>
          </div>


          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 font-sans">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                id="auth-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700/80 focus:border-zinc-600 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 font-sans">
              New Secure Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                id="auth-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700/80 focus:border-zinc-600 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
              />
            </div>
          </div>
          <button
            type="submit"
            id="btn-auth-submit"
            disabled={loading}
            className="w-full mt-4 bg-white text-zinc-950 hover:bg-zinc-200 font-medium text-sm py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg active:scale-98 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                Reset Password
                <ArrowRight className="w-4 h-4 shrink-0" />
              </>
            )}
          </button>
        </form>)}

        <div className="mt-6 border-t border-zinc-800/80 pt-4 flex flex-col gap-2.5 text-xs text-zinc-500 text-center">
        {!!forgotpass && (
          <div>
            {isLogin ? (
              <p>
                Forgot your password?{" "}
                <button
                  onClick={() => setForgotPass(true)}
                  className="text-zinc-300 hover:underline hover:text-white"
                >
                  Reset Password
                </button>
              </p>
            ) : (
              <p>
                Already have a membership key?{" "}
                <button
                  onClick={() => setIsLogin(true)}
                  className="text-zinc-300 hover:underline hover:text-white"
                >
                  Log in here
                </button>
              </p>
            )}
          </div>)}
        </div>
      </div>

   
    </div>
  );
}
