export interface ReferralItem {
    id: string;
    referred_name: string;
    referred_mobile_masked: string;
    order_id?: string;
    order_number?: number;
    status: 'pending' | 'completed' | 'cancelled';
    points_awarded: number;
    discount_given: number;
    created_at: string;
    awarded_at?: string;
}

export interface ReferralDashboardData {
    referral_code: string;
    referral_link: string;
    total_referrals: number;
    completed_referrals: number;
    pending_referrals: number;
    total_points_earned: number;
    total_rupee_value: number;
    discount_rupees: number;
    bonus_points: number;
    min_order_rupees: number;
    is_enabled: boolean;
    referrals: ReferralItem[];
}

