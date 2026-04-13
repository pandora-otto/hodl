import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { getStoredPushToken } from '../services/pushToken';

export type AlertDirection = 'above' | 'below';
export type AlertType = 'price' | 'percentage';

export interface PriceAlert {
    id: string;
    coinId: string;
    coinName: string;
    type: AlertType;
    targetPrice: number | null;
    percentage: number | null;
    baselinePrice: number | null;
    direction: AlertDirection;
    repeating: boolean;
    notes: string | null;
    triggered: boolean;
    triggeredCount: number;
    triggeredAt: string | null;
    createdAt: string;
}

export interface NewAlert {
    coinId: string;
    coinName: string;
    type: AlertType;
    targetPrice: number | null;
    percentage: number | null;
    baselinePrice: number | null;
    direction: AlertDirection;
    repeating: boolean;
    notes: string | null;
}

interface AlertStore {
    alerts: PriceAlert[];
    hydrate: () => Promise<void>;
    addAlert: (alert: NewAlert) => Promise<void>;
    removeAlert: (id: string) => Promise<void>;
    markTriggered: (id: string) => Promise<void>;
}

function mapRow(row: any): PriceAlert {
    return {
        id: row.id,
        coinId: row.coin_id,
        coinName: row.coin_name,
        type: row.type,
        targetPrice: row.target_price,
        percentage: row.percentage,
        baselinePrice: row.baseline_price,
        direction: row.direction,
        repeating: row.repeating,
        notes: row.notes,
        triggered: row.triggered,
        triggeredCount: row.triggered_count,
        triggeredAt: row.triggered_at,
        createdAt: row.created_at,
    };
}

export const useAlertStore = create<AlertStore>((set, get) => ({
    alerts: [],

    hydrate: async () => {
        const token = await getStoredPushToken();
        if (!token) return;

        const { data: device, error: deviceError } = await supabase
            .from('devices')
            .select('id')
            .eq('push_token', token)
            .single();

        if (deviceError || !device) {
            console.warn('Device not found:', deviceError?.message);
            return;
        }

        // Load both active and triggered alerts
        const { data, error } = await supabase
            .from('alerts')
            .select('*')
            .eq('device_id', device.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.warn('Failed to load alerts:', error.message);
            return;
        }

        set({ alerts: (data ?? []).map(mapRow) });
    },

    addAlert: async (alert) => {
        const token = await getStoredPushToken();
        if (!token) {
            console.warn('No push token — cannot save alert');
            return;
        }

        const { data: device, error: deviceError } = await supabase
            .from('devices')
            .select('id')
            .eq('push_token', token)
            .single();

        if (deviceError || !device) {
            console.warn('Device not found:', deviceError?.message);
            return;
        }

        const { data, error } = await supabase
            .from('alerts')
            .insert({
                device_id: device.id,
                coin_id: alert.coinId,
                coin_name: alert.coinName,
                type: alert.type,
                target_price: alert.targetPrice,
                percentage: alert.percentage,
                baseline_price: alert.baselinePrice,
                direction: alert.direction,
                repeating: alert.repeating,
                notes: alert.notes ?? null,
                triggered: false,
                triggered_count: 0,
            })
            .select()
            .single();

        if (error || !data) {
            console.warn('Failed to add alert:', error?.message);
            return;
        }

        set({ alerts: [mapRow(data), ...get().alerts] });
    },

    removeAlert: async (id) => {
        const { error } = await supabase.from('alerts').delete().eq('id', id);

        if (error) {
            console.warn('Failed to remove alert:', error.message);
            return;
        }

        set({ alerts: get().alerts.filter((a) => a.id !== id) });
    },

    markTriggered: async (id) => {
        const { error } = await supabase
            .from('alerts')
            .update({
                triggered: true,
                triggered_at: new Date().toISOString(),
            })
            .eq('id', id);

        if (error) {
            console.warn('Failed to mark triggered:', error.message);
            return;
        }

        set({
            alerts: get().alerts.map((a) => (a.id === id ? { ...a, triggered: true } : a)),
        });
    },
}));
