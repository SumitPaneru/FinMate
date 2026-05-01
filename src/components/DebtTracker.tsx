import React from 'react';
import { Plus, Landmark, CreditCard, Home, Globe, TrendingDown, Percent, Calendar, Trash2 } from 'lucide-react';
import { Debt, DebtTrackerProps, CurrencyCode } from '../types';
import { formatCurrency, convertCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { useCurrency } from '../contexts/CurrencyContext';

export default function DebtTracker({ debts, setDebts, user, currency: globalCurrency }: DebtTrackerProps) {
  const { exchangeRate } = useCurrency();
  const [isAdding, setIsAdding] = React.useState(false);
  const [modalCurrency, setModalCurrency] = React.useState<CurrencyCode>(globalCurrency);
  const [newDebt, setNewDebt] = React.useState<Partial<Debt>>({
    type: 'loan',
    totalAmount: 0,
    remainingAmount: 0,
    interestRate: 0,
    dueDate: new Date().toISOString().split('T')[0],
  });

  React.useEffect(() => {
    setModalCurrency(globalCurrency);
  }, [globalCurrency]);

  const getIcon = (type: Debt['type']) => {
    switch (type) {
      case 'loan': return <Landmark size={24} />;
      case 'credit_card': return <CreditCard size={24} />;
      case 'mortgage': return <Home size={24} />;
      default: return <Globe size={24} />;
    }
  };

  const handleAddDebt = async () => {
    if (!user || !newDebt.name || !newDebt.totalAmount) return;
    const path = `users/${user.uid}/debts`;
    try {
      await addDoc(collection(db, path), {
        ...newDebt,
        currency: modalCurrency,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      setIsAdding(false);
      setNewDebt({
        type: 'loan',
        totalAmount: 0,
        remainingAmount: 0,
        interestRate: 0,
        dueDate: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !id) return;
    const path = `users/${user.uid}/debts/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const totalRemaining = debts.reduce((acc, d) => acc + convertCurrency(d.remainingAmount, d.currency || 'USD', globalCurrency, exchangeRate), 0);

  return (
    <div className="space-y-6 pb-10">
       <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-display font-black text-white tracking-tight italic uppercase">Liability Management</h2>
          <p className="text-slate-400 font-bold tracking-tight">Aggregate Exposure: <span className="text-rose-400 underline decoration-rose-500/50 underline-offset-4">{formatCurrency(totalRemaining, globalCurrency)}</span></p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-brand-600 text-white font-black uppercase tracking-widest rounded-3xl shadow-2xl shadow-brand-500/20 hover:bg-brand-500 transition-all hover:-translate-y-0.5"
        >
          <Plus size={20} />
          Register Debt
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {debts.map((debt, i) => {
          const percentage = 100 - (debt.remainingAmount / debt.totalAmount * 100);
          
          return (
            <motion.div
              key={debt.id}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass p-8 rounded-[48px] border-white/5 relative overflow-hidden group hover:bg-white/10 transition-all"
            >
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 text-brand-400 flex items-center justify-center border border-white/10 shadow-lg">
                    {getIcon(debt.type)}
                  </div>
                  <div>
                    <h4 className="text-2xl font-display font-extrabold text-white tracking-tighter">{debt.name}</h4>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{debt.type.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="flex items-center gap-2 mb-3">
                    <button 
                      onClick={() => debt.id && handleDelete(debt.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="px-3 py-1 bg-brand-400/10 text-brand-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-brand-400/20">
                      {debt.interestRate}% APR
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-500 font-black mb-1 uppercase tracking-widest leading-none">Term Date</p>
                  <p className="text-xs font-bold text-white uppercase tracking-tighter">{debt.dueDate}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] text-slate-500 font-black mb-1 uppercase tracking-widest">RESIDUAL VALUE</p>
                    <p className="text-4xl font-display font-black text-white italic tracking-tighter">{formatCurrency(convertCurrency(debt.remainingAmount, debt.currency || 'USD', globalCurrency, exchangeRate), globalCurrency)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 font-black mb-1 uppercase tracking-widest">PRINCIPAL</p>
                    <p className="text-sm font-bold text-slate-400">{formatCurrency(convertCurrency(debt.totalAmount, debt.currency || 'USD', globalCurrency, exchangeRate), globalCurrency)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em]">
                    <span className="text-emerald-400">{percentage.toFixed(0)}% RECLAIMED</span>
                    <span className="text-slate-500">{formatCurrency(convertCurrency(debt.totalAmount - debt.remainingAmount, debt.currency || 'USD', globalCurrency, exchangeRate), globalCurrency)} settled</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-white/5 grid grid-cols-2 gap-4">
                <button className="py-4 px-4 bg-white/5 text-slate-300 font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-[10px] border border-white/5">
                  <TrendingDown size={18} /> Settlements
                </button>
                <button className="py-4 px-4 bg-white/10 text-brand-400 font-black uppercase tracking-widest rounded-2xl border border-brand-400/20 hover:bg-white/20 transition-colors flex items-center justify-center gap-2 text-[10px] shadow-lg">
                   Set Alerts
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md glass-dark rounded-[40px] border-white/10 p-8 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-display font-bold text-white">Register Liability</h3>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                   <Plus className="rotate-45 text-slate-400" size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                   <label className="text-[10px] font-black text-slate-500 uppercase ml-1 mb-2 block tracking-widest">Creditor / Account Name</label>
                   <input 
                    type="text" 
                    className="w-full px-4 py-4 bg-white/5 border border-white/5 rounded-2xl focus:ring-1 focus:ring-brand-500 text-white outline-none"
                    placeholder="e.g. Chase Credit Card"
                    value={newDebt.name || ''}
                    onChange={(e) => setNewDebt({ ...newDebt, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <div className="flex items-center justify-between ml-1 mb-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Principal</label>
                      <select 
                        value={modalCurrency}
                        onChange={(e) => setModalCurrency(e.target.value as CurrencyCode)}
                        className="bg-transparent text-[10px] font-black text-brand-400 uppercase outline-none cursor-pointer"
                      >
                        <option value="USD" className="bg-slate-900 text-slate-200">USD</option>
                        <option value="NPR" className="bg-slate-900 text-slate-200">NPR</option>
                      </select>
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-brand-400">
                        {modalCurrency === 'USD' ? '$' : 'Rs'}
                      </span>
                      <input 
                        type="number" 
                        className="w-full pl-8 pr-4 py-4 bg-white/5 border border-white/5 rounded-2xl focus:ring-1 focus:ring-brand-500 text-white outline-none"
                        placeholder="0.00"
                        value={newDebt.totalAmount || ''}
                        onChange={(e) => setNewDebt({ ...newDebt, totalAmount: Number(e.target.value), remainingAmount: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1 mb-2 block tracking-widest">Interest Rate (%)</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-4 bg-white/5 border border-white/5 rounded-2xl focus:ring-1 focus:ring-brand-500 text-white outline-none"
                      placeholder="0.00"
                      value={newDebt.interestRate || ''}
                      onChange={(e) => setNewDebt({ ...newDebt, interestRate: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1 mb-2 block tracking-widest">Liability Type</label>
                    <select 
                      className="w-full px-4 py-4 bg-white/5 border border-white/5 rounded-2xl focus:ring-1 focus:ring-brand-500 text-xs font-bold text-white outline-none appearance-none"
                      value={newDebt.type}
                      onChange={(e) => setNewDebt({ ...newDebt, type: e.target.value as Debt['type'] })}
                    >
                      <option value="loan" className="bg-slate-900">Loan</option>
                      <option value="credit_card" className="bg-slate-900">Credit Card</option>
                      <option value="mortgage" className="bg-slate-900">Mortgage</option>
                      <option value="other" className="bg-slate-900">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1 mb-2 block tracking-widest">Maturation Date</label>
                    <input 
                      type="date" 
                      className="w-full px-4 py-4 bg-white/5 border border-white/5 rounded-2xl focus:ring-1 focus:ring-brand-500 text-xs font-bold text-white outline-none invert dark:invert-0"
                      value={newDebt.dueDate}
                      onChange={(e) => setNewDebt({ ...newDebt, dueDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleAddDebt}
                className="w-full py-4 bg-brand-600 text-white font-bold rounded-2xl shadow-xl shadow-brand-500/20 hover:bg-brand-500 transition-all active:scale-95 uppercase tracking-widest text-xs"
              >
                Register Account
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Debt Insights Card */}
      <div className="glass-dark p-10 rounded-[60px] border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/20 blur-[120px] -mr-48 -mt-48" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
          <div className="lg:col-span-2">
            <h3 className="text-3xl font-display font-black text-white italic uppercase tracking-tighter mb-4">Tactical Refinance Protocol</h3>
            <p className="text-slate-400 font-medium leading-relaxed mb-8 text-lg">
              Optimizing your repayment architecture by increasing monthly delta by <span className="text-brand-400 font-black underline decoration-brand-500/50">{formatCurrency(0, globalCurrency)}</span> would yield <span className="text-emerald-400 font-black">{formatCurrency(0, globalCurrency)}</span> in recovered interest over 24 months.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="px-8 py-4 bg-brand-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-brand-500 transition-all shadow-xl shadow-brand-500/20">Execute Avalanche Method</button>
              <button className="px-8 py-4 bg-white/5 text-slate-400 font-black uppercase tracking-widest rounded-2xl border border-white/5 hover:bg-white/10 transition-all">Simulation Matrix</button>
            </div>
          </div>
          <div className="bg-black/40 p-8 rounded-[40px] border border-white/10 shadow-2xl">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Efficiency metrics</h4>
            <div className="space-y-6">
              <div className="flex justify-between items-center group">
                <span className="flex items-center gap-3 text-slate-400 font-bold uppercase text-xs transition-colors group-hover:text-brand-400"><Percent size={16} /> WA Interest Rate</span>
                <span className="font-display font-black text-white text-xl italic">0%</span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="flex items-center gap-3 text-slate-400 font-bold uppercase text-xs transition-colors group-hover:text-emerald-400"><Calendar size={16} /> Delta Maturity</span>
                <span className="font-display font-black text-emerald-400 text-xl italic uppercase">N/A</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
