import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';
import { Transaction, Debt, Invoice, DashboardProps } from '../types';
import { formatCurrency, convertCurrency, cn } from '../lib/utils';
import { motion } from 'motion/react';
import { useCurrency } from '../contexts/CurrencyContext';

export default function Dashboard({ transactions, debts, invoices, currency }: DashboardProps) {
  const { exchangeRate } = useCurrency();
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + convertCurrency(t.amount, t.currency || 'USD', currency, exchangeRate), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + convertCurrency(t.amount, t.currency || 'USD', currency, exchangeRate), 0);

  const totalDebt = debts.reduce((acc, d) => acc + convertCurrency(d.remainingAmount, d.currency || 'USD', currency, exchangeRate), 0);

  // Group transactions by day for the last 7 days
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const chartData = last7Days.map(dateStr => {
    const dayTransactions = transactions.filter(t => t.date === dateStr);
    const income = dayTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + convertCurrency(t.amount, t.currency || 'USD', currency, exchangeRate), 0);
    const expense = dayTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + convertCurrency(t.amount, t.currency || 'USD', currency, exchangeRate), 0);
    
    return {
      name: dayNames[new Date(dateStr).getDay()],
      income,
      expense
    };
  });

  const stats = [
    { label: 'Total Portfolio', value: totalIncome - totalExpense, icon: Wallet, color: 'text-brand-400', bg: 'bg-brand-400/10' },
    { label: 'Revenue', value: totalIncome, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Burn Rate', value: totalExpense, icon: TrendingDown, color: 'text-rose-400', bg: 'bg-rose-400/10' },
    { label: 'Liabilities', value: totalDebt, icon: DollarSign, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  ];

  return (
    <div className="space-y-8 pb-10">
      <header>
        <h2 className="text-4xl font-display font-black text-white tracking-tight">FinMate Dashboard</h2>
        <p className="text-slate-400 mt-1">Real-time financial intelligence and projections.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-6 rounded-[32px] hover:bg-white/10 transition-all relative overflow-hidden group border-white/5"
          >
            <div className={cn("absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-0 transition-opacity group-hover:opacity-10", stat.bg)} />
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border border-white/10", stat.bg)}>
              <stat.icon className={stat.color} size={24} />
            </div>
            <p className="text-[10px] font-black text-slate-500 mb-1 uppercase tracking-widest leading-none">{stat.label}</p>
            <h3 className="text-2xl font-display font-bold text-white tracking-tight">{formatCurrency(stat.value, currency)}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 glass p-8 rounded-[40px] border-white/5"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-display font-bold text-white">Cash Flow Dynamics</h3>
              <p className="text-sm text-slate-500 uppercase font-bold tracking-tight">Active Liquidity Monitoring</p>
            </div>
            <select className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-brand-500">
              <option>Real-time (7D)</option>
              <option>Monthly (30D)</option>
            </select>
          </div>
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 700}} dy={10} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#475569', fontSize: 10, fontWeight: 700}} 
                  tickFormatter={(value) => currency === 'USD' ? `$${value}` : `Rs ${value}`} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                  itemStyle={{ fontWeight: '700' }}
                  formatter={(value: number) => [formatCurrency(value, currency), '']}
                />
                <Area type="monotone" dataKey="income" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Categories / Side Stats */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass p-8 rounded-[40px] border-white/5"
        >
          <h3 className="text-xl font-display font-bold text-white mb-6">Asset Allocation</h3>
          <div className="space-y-6">
            {[
              { label: 'Operations', value: 0, percentage: 0, color: 'bg-brand-400' },
              { label: 'Marketing', value: 0, percentage: 0, color: 'bg-amber-400' },
              { label: 'Technology', value: 0, percentage: 0, color: 'bg-emerald-400' },
              { label: 'Fixed Costs', value: 0, percentage: 0, color: 'bg-rose-400' },
              { label: 'R&D Reserve', value: 0, percentage: 0, color: 'bg-slate-400' },
            ].map((cat) => (
              <div key={cat.label}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{cat.label}</span>
                  <span className="text-sm font-bold text-white">{formatCurrency(cat.value, currency)}</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${cat.percentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={cn("h-full rounded-full", cat.color)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-white/5">
            <div className="flex items-center gap-4 p-5 glass-dark rounded-[24px] border border-white/5">
              <div className="p-3 bg-brand-500/20 text-brand-400 rounded-xl border border-brand-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest">Growth Forecast</p>
                <p className="text-sm font-bold text-white">0% Est. ROI</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Update finished
