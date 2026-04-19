import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useMemo } from 'react';

export type TimeRange = '4H' | '1' | '7' | '30' | '90' | '365' | 'max';

interface Props {
    selected: TimeRange;
    onSelect: (range: TimeRange) => void;
}

const RANGES: { label: string; value: TimeRange }[] = [
    { label: '4H', value: '4H' },
    { label: '24H', value: '1' },
    { label: '7D', value: '7' },
    { label: '1M', value: '30' },
    { label: '3M', value: '90' },
    { label: '1Y', value: '365' },
    // { label: 'All', value: 'max' },
];

export default function TimeRangeSelector({ selected, onSelect }: Props) {
    const theme = useTheme();
    const styles = useMemo(() => makeStyles(theme), [theme]);

    return (
        <View style={styles.container}>
            {RANGES.map((r) => (
                <TouchableOpacity
                    key={r.value}
                    style={[styles.btn, selected === r.value && styles.btnActive]}
                    onPress={() => onSelect(r.value)}
                >
                    <Text style={[styles.label, selected === r.value && styles.labelActive]}>
                        {r.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

function makeStyles(theme: any) {
    return StyleSheet.create({
        container: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingBottom: 8,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        btn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
        btnActive: { backgroundColor: theme.accent.blue },
        label: { color: theme.text.secondary, fontSize: 13, fontWeight: '600' },
        labelActive: { color: '#fff' },
    });
}
