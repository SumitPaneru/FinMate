import React from 'react';
import { Plus, ArrowUpRight, ArrowDownLeft, Filter, Calendar as CalendarIcon, Tag, MoreHorizontal, Trash2 } from 'lucide-react';
import { Transaction, TransactionsProps, CurrencyCode } from '../types';
import { TRANSACTION_CATEGORIES } from '../constants';
import { formatCurrency, convertCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { useCurrency } from '../contexts/CurrencyContext';

export default function Transactions({ transactions, setTransactions, user, currency: globalCurrency }: TransactionsProps) {
  const { exchangeRate } = useCurrency();
  const [isAdding, setIsAdding] = React.useState(false);
  const [filterType, setFilterType] = React.useState<'all' | 'income' | 'expense'>('all');
  const [modalCurrency, setModalCurrency] = React.useState<CurrencyCode>(globalCurrency);
  
  const [newTransaction, setNewTransaction] = React.useState<Partial<Transaction>>({
    type: 'expense',
    category: TRANSACTION_CATEGORIES[0],
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    description: '',
  });

  React.useEffect(() => {
    setModalCurrency(globalCurrency);
  }, [globalCurrency]);

  const filteredTransactions = transactions.filter(t => 
    filterType === 'all' ? true : t.type === filterType
  );

  const handleAdd = async () => {
    if (!newTransaction.amount || !newTransaction.description || !user) return;
    
    const path = `users/${user.uid}/transactions`;
    try {
      await addDoc(collection(db, path), {
        ...newTransaction,
        currency: modalCurrency,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      setIsAdding(false);
      setNewTransaction({
        type: 'expense',
        category: TRANSACTION_CATEGORIES[0],
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        description: '',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !id) return;
    const path = `users/${user.uid}/transactions/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-display font-black text-white tracking-tight">Ledger</h2>
          <p className="text-slate-400">Chronological transaction integrity monitoring.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 text-white font-bold rounded-2xl border border-white/20 shadow-xl hover:bg-white/20 transition-all hover:-translate-y-0.5"
        >
          <Plus size={20} />
          Append Record
        </button>
      </header>

      {/* Filter Chips */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
        {(['all', 'income', 'expense'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={cn(
              "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
              filterType === type 
                ? "bg-brand-600 text-white border-brand-500 shadow-lg shadow-brand-500/20" 
                : "bg-white/5 text-slate-400 border-white/5 hover:border-white/20 hover:text-white"
            )}
          >
            {type}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <button className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-colors">
            <Filter size={18} />
          </button>
          <button className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-colors">
            <CalendarIcon size={18} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredTransactions.map((t, i) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              key={t.id}
              className="glass p-5 rounded-[24px] border-white/5 flex items-center gap-4 group hover:bg-white/10 transition-all"
            >
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border",
                t.type === 'income' 
                  ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20" 
                  : "bg-rose-400/10 text-rose-400 border-rose-400/20"
              )}>
                {t.type === 'income' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="font-bold text-white truncate">{t.description}</h4>
                  <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-[9px] font-black text-slate-400 rounded-md uppercase tracking-wider">
                    {t.category}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                  <span className="flex items-center gap-1"><CalendarIcon size={12} className="text-brand-400" /> {t.date}</span>
                  <span className="flex items-center gap-1"><Tag size={12} className="text-brand-400" /> {t.type}</span>
                </div>
              </div>

              <div className="text-right flex items-center gap-4">
                <p className={cn(
                  "text-lg font-display font-extrabold tracking-tight",
                  t.type === 'income' ? "text-emerald-400" : "text-white"
                )}>
                  {t.type === 'income' ? '+' : '-'} {formatCurrency(convertCurrency(t.amount, t.currency || 'USD', globalCurrency, exchangeRate), globalCurrency)}
                </p>
                <button 
                  onClick={() => t.id && handleDelete(t.id)}
                  className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
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
                <h3 className="text-2xl font-display font-bold text-white">New Transaction</h3>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                  <Plus className="rotate-45 text-slate-400" size={24} />
                </button>
              </div>

              <div className="flex p-1 bg-white/5 border border-white/5 rounded-2xl">
                {(['expense', 'income'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setNewTransaction({ ...newTransaction, type })}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-xs font-bold transition-all uppercase tracking-widest",
                      newTransaction.type === type 
                        ? "bg-white/10 text-white shadow-lg border border-white/10" 
                        : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between ml-1 mb-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount ({modalCurrency})</label>
                    <select 
                      value={modalCurrency}
                      onChange={(e) => setModalCurrency(e.target.value as CurrencyCode)}
                      className="bg-transparent text-[10px] font-black text-brand-400 uppercase outline-none cursor-pointer"
                    >
                      <option value="USD">USD</option>
                      <option value="NPR">NPR</option>
                    </select>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-brand-400">
                      {modalCurrency === 'USD' ? '$' : 'Rs'}
                    </span>
                    <input 
                      type="number" 
                      className="w-full pl-8 pr-4 py-4 bg-white/5 border border-white/5 rounded-2xl focus:ring-1 focus:ring-brand-500 font-display font-bold text-xl text-white outline-none"
                      placeholder="0.00"
                      value={newTransaction.amount || ''}
                      onChange={(e) => setNewTransaction({ ...newTransaction, amount: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1 mb-2 block tracking-widest">Description</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-4 bg-white/5 border border-white/5 rounded-2xl focus:ring-1 focus:ring-brand-500 text-white outline-none"
                    placeholder="Transaction handle..."
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1 mb-2 block tracking-widest">Category</label>
                    <select 
                      className="w-full px-4 py-4 bg-white/5 border border-white/5 rounded-2xl focus:ring-1 focus:ring-brand-500 text-xs font-bold text-white outline-none appearance-none"
                      value={newTransaction.category}
                      onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                    >
                      {TRANSACTION_CATEGORIES.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1 mb-2 block tracking-widest">Timestamp</label>
                    <input 
                      type="date" 
                      className="w-full px-4 py-4 bg-white/5 border border-white/5 rounded-2xl focus:ring-1 focus:ring-brand-500 text-xs font-bold text-white outline-none invert dark:invert-0"
                      value={newTransaction.date}
                      onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleAdd}
                className="w-full py-4 bg-brand-600 text-white font-bold rounded-2xl shadow-xl shadow-brand-500/20 hover:bg-brand-500 transition-all active:scale-95"
              >
                COMMIT TRANSACTION
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
