import { Tabs } from 'expo-router';
import { theme } from '../../constants/theme';
import { Text } from 'react-native';
import Svg, { Path, Polyline, Line, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function WatchlistIcon({ focused }: { focused: boolean }) {
    const color = focused ? theme.text.primary : theme.text.secondary;
    return (
        <Svg width={24} height={24} viewBox="0 0 24 24" stroke={color} strokeWidth="2" fill="none">
            <Polyline points="23.5 22.5 1.5 22.5 1.5 17.55 1.5 0.5"></Polyline>
            <Polyline points="22.54 3.37 12.98 12.94 9.15 9.11 1.5 16.76"></Polyline>
            <Polyline points="17.76 3.37 22.54 3.37 22.54 8.15"></Polyline>
        </Svg>
    );
}

function SearchIcon({ focused }: { focused: boolean }) {
    const color = focused ? theme.text.primary : theme.text.secondary;
    return (
        <Svg width={24} height={24} viewBox="0 0 24 24" stroke={color} strokeWidth="2" fill="none">
            <Circle cx="14.86" cy="9.14" r="7.64"></Circle>
            <Line x1="1.5" y1="22.5" x2="9.14" y2="14.86"></Line>
        </Svg>
    );
}

function AlertIcon({ focused }: { focused: boolean }) {
    const color = focused ? theme.text.primary : theme.text.secondary;
    return (
        <Svg width={24} height={24} viewBox="0 0 24 24" stroke={color} strokeWidth="2" fill="none">
            <Path d="M20.59,14.86V10.09A8.6,8.6,0,0,0,12,1.5h0a8.6,8.6,0,0,0-8.59,8.59v4.77L1.5,16.77v1.91h21V16.77Z"></Path>
            <Path d="M14.69,18.68a2.55,2.55,0,0,1,.17,1,2.86,2.86,0,0,1-5.72,0,2.55,2.55,0,0,1,.17-1"></Path>
        </Svg>
    );
}

function SettingsIcon({ focused }: { focused: boolean }) {
    const color = focused ? theme.text.primary : theme.text.secondary;
    return (
        <Svg width={24} height={24} viewBox="0 0 32 32" stroke={color} strokeWidth="2" fill="none">
            <Path d="M13.905 3.379A.5.5 0 0114.39 3h3.22a.5.5 0 01.485.379l.689 2.757a.515.515 0 00.341.362c.383.126.755.274 1.115.443a.515.515 0 00.449-.003l2.767-1.383a.5.5 0 01.577.093l2.319 2.319a.5.5 0 01.093.577l-1.383 2.767a.515.515 0 00-.003.449c.127.271.243.549.346.833.053.148.17.265.319.315l2.934.978a.5.5 0 01.342.474v3.28a.5.5 0 01-.342.474l-2.934.978a.515.515 0 00-.32.315 9.937 9.937 0 01-.345.833.515.515 0 00.003.449l1.383 2.767a.5.5 0 01-.093.577l-2.319 2.319a.5.5 0 01-.577.093l-2.767-1.383a.515.515 0 00-.449-.003c-.271.127-.549.243-.833.346a.515.515 0 00-.315.319l-.978 2.934a.5.5 0 01-.474.342h-3.28a.5.5 0 01-.474-.342l-.978-2.934a.515.515 0 00-.315-.32 9.95 9.95 0 01-1.101-.475.515.515 0 00-.498.014l-2.437 1.463a.5.5 0 01-.611-.075l-2.277-2.277a.5.5 0 01-.075-.61l1.463-2.438a.515.515 0 00.014-.498 9.938 9.938 0 01-.573-1.383.515.515 0 00-.362-.341l-2.757-.69A.5.5 0 013 17.61v-3.22a.5.5 0 01.379-.485l2.757-.689a.515.515 0 00.362-.341c.157-.478.35-.94.573-1.383a.515.515 0 00-.014-.498L5.594 8.557a.5.5 0 01.075-.611l2.277-2.277a.5.5 0 01.61-.075l2.438 1.463c.152.091.34.094.498.014a9.938 9.938 0 011.382-.573.515.515 0 00.342-.362l.69-2.757z"></Path>
            <Circle cx="16" cy="16" r="4"></Circle>
        </Svg>
    );
}

export default function TabLayout() {
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                sceneStyle: {
                    backgroundColor: theme.bg.primary,
                },
                tabBarStyle: {
                    backgroundColor: theme.bg.secondary,
                    borderTopColor: theme.border,
                    borderTopWidth: 1,
                    height: 50 + insets.bottom,
                    paddingTop: 0,
                    paddingBottom: insets.bottom,
                },
                tabBarActiveTintColor: theme.text.primary,
                tabBarInactiveTintColor: theme.text.secondary,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                },
                animation: 'fade',
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Coins',
                    tabBarIcon: ({ focused }) => <WatchlistIcon focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="search"
                options={{
                    title: 'Search',
                    tabBarIcon: ({ focused }) => <SearchIcon focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="alerts"
                options={{
                    title: 'Alerts',
                    tabBarIcon: ({ focused }) => <AlertIcon focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ focused }) => <SettingsIcon focused={focused} />,
                }}
            />
        </Tabs>
    );
}
