export type Theme = typeof darkTheme;

export const darkTheme = {
    bg: {
        primary: '#111827',
        secondary: '#1F2937',
        card: '#1F2937',
    },
    text: {
        primary: '#FFFFFF',
        secondary: '#9CA3AF',
        muted: '#6B7280',
    },
    accent: {
        up: '#10B981',
        down: '#EF4444',
        blue: '#3882FC',
        star: '#F59E0B',
    },
    border: '#374151',
};

export const lightTheme: Theme = {
    bg: {
        primary: '#F9FAFB',
        secondary: '#FFFFFF',
        card: '#FFFFFF',
    },
    text: {
        primary: '#111827',
        secondary: '#6B7280',
        muted: '#9CA3AF',
    },
    accent: {
        up: '#10B981',
        down: '#EF4444',
        blue: '#3882FC',
        star: '#F59E0B',
    },
    border: '#E5E7EB',
};

// Keep this for any file that hasn't been migrated yet
export const theme = darkTheme;
