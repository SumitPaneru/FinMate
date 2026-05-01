import React, { createContext, useContext, useState, useEffect } from 'react';

interface CurrencyContextType {
  exchangeRate: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refreshRate: () => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const EXCHANGE_RATE_FALLBACK = 148.63;

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [exchangeRate, setExchangeRate] = useState<number>(EXCHANGE_RATE_FALLBACK);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchRate = async () => {
    setIsLoading(true);
    try {
      // Using a reliable public API for conversion, disabling cache for "real-time" feel
      const response = await fetch('https://open.er-api.com/v6/latest/USD', {
        cache: 'no-cache'
      });
      if (!response.ok) throw new Error('Failed to fetch exchange rate');
      const data = await response.json();
      
      if (data.rates && data.rates.NPR) {
        setExchangeRate(data.rates.NPR);
        setLastUpdated(new Date());
        setError(null);
      } else {
        throw new Error('NPR rate not found in API response');
      }
    } catch (err) {
      console.error('Error fetching exchange rate:', err);
      setError('Could not update live rate. Using fallback.');
      setExchangeRate(EXCHANGE_RATE_FALLBACK);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRate();
    // Refresh more frequently (every 5 minutes) for real-time feel
    const interval = setInterval(fetchRate, 300000);
    return () => clearInterval(interval);
  }, []);

  return (
    <CurrencyContext.Provider value={{ exchangeRate, isLoading, error, lastUpdated, refreshRate: fetchRate }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
