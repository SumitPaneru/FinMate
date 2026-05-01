import React from 'react';
import { Invoice, CurrencyCode } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { BarChart3 } from 'lucide-react';

interface InvoiceTemplateProps {
  invoice: Partial<Invoice>;
  currency: CurrencyCode;
}

export default function InvoiceTemplate({ invoice, currency }: InvoiceTemplateProps) {
  return (
    <div className="bg-white w-full shadow-[0_0_20px_rgba(0,0,0,0.05)] text-slate-900 font-sans print:shadow-none min-h-[11in] flex flex-col p-12 sm:p-16">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-12">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">{invoice.fromName || 'FinMate Enterprise'}</h1>
        </div>
        <div className="text-right">
          <h1 className="text-5xl font-black text-slate-900 mb-6 uppercase tracking-widest">INVOICE</h1>
          <div className="space-y-1 text-sm text-slate-500 font-medium">
            <p><span className="text-slate-400 uppercase text-[10px] font-black mr-2">Number:</span> {invoice.invoiceNumber || 'INV-0000'}</p>
            <p><span className="text-slate-400 uppercase text-[10px] font-black mr-2">Issued:</span> {invoice.issuedDate || '2026-04-17'}</p>
            <p><span className="text-slate-400 uppercase text-[10px] font-black mr-2">Due by:</span> {invoice.dueDate || '2026-05-17'}</p>
          </div>
        </div>
      </div>

      <div className="h-px bg-slate-100 w-full mb-12" />

      {/* Billing Information */}
      <div className="grid grid-cols-2 gap-16 mb-16">
        <div>
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">From</h2>
          <div className="text-sm text-slate-600 space-y-1">
            <p className="font-bold text-slate-900 text-lg mb-1">{invoice.fromName || 'FinMate Inc.'}</p>
            <div className="whitespace-pre-wrap leading-relaxed">
              {invoice.fromDetails || '123 Finance Plaza\nWall Street, NY 10005\nUSA'}
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">To</h2>
          <div className="text-sm text-slate-600 space-y-1">
            <p className="font-bold text-slate-900 text-lg mb-1">{invoice.clientName || 'Counterparty Name'}</p>
            {invoice.clientCompany && <p className="font-medium text-slate-500 italic mb-1">{invoice.clientCompany}</p>}
            <div className="whitespace-pre-wrap leading-relaxed">
              {invoice.toDetails || `${invoice.clientEmail || 'client@example.com'}\n${invoice.clientAddress || 'Client Physical Address'}`}
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest rounded-tl-xl">Product / Service Description</th>
              <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-center">Qty</th>
              <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-right">Unit Price</th>
              <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-right">Tax</th>
              <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-right rounded-tr-xl">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(invoice.items || []).length > 0 ? (invoice.items || []).map((item) => (
              <tr key={item.id} className="group hover:bg-slate-50 transition-colors">
                <td className="py-5 px-6 font-bold text-slate-800">{item.description || 'Service Description'}</td>
                <td className="py-5 px-4 text-center text-slate-600 font-medium">{item.quantity}</td>
                <td className="py-5 px-4 text-right text-slate-600 font-medium">{formatCurrency(item.unitPrice, currency)}</td>
                <td className="py-5 px-4 text-right text-slate-400 text-xs italic">{item.tax}%</td>
                <td className="py-5 px-6 text-right font-black text-slate-900">{formatCurrency(item.total, currency)}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-300 italic font-medium">No items added to this manifest yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Section */}
      <div className="mt-12 flex justify-end">
        <div className="w-full max-w-xs space-y-3">
          <div className="glass p-1 border border-slate-200 rounded-xl bg-slate-50 mb-4 flex items-center justify-between px-4">
            <BarChart3 size={16} className="text-slate-400" />
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Financial Summary</span>
          </div>
          
          <div className="px-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">Subtotal</span>
              <span className="text-slate-900 font-bold">{formatCurrency(invoice.subtotal || 0, currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">Aggregate Tax</span>
              <span className="text-slate-900 font-bold">{formatCurrency(invoice.taxTotal || 0, currency)}</span>
            </div>
            {invoice.discount && invoice.discount > 0 ? (
              <div className="flex justify-between text-sm text-emerald-600 font-bold italic">
                <span>Loyalty Discount</span>
                <span>-{formatCurrency(invoice.discount, currency)}</span>
              </div>
            ) : null}
            <div className="h-px bg-slate-200 w-full pt-1" />
            <div className="flex justify-between items-end pt-2">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Grand Total</span>
              <span className="text-4xl font-display font-black text-slate-900 italic tracking-tighter">
                {formatCurrency(invoice.total || 0, currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="mt-16 pt-12 border-t border-slate-100 grid grid-cols-2 gap-12">
        <div className="space-y-4">
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Notes & Terms</h3>
            <p className="text-xs text-slate-500 leading-relaxed italic whitespace-pre-wrap">{invoice.notes || 'No specific notes provided.'}</p>
          </div>
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Terms and Conditions</h3>
            <p className="text-[10px] text-slate-400 leading-relaxed whitespace-pre-wrap">{invoice.terms || 'Standard 30-day payment terms apply. Interest may be charged on late payments.'}</p>
          </div>
        </div>
        <div className="flex flex-col items-end justify-between">
          <div className="text-right">
            <p className="text-sm font-bold text-slate-800 mb-12 italic">Thank you for your partnership.</p>
            <div className="w-48 h-px bg-slate-300 mb-2" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorized Signature</p>
          </div>
          <p className="text-[10px] text-slate-300 font-medium">Page 01 of 01</p>
        </div>
      </div>
    </div>
  );
}
