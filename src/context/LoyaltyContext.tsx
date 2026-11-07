'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

export interface LoyaltySummary {
  wallet_id: string | null;
  user_id: string;
  points_balance: number;
  rupee_value: number;
  lifetime_earned_points: number;
  lifetime_redeemed_points: number;
  is_active: boolean;
  expiring_soon_points: number;
  next_expiry_date: string | null;
  settings?: {
    is_enabled: boolean;
    earning_percentage: number;
    paise_per_point: number;
    rupees_spent_per_point: number;
    min_cart_subtotal_paise: number;
    min_cart_subtotal_rupees: number;
    min_points_to_redeem: number;
    max_redemption_percentage: number;
    max_points_per_order: number;
  };
  recent_transactions?: any[];
}

interface LoyaltyContextType {
  wallet: LoyaltySummary | null;
  points: number;
  rupeeValue: number;
  loading: boolean;
  refreshLoyalty: () => Promise<void>;
}

const LoyaltyContext = createContext<LoyaltyContextType>({
  wallet: null,
  points: 0,
  rupeeValue: 0,
  loading: false,
  refreshLoyalty: async () => {},
});

export function LoyaltyProvider({ children }: { children: React.ReactNode }) {
  const { user, session } = useAuth();
  const [wallet, setWallet] = useState<LoyaltySummary | null>(null);
  const [points, setPoints] = useState<number>(0);
  const [rupeeValue, setRupeeValue] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  // Restore points from cache if available for instant display
  useEffect(() => {
    if (!user) {
      setWallet(null);
      setPoints(0);
      setRupeeValue(0);
      return;
    }

    try {
      const cached = localStorage.getItem(`kt_loyalty_${user.id}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (typeof parsed.points === 'number') {
          setPoints(parsed.points);
          setRupeeValue(parsed.rupeeValue || 0);
        }
      }
    } catch (e) {
      // Ignore storage errors
    }
  }, [user]);

  const fetchLoyaltySummary = useCallback(async () => {
    if (!user || !session?.access_token) return;

    setLoading(true);
    try {
      const res = await fetch('/api/loyalty/summary', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setWallet(data);
          const pts = Number(data.points_balance) || 0;
          const val = Number(data.rupee_value) || 0;
          setPoints(pts);
          setRupeeValue(val);

          // Save to localStorage for instant subsequent loads
          try {
            localStorage.setItem(
              `kt_loyalty_${user.id}`,
              JSON.stringify({ points: pts, rupeeValue: val, timestamp: Date.now() })
            );
          } catch (e) {
            // Ignore
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch loyalty wallet:', err);
    } finally {
      setLoading(false);
    }
  }, [user, session?.access_token]);

  // Fetch on mount or when user/session changes
  useEffect(() => {
    if (user && session?.access_token) {
      fetchLoyaltySummary();
    }
  }, [user, session?.access_token, fetchLoyaltySummary]);

  // Listen to cross-component loyalty refresh events
  useEffect(() => {
    const handleRefresh = () => {
      fetchLoyaltySummary();
    };

    window.addEventListener('loyalty:refresh', handleRefresh);
    return () => {
      window.removeEventListener('loyalty:refresh', handleRefresh);
    };
  }, [fetchLoyaltySummary]);

  return (
    <LoyaltyContext.Provider
      value={{
        wallet,
        points,
        rupeeValue,
        loading,
        refreshLoyalty: fetchLoyaltySummary,
      }}
    >
      {children}
    </LoyaltyContext.Provider>
  );
}

export function useLoyalty() {
  const context = useContext(LoyaltyContext);
  if (!context) {
    throw new Error('useLoyalty must be used within a LoyaltyProvider');
  }
  return context;
}

