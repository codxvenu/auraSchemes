import React, { useState } from "react";
import { User } from "../types";
import { formatCurrency } from "../api";
import { 
  Compass, 
  Wallet, 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  ShieldAlert, 
  Award, 
  FileText,
  Menu,
  X
} from "lucide-react";

interface NavbarProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export default function Navbar({ user, activeTab, setActiveTab, onLogout }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isSelected = (tab: string) => activeTab === tab;

  const tabClass = (tab: string) => {
    const base = "flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ";
    if (isSelected(tab)) {
      return base + "bg-zinc-800 text-white border border-white/5 shadow-md";
    }
    return base + "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50";
  };

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
  };

  return (
    <nav id="aura-main-navigation" className="sticky top-0 z-50 bg-[#0c0c0e]/90 border-b border-zinc-900/80 backdrop-blur-xl py-3 px-4 md:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* BRAND IDENTITY (AURA) */}
        <div className="flex items-center gap-3">
          <div onClick={() => handleTabClick("marketplace")} className="cursor-pointer">
            <h1 className="text-xl font-black tracking-widest font-display text-white">
              AURA
            </h1>
          </div>
          {/* Member/Admin Tag - only show on desktop */}
          <div className="hidden md:block">
            {user.role === 'admin' ? (
              <span className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-950/70 border border-emerald-900/80 rounded-full text-[10px] text-emerald-400 font-mono tracking-wide">
                <ShieldAlert className="w-3 h-3" />
                ADMIN DESK
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] text-zinc-400 font-mono">
                <Award className="w-3 h-3 text-amber-500" />
                MEMBER
              </span>
            )}
          </div>
        </div>

        {/* DESKTOP: Action Tabs Menu */}
        <div className="hidden md:flex items-center bg-zinc-950 p-1 rounded-2xl border border-zinc-900">
          <button 
            type="button" 
            id="nav-marketplace"
            onClick={() => handleTabClick("marketplace")} 
            className={tabClass("marketplace")}
          >
            <Compass className="w-3.5 h-3.5" />
            Marketplace
          </button>
          
          <button 
            type="button" 
            id="nav-financials"
            onClick={() => handleTabClick("financials")} 
            className={tabClass("financials")}
          >
            <Wallet className="w-3.5 h-3.5" />
            Cash desk
          </button>

          <button 
            type="button" 
            id="nav-news"
            onClick={() => handleTabClick("news")} 
            className={tabClass("news")}
          >
            <FileText className="w-3.5 h-3.5" />
            News
          </button>

          <button 
            type="button" 
            id="nav-settings"
            onClick={() => handleTabClick("settings")} 
            className={tabClass("settings")}
          >
            <Settings className="w-3.5 h-3.5" />
            Account
          </button>

          {user.role === 'admin' && (
            <button 
              type="button" 
              id="nav-admin"
              onClick={() => handleTabClick("admin")} 
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer bg-emerald-950 text-emerald-300 border border-emerald-900/50 hover:bg-emerald-900/60"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Admin
            </button>
          )}
        </div>

        {/* BALANCE & THIRD MENU ICON (HAMBURGER ON MOBILE) */}
        <div className="flex items-center gap-4">
          {/* Always display the user balance on both desktop and mobile */}
          <div className="flex flex-col text-right">
            <span className="text-[9px] md:text-[10px] text-zinc-500 font-sans tracking-wide uppercase">Capital</span>
            <span className="text-xs md:text-sm font-semibold font-mono text-emerald-400">
              {formatCurrency(user.balance)}
            </span>
          </div>
          
          {/* DESKTOP LOGOUT SEPARATOR & BUTTON */}
          <div className="hidden md:block h-8 w-[1px] bg-zinc-900"></div>

          <button
            type="button"
            id="btn-nav-logout"
            onClick={onLogout}
            title="Log out of Terminal"
            className="hidden md:block p-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* MOBILE TOGGLE BURGER MENU - Showing on mobile only */}
          <button
            type="button"
            id="btn-mobile-menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-zinc-400 hover:text-white hover:bg-zinc-900/50 rounded-xl transition-all cursor-pointer border border-zinc-900"
            aria-label="Toggle Navigation Menu"
          >
            {isMenuOpen ? <X className="w-5 h-5 animate-pulse" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* MOBILE EXPANDABLE DROPDOWN MENU PANEL */}
      {isMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-zinc-900/60 space-y-2 animate-fade-in">
          <div className="grid grid-cols-1 gap-1 bg-zinc-950 p-2 rounded-2xl border border-zinc-900">
            <button 
              type="button" 
              onClick={() => handleTabClick("marketplace")} 
              className={`flex items-center gap-3 w-full px-4 py-3 text-xs font-semibold rounded-xl text-left transition-all ${
                isSelected("marketplace") ? "bg-zinc-900 text-white border-l-2 border-emerald-500" : "text-zinc-400"
              }`}
            >
              <Compass className="w-4 h-4 shrink-0 text-emerald-400" />
              Marketplace
            </button>
            
            <button 
              type="button" 
              onClick={() => handleTabClick("financials")} 
              className={`flex items-center gap-3 w-full px-4 py-3 text-xs font-semibold rounded-xl text-left transition-all ${
                isSelected("financials") ? "bg-zinc-900 text-white border-l-2 border-emerald-500" : "text-zinc-400"
              }`}
            >
              <Wallet className="w-4 h-4 shrink-0 text-emerald-400" />
              Cash Desk (Deposits & Cash Outs)
            </button>

            <button 
              type="button" 
              onClick={() => handleTabClick("news")} 
              className={`flex items-center gap-3 w-full px-4 py-3 text-xs font-semibold rounded-xl text-left transition-all ${
                isSelected("news") ? "bg-zinc-900 text-white border-l-2 border-emerald-500" : "text-zinc-400"
              }`}
            >
              <FileText className="w-4 h-4 shrink-0 text-emerald-400" />
              Bulletins News
            </button>

            <button 
              type="button" 
              onClick={() => handleTabClick("settings")} 
              className={`flex items-center gap-3 w-full px-4 py-3 text-xs font-semibold rounded-xl text-left transition-all ${
                isSelected("settings") ? "bg-zinc-900 text-white border-l-2 border-emerald-500" : "text-zinc-400"
              }`}
            >
              <Settings className="w-4 h-4 shrink-0 text-emerald-400" />
              Your Account Settings
            </button>

            {user.role === 'admin' && (
              <button 
                type="button" 
                onClick={() => handleTabClick("admin")} 
                className="flex items-center gap-3 w-full px-4 py-3 text-xs font-bold rounded-xl text-left transition-all bg-emerald-950/45 text-emerald-400 border border-emerald-900/40"
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                Admin Dashboard Control
              </button>
            )}

            <div className="h-[1px] bg-zinc-900 my-2 px-4"></div>

            <button 
              type="button" 
              onClick={() => {
                setIsMenuOpen(false);
                onLogout();
              }} 
              className="flex items-center gap-3 w-full px-4 py-3 text-xs font-medium rounded-xl text-left text-rose-450 hover:bg-rose-950/25 transition-all text-rose-400"
            >
              <LogOut className="w-4 h-4 shrink-0 text-rose-500" />
              Logout from Terminal Session
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
