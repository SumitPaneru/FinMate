import React from 'react';
import { LayoutDashboard, ReceiptText, ArrowLeftRight, Landmark, CreditCard, Menu, X, LogOut, User as UserIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { SidebarProps, CurrencyCode, AppView } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { auth, logout } from '../firebase';
import { useCurrency } from '../contexts/CurrencyContext';

export default function Sidebar({ currentView, setCurrentView, currency, setCurrency }: SidebarProps) {
  const { exchangeRate, isLoading, lastUpdated } = useCurrency();
  const [isOpen, setIsOpen] = React.useState(false);
  const user = auth.currentUser;

  const menuItems = [
    { id: 'dashboard' as AppView, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions' as AppView, label: 'Transactions', icon: ArrowLeftRight },
    { id: 'invoices' as AppView, label: 'Invoices', icon: ReceiptText },
    { id: 'debts' as AppView, label: 'Debt Tracker', icon: Landmark },
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-slate-200"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="lg:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-40 w-64 glass p-6 transform transition-transform duration-300 ease-in-out flex flex-col h-full m-4 rounded-[32px]",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-brand-400 shadow-xl border border-white/20">
            <CreditCard size={24} />
          </div>
          <h1 className="font-display font-extrabold text-2xl tracking-tighter logo-gradient uppercase italic">FinMate</h1>
        </div>

        <nav className="flex-1 space-y-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 font-semibold group border border-transparent",
                  isActive 
                    ? "nav-item-active" 
                    : "text-slate-400 hover:text-white hover:bg-white/5 hover:border-white/10"
                )}
              >
                <Icon size={20} className={cn(
                  "transition-transform group-hover:scale-110",
                  isActive ? "text-brand-400" : "text-slate-500 group-hover:text-brand-400"
                )} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="space-y-4 pt-6 mt-6 border-t border-white/5">
          <div className="px-3">
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Currency Paradigm</p>
             <div className="flex p-1 bg-white/5 border border-white/5 rounded-xl">
                {(['USD', 'NPR'] as CurrencyCode[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCurrency(c)}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all",
                      currency === c ? "bg-white/10 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    {c}
                  </button>
                ))}
             </div>
             
             <div className="mt-4 p-4 glass-dark rounded-2xl border border-white/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Live Exchange</span>
                  <div className={cn("w-1.5 h-1.5 rounded-full", isLoading ? "bg-amber-400 animate-pulse" : "bg-emerald-400")} />
                </div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">1 USD</span>
                  <span className="text-xs font-black text-brand-400 italic">Rs {exchangeRate.toFixed(2)}</span>
                </div>
                {lastUpdated && (
                  <p className="text-[8px] text-slate-500 font-black uppercase tracking-tighter text-right">
                    Verified {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
             </div>
          </div>
        </div>

        {user && (
          <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
             <div className="flex items-center gap-3 px-3">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ''} className="w-10 h-10 rounded-xl border border-white/10" />
                ) : (
                  <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-slate-400">
                    <UserIcon size={20} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{user.displayName || 'User'}</p>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-tight">Enterprise Tier</p>
                </div>
             </div>
             <button 
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 text-rose-400 hover:bg-rose-400/10 rounded-2xl transition-all font-bold text-sm"
             >
                <LogOut size={18} />
                Disconnect Session
             </button>
          </div>
        )}
      </aside>
    </>
  );
}
