import { useColorScheme } from 'react-native';
import { useSettingsStore } from '../store/useSettingsStore';
import { darkTheme, lightTheme } from '../constants/theme';

export function useTheme() {
    const themeMode = useSettingsStore((state) => state.themeMode);
    const deviceScheme = useColorScheme(); // 'light' | 'dark' | null

    if (themeMode === 'system') {
        return deviceScheme === 'light' ? lightTheme : darkTheme;
    }
    return themeMode === 'light' ? lightTheme : darkTheme;
}
