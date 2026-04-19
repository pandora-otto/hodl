import { useSettingsStore } from '../store/useSettingsStore';
import { darkTheme, lightTheme } from '../constants/theme';

export function useTheme() {
    const themeMode = useSettingsStore((state) => state.themeMode);
    return themeMode === 'light' ? lightTheme : darkTheme;
}
