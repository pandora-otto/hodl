import { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface Props {
    message: string;
    visible: boolean;
}

export default function Toast({ message, visible }: Props) {
    const theme = useTheme();
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
                Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
                Animated.timing(translateY, { toValue: 20, duration: 200, useNativeDriver: true }),
            ]).start();
        }
    }, [visible]);

    return (
        <Animated.View
            style={[
                styles.toast,
                {
                    backgroundColor: theme.bg.secondary,
                    borderColor: theme.border,
                    opacity,
                    transform: [{ translateY }],
                },
            ]}
        >
            <Text style={[styles.text, { color: theme.text.primary }]}>{message}</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    toast: {
        position: 'absolute',
        top: 90,
        alignSelf: 'center',
        borderWidth: 1,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 24,
        zIndex: 999,
    },
    text: {
        fontSize: 13,
        fontWeight: '500',
    },
});
