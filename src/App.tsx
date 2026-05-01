/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Invoices from './components/Invoices';
import DebtTracker from './components/DebtTracker';
import { AppView, Transaction, Invoice, Debt } from './types';
import { INITIAL_TRANSACTIONS, INITIAL_INVOICES, INITIAL_DEBTS } from './constants';
import { AnimatePresence, motion } from 'motion/react';
import { auth, db, signInWithGoogle, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  setDoc, 
  doc, 
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore';
import { LogIn, Sparkles } from 'lucide-react';
import { CurrencyCode } from './types';

export default function App() {
  const [currentView, setCurrentView] = React.useState<AppView>('dashboard');
  const [user, setUser] = React.useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = React.useState(true);
  const [currency, setCurrency] = React.useState<CurrencyCode>('USD');
  
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [debts, setDebts] = React.useState<Debt[]>([]);

  // Auth State Listener
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
      
      if (currentUser) {
        // Create user doc if it doesn't exist
        const userDocRef = doc(db, 'users', currentUser.uid);
        
        // Listen for user profile changes (like currency)
        const unsubsProfile = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            if (data.currency) {
              setCurrency(data.currency as CurrencyCode);
            }
          }
        });

        setDoc(userDocRef, {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          createdAt: serverTimestamp(),
        }, { merge: true }).catch(err => {
          console.error("Error updating user record", err);
        });

        return () => unsubsProfile();
      }
    });
    return unsubscribe;
  }, []);

  const handleCurrencyChange = async (newCurrency: CurrencyCode) => {
    setCurrency(newCurrency);
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      try {
        await setDoc(userDocRef, { currency: newCurrency }, { merge: true });
      } catch (error) {
        console.error("Error updating currency preference", error);
      }
    }
  };

  // Firestore Sync
  React.useEffect(() => {
    if (!user) {
      setTransactions(INITIAL_TRANSACTIONS);
      setInvoices(INITIAL_INVOICES);
      setDebts(INITIAL_DEBTS);
      return;
    }

    const basePath = `users/${user.uid}`;
    
    // Transactions
    const unsubsTransactions = onSnapshot(
      query(collection(db, `${basePath}/transactions`)),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Transaction[];
        setTransactions(data.length > 0 ? data : INITIAL_TRANSACTIONS);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `${basePath}/transactions`)
    );

    // Invoices
    const unsubsInvoices = onSnapshot(
      query(collection(db, `${basePath}/invoices`)),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Invoice[];
        setInvoices(data.length > 0 ? data : INITIAL_INVOICES);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `${basePath}/invoices`)
    );

    // Debts
    const unsubsDebts = onSnapshot(
      query(collection(db, `${basePath}/debts`)),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Debt[];
        setDebts(data.length > 0 ? data : INITIAL_DEBTS);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `${basePath}/debts`)
    );

    return () => {
      unsubsTransactions();
      unsubsInvoices();
      unsubsDebts();
    };
  }, [user]);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard transactions={transactions} invoices={invoices} debts={debts} currency={currency} />;
      case 'transactions':
        return <Transactions transactions={transactions} setTransactions={setTransactions} user={user} currency={currency} />;
      case 'invoices':
        return <Invoices invoices={invoices} setInvoices={setInvoices} user={user} currency={currency} />;
      case 'debts':
        return <DebtTracker debts={debts} setDebts={setDebts} user={user} currency={currency} />;
      default:
        return <Dashboard transactions={transactions} invoices={invoices} debts={debts} currency={currency} />;
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }} 
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 rounded-full border-t-2 border-brand-500"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass p-12 rounded-[60px] max-w-lg w-full text-center space-y-10 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/20 blur-[100px] -mr-32 -mt-32" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 rounded-3xl glass flex items-center justify-center mb-8 border border-white/20 shadow-2xl">
              <Sparkles className="text-brand-400" size={40} />
            </div>
            <h1 className="text-5xl font-display font-black text-white italic tracking-tighter mb-4 uppercase">FinMate</h1>
            <p className="text-slate-400 font-medium text-lg leading-relaxed">
              Step into the future of liquidity management. Your institutional-grade private ledger awaits.
            </p>
          </div>

          <button 
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-4 py-5 bg-white text-slate-900 font-black uppercase tracking-[0.2em] rounded-3xl hover:bg-slate-100 transition-all hover:scale-[1.02] shadow-[0_0_40px_rgba(255,255,255,0.1)] group relative z-10"
          >
            <LogIn size={24} />
            Initialize Google Auth
          </button>
          
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest relative z-10">
            Encrypted End-to-End • Secured by Firebase
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen font-sans">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        currency={currency}
        setCurrency={handleCurrencyChange}
      />
      
      <main className="flex-1 p-4 lg:p-10 pt-20 lg:pt-10 max-w-7xl mx-auto w-full overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

