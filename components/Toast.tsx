import { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

interface Props {
    message: string;
    visible: boolean;
}

export default function Toast({ message, visible }: Props) {
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
        <Animated.View style={[styles.toast, { opacity, transform: [{ translateY }] }]}>
            <Text style={styles.text}>{message}</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    toast: {
        position: 'absolute',
        top: 90,
        alignSelf: 'center',
        backgroundColor: '#1e1e2e',
        borderWidth: 1,
        borderColor: theme.border,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 24,
        zIndex: 999,
    },
    text: {
        color: theme.text.primary,
        fontSize: 13,
        fontWeight: '500',
    },
});
