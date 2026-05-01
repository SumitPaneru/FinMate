import React from 'react';
import { Plus, Search, Send, Download, MoreVertical, CheckCircle, Clock, AlertCircle, Trash2, Eye, BarChart3, Globe } from 'lucide-react';
import { Invoice, InvoiceItem, InvoicesProps, CurrencyCode } from '../types';
import { formatCurrency, convertCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import InvoiceTemplate from './InvoiceTemplate';
import { useCurrency } from '../contexts/CurrencyContext';

interface InvoicePreviewProps {
  invoice: Partial<Invoice>;
  currency: CurrencyCode;
  onClose: () => void;
}

function InvoicePreview({ invoice, currency, onClose }: InvoicePreviewProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-4xl max-h-[95vh] overflow-y-auto rounded-none shadow-2xl relative flex flex-col no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <InvoiceTemplate invoice={invoice} currency={currency} />
        
        {/* Action Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0 print:hidden">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-slate-300 transition-colors"
          >
            Close Preview
          </button>
          <button 
            onClick={() => window.print()}
            className="px-8 py-2 bg-brand-600 text-white font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-brand-500 transition-all shadow-lg shadow-brand-500/20"
          >
            Download Protocol
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Invoices({ invoices, setInvoices, user, currency: globalCurrency }: InvoicesProps) {
  const { exchangeRate } = useCurrency();
  const [isCreating, setIsCreating] = React.useState(false);
  const [previewInvoice, setPreviewInvoice] = React.useState<Invoice | null>(null);
  const [modalCurrency, setModalCurrency] = React.useState<CurrencyCode>(globalCurrency as any || 'NPR');
  const [newInvoice, setNewInvoice] = React.useState<Partial<Invoice>>({
    invoiceNumber: `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`,
    items: [],
    status: 'draft',
    issuedDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    fromName: 'SumitDesigns',
    fromDetails: 'SumitDesigns\nSumit\nNardevi Ayurvedic Hospital\n44600 Kathmandu\nNepal\nsumitpaneru99@gmail.com\n+9779861724669',
    discount: 0,
    notes: '',
    terms: 'Standard 30-day payment terms apply. Interest may be charged on late payments.',
  });

  const calculateInvoiceTotals = (items: InvoiceItem[], discount: number = 0) => {
    const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const taxTotal = items.reduce((acc, item) => {
      const itemTax = (item.tax || 0) / 100;
      return acc + (item.quantity * item.unitPrice * itemTax);
    }, 0);
    return { subtotal, taxTotal, total: Math.max(0, subtotal + taxTotal - discount) };
  };

  const handleAddInvoice = async () => {
    if (!user) return;
    const path = `users/${user.uid}/invoices`;
    const { subtotal, taxTotal, total } = calculateInvoiceTotals(newInvoice.items || [], newInvoice.discount);
    
    try {
      await addDoc(collection(db, path), {
        ...newInvoice,
        subtotal,
        taxTotal,
        total,
        currency: modalCurrency,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      setIsCreating(false);
      setNewInvoice({
        invoiceNumber: `INV-${new Date().getFullYear()}-${String(invoices.length + 2).padStart(3, '0')}`,
        items: [],
        status: 'draft',
        issuedDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        fromName: 'SumitDesigns',
        fromDetails: 'SumitDesigns\nSumit\nNardevi Ayurvedic Hospital\n44600 Kathmandu\nNepal\nsumitpaneru99@gmail.com\n+9779861724669',
        discount: 0,
        notes: '',
        terms: 'Standard 30-day payment terms apply. Interest may be charged on late payments.',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: Math.random().toString(36).substr(2, 9),
      description: '',
      quantity: 1,
      unitPrice: 0,
      tax: 0,
      total: 0,
    };
    setNewInvoice({ ...newInvoice, items: [...(newInvoice.items || []), newItem] });
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    const items = (newInvoice.items || []).map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        const taxVal = (updated.tax || 0) / 100;
        updated.total = (updated.quantity * updated.unitPrice) * (1 + taxVal);
        return updated;
      }
      return item;
    });
    setNewInvoice({ ...newInvoice, items });
  };

  const getStatusIcon = (status: Invoice['status']) => {
    switch (status) {
      case 'paid': return <CheckCircle size={14} className="text-emerald-400" />;
      case 'sent': return <Send size={14} className="text-brand-400" />;
      case 'overdue': return <AlertCircle size={14} className="text-rose-400" />;
      default: return <Clock size={14} className="text-slate-500" />;
    }
  };

  const getStatusStyles = (status: Invoice['status']) => {
    switch (status) {
      case 'paid': return 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20';
      case 'sent': return 'bg-brand-400/10 text-brand-400 border-brand-400/20';
      case 'overdue': return 'bg-rose-400/10 text-rose-400 border-rose-400/20';
      default: return 'bg-white/5 text-slate-400 border-white/5';
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !id) return;
    const path = `users/${user.uid}/invoices/${id}`;
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
          <h2 className="text-4xl font-display font-black text-white tracking-tight">Billing Center</h2>
          <p className="text-slate-400 tracking-tight">FinMate enterprise billing and collection engine.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 text-white font-bold rounded-2xl shadow-xl shadow-brand-500/20 hover:bg-brand-500 transition-all hover:-translate-y-0.5"
        >
          <Plus size={20} />
          Forge Invoice
        </button>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Pending Liquidity', value: invoices.filter(i => i.status !== 'paid').length, color: 'text-amber-400', bg: 'bg-amber-400/10' },
          { label: 'Settled (30D)', value: 0, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { 
            label: 'Aggregate Outstanding', 
            value: invoices
              .filter(i => i.status !== 'paid')
              .reduce((acc, i) => acc + convertCurrency(i.total, i.currency || 'USD', globalCurrency, exchangeRate), 0), 
            color: 'text-white', 
            bg: 'bg-white/5', 
            isCurrency: true 
          },
        ].map((stat) => (
          <div key={stat.label} className="glass p-6 rounded-[28px] border-white/5">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
            <p className={cn("text-2xl font-display font-bold tracking-tight", stat.color)}>
              {stat.isCurrency ? formatCurrency(stat.value, globalCurrency) : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Dashboard Filter */}
      <div className="glass p-4 rounded-[28px] border-white/5 flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search by client identifier..." 
            className="w-full pl-11 pr-4 py-2.5 bg-white/5 border-none rounded-xl focus:ring-1 focus:ring-brand-500 placeholder:text-slate-600 text-white text-sm outline-none"
          />
        </div>
        <select className="bg-white/5 border-none rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-400 focus:ring-1 focus:ring-brand-500 outline-none">
          <option className="bg-slate-900">All Status</option>
          <option className="bg-slate-900">Paid</option>
          <option className="bg-slate-900">Sent</option>
          <option className="bg-slate-900">Draft</option>
          <option className="bg-slate-900">Overdue</option>
        </select>
      </div>

      {/* Invoice List */}
      <div className="glass rounded-[32px] border-white/5 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">IDENTIFIER</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">COUNTERPARTY</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">TIMESTAMP</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">STATUS</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">VALUE</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">OPS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-6">
                    <span className="font-bold text-white tracking-widest">{invoice.invoiceNumber}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-200">{invoice.clientName}</span>
                      <span className="text-[10px] text-slate-500 font-bold tracking-tight lowercase">{invoice.clientEmail}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-tighter">{invoice.issuedDate}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest border", getStatusStyles(invoice.status))}>
                      {getStatusIcon(invoice.status)}
                      {invoice.status.toUpperCase()}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="font-display font-extrabold text-white text-lg">
                      {formatCurrency(convertCurrency(invoice.total, invoice.currency || 'USD', globalCurrency, exchangeRate), globalCurrency)}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button 
                        onClick={() => invoice.id && handleDelete(invoice.id)}
                        className="p-2.5 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button 
                        onClick={() => setPreviewInvoice(invoice)}
                        className="p-2.5 text-slate-500 hover:text-brand-400 hover:bg-white/5 rounded-xl transition-all"
                      >
                        <Eye size={18} />
                      </button>
                      <button className="p-2.5 text-slate-500 hover:text-brand-400 hover:bg-white/5 rounded-xl transition-all">
                        <Download size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal Overlay */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreating(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-[95vw] h-[95vh] glass-dark rounded-[48px] border-white/10 overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.5)]"
            >
              <div className="px-10 py-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-6">
                  <div>
                    <h3 className="text-2xl font-display font-black text-white tracking-tighter italic uppercase">Invoice Forge</h3>
                    <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Live Drafting Environment</p>
                  </div>
                  
                  {/* Local Currency Selector */}
                  <div className="relative">
                    <select 
                      value={modalCurrency}
                      onChange={(e) => setModalCurrency(e.target.value as CurrencyCode)}
                      className="bg-white/5 border border-white/5 rounded-xl pl-4 pr-10 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 focus:ring-1 focus:ring-brand-500 outline-none appearance-none cursor-pointer"
                    >
                      <option value="NPR" className="bg-slate-900">NPR (Rupee)</option>
                      <option value="USD" className="bg-slate-900">USD (Dollar)</option>
                    </select>
                    <Globe size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-400/10 rounded-xl border border-emerald-400/20">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Live Preview Active</span>
                  </div>
                  <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                    <Plus className="rotate-45 text-slate-400" size={24} />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-hidden flex flex-col xl:flex-row">
                {/* Left: Editor */}
                <div className="w-full xl:w-1/2 overflow-y-auto p-10 space-y-12 border-b xl:border-b-0 xl:border-r border-white/5 bg-white/[0.02]">
                  <div className="space-y-10">
                    <div className="grid grid-cols-2 gap-8">
                      {/* Counterparty */}
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-brand-400 uppercase tracking-[0.2em] ml-1 block">Counterparty</label>
                        <input 
                          type="text" 
                          placeholder="Client Name / Organization"
                          className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl focus:ring-1 focus:ring-brand-500 text-white outline-none placeholder:text-slate-700"
                          value={newInvoice.clientName || ''}
                          onChange={(e) => setNewInvoice({ ...newInvoice, clientName: e.target.value })}
                        />
                        <input 
                          type="text" 
                          placeholder="Client Company (Optional)"
                          className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl focus:ring-1 focus:ring-brand-500 text-white outline-none placeholder:text-slate-700"
                          value={newInvoice.clientCompany || ''}
                          onChange={(e) => setNewInvoice({ ...newInvoice, clientCompany: e.target.value })}
                        />
                        <input 
                          type="email" 
                          placeholder="Contact Email"
                          className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl focus:ring-1 focus:ring-brand-500 text-white outline-none placeholder:text-slate-700"
                          value={newInvoice.clientEmail || ''}
                          onChange={(e) => setNewInvoice({ ...newInvoice, clientEmail: e.target.value })}
                        />
                        <textarea 
                          placeholder="Physical Address"
                          rows={2}
                          className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl focus:ring-1 focus:ring-brand-500 text-white outline-none resize-none placeholder:text-slate-700"
                          value={newInvoice.clientAddress || ''}
                          onChange={(e) => setNewInvoice({ ...newInvoice, clientAddress: e.target.value })}
                        />
                      </div>
                      
                      {/* Professional ID */}
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-brand-400 uppercase tracking-[0.2em] ml-1 block">Sender Identity</label>
                        <input 
                          type="text" 
                          placeholder="Trading Name"
                          className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl focus:ring-1 focus:ring-brand-500 text-white outline-none placeholder:text-slate-700"
                          value={newInvoice.fromName || ''}
                          onChange={(e) => setNewInvoice({ ...newInvoice, fromName: e.target.value })}
                        />
                        <textarea 
                          placeholder="Sender Details (Address, Phone, etc.)"
                          rows={4}
                          className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl focus:ring-1 focus:ring-brand-500 text-white outline-none resize-none placeholder:text-slate-700"
                          value={newInvoice.fromDetails || ''}
                          onChange={(e) => setNewInvoice({ ...newInvoice, fromDetails: e.target.value })}
                        />
                        <textarea 
                          placeholder="Recipient Routing (Overrides default block)"
                          rows={3}
                          className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl focus:ring-1 focus:ring-brand-500 text-white outline-none resize-none placeholder:text-slate-700"
                          value={newInvoice.toDetails || ''}
                          onChange={(e) => setNewInvoice({ ...newInvoice, toDetails: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-8">
                       <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 block">Temporal Reference</label>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] text-slate-600 font-bold uppercase mb-2 ml-1 italic">ISSUE DATE</p>
                            <input 
                              type="date" 
                              className="w-full px-5 py-3 bg-white/5 border border-white/5 rounded-xl text-white outline-none text-xs"
                              value={newInvoice.issuedDate || ''}
                              onChange={(e) => setNewInvoice({ ...newInvoice, issuedDate: e.target.value })}
                            />
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-600 font-bold uppercase mb-2 ml-1 italic">DUE DATE</p>
                            <input 
                              type="date" 
                              className="w-full px-5 py-3 bg-white/5 border border-white/5 rounded-xl text-white outline-none text-xs"
                              value={newInvoice.dueDate || ''}
                              onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 block">Financial Overrides</label>
                         <div>
                          <p className="text-[10px] text-slate-600 font-bold uppercase mb-2 ml-1 italic">LOYALTY DISCOUNT</p>
                           <div className="relative">
                            <input 
                              type="number" 
                              placeholder="0.00"
                              className="w-full px-5 py-3 bg-white/5 border border-white/5 rounded-xl text-emerald-400 font-black outline-none"
                              value={newInvoice.discount || ''}
                              onChange={(e) => setNewInvoice({ ...newInvoice, discount: Number(e.target.value) })}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-600">{modalCurrency}</span>
                           </div>
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-4 pt-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 block">Manifest Registry</label>
                        <button 
                          onClick={handleAddItem}
                          className="text-brand-400 text-xs font-black uppercase tracking-widest flex items-center gap-1.5 hover:text-brand-300 transition-colors"
                        >
                          <Plus size={16} /> Forge Entry
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {(newInvoice.items || []).map((item) => (
                          <div key={item.id} className="grid grid-cols-12 gap-3 items-center p-3 rounded-2xl border border-white/5 bg-white/5 group hover:border-brand-500/30 transition-all">
                            <div className="col-span-12 lg:col-span-5">
                              <input 
                                type="text" 
                                placeholder="Service scope description..."
                                className="w-full px-4 py-2 bg-transparent border-none text-white text-sm outline-none placeholder:text-slate-700 font-bold"
                                value={item.description}
                                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                              />
                            </div>
                            <div className="col-span-3 lg:col-span-1">
                              <input 
                                type="number" 
                                placeholder="Qty"
                                className="w-full px-2 py-2 bg-transparent border-b border-white/5 text-center text-white text-sm font-bold outline-none"
                                value={item.quantity}
                                onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                              />
                            </div>
                            <div className="col-span-4 lg:col-span-2">
                              <input 
                                type="number" 
                                placeholder="Unit val"
                                className="w-full px-2 py-2 bg-transparent border-b border-white/10 text-right text-brand-400 font-display font-black text-sm outline-none"
                                value={item.unitPrice}
                                onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                              />
                            </div>
                            <div className="col-span-3 lg:col-span-3">
                              <div className="flex items-center gap-1 px-4 py-2 bg-transparent border-b border-white/10 italic">
                                <span className="text-[10px] text-slate-600 font-black">TAX%</span>
                                <input 
                                  type="number" 
                                  className="w-full bg-transparent text-right text-amber-500/80 font-bold text-sm outline-none"
                                  value={item.tax}
                                  onChange={(e) => updateItem(item.id, 'tax', Number(e.target.value))}
                                />
                              </div>
                            </div>
                            <div className="col-span-2 lg:col-span-1 text-right">
                              <button 
                                onClick={() => setNewInvoice({ ...newInvoice, items: newInvoice.items?.filter(i => i.id !== item.id) })}
                                className="opacity-0 group-hover:opacity-100 p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                              >
                                <Plus className="rotate-45" size={20} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {(newInvoice.items || []).length === 0 && (
                          <div className="py-12 border-2 border-dashed border-white/5 rounded-[32px] flex flex-col items-center justify-center gap-3">
                            <Plus size={32} className="text-slate-700" />
                            <p className="text-xs font-black text-slate-600 uppercase tracking-widest">No entries in current manifest</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Notes & Terms */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 block">Contextual Notes</label>
                        <textarea 
                          placeholder="Internal or public project notes..."
                          rows={4}
                          className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl focus:ring-1 focus:ring-brand-500 text-white outline-none resize-none placeholder:text-slate-700 text-sm"
                          value={newInvoice.notes || ''}
                          onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 block">Standard Protocol (Terms)</label>
                        <textarea 
                          placeholder="Standard legal requirements or collection terms..."
                          rows={4}
                          className="w-full px-5 py-4 bg-white/5 border border-white/5 rounded-2xl focus:ring-1 focus:ring-brand-500 text-white outline-none resize-none placeholder:text-slate-700 text-sm"
                          value={newInvoice.terms || ''}
                          onChange={(e) => setNewInvoice({ ...newInvoice, terms: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Live Preview */}
                <div className="w-full xl:w-1/2 h-full bg-slate-900 overflow-y-auto p-4 sm:p-12 flex flex-col items-center no-scrollbar group">
                  <div className="w-full max-w-[800px] shadow-2xl transition-transform duration-500 origin-top hover:scale-[1.02]">
                    <div className="pointer-events-none">
                       {/* Calculate totals for preview */}
                       {(() => {
                         const totals = calculateInvoiceTotals(newInvoice.items || [], newInvoice.discount);
                         return (
                           <InvoiceTemplate 
                             invoice={{ ...newInvoice, ...totals }} 
                             currency={modalCurrency} 
                           />
                         );
                       })()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-10 bg-black/40 border-t border-white/5 flex items-center justify-between">
                <div className="text-right flex-1 mr-10">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Total Commitment</p>
                  <p className="text-5xl font-display font-black text-white tracking-tighter italic">
                    {formatCurrency(calculateInvoiceTotals(newInvoice.items || [], newInvoice.discount).total, modalCurrency)}
                  </p>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsCreating(false)}
                    className="px-8 py-4 bg-white/5 text-slate-400 font-black uppercase tracking-widest rounded-[24px] border border-white/5 hover:bg-white/10 transition-all active:scale-95"
                  >
                    Abort
                  </button>
                  <button 
                    onClick={handleAddInvoice}
                    disabled={!newInvoice.clientName || (newInvoice.items || []).length === 0}
                    className="px-10 py-4 bg-brand-600 text-white font-black uppercase tracking-widest rounded-[24px] shadow-2xl shadow-brand-500/20 hover:bg-brand-500 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-3"
                  >
                    <Globe size={18} />
                    Deploy & Persist
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewInvoice && (
          <InvoicePreview 
            invoice={previewInvoice} 
            currency={globalCurrency} 
            onClose={() => setPreviewInvoice(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
