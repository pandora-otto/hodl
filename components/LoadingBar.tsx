import { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Dimensions } from 'react-native';
import { theme } from '../constants/theme';

const { width } = Dimensions.get('window');
const BAR_WIDTH = width * 0.4;

interface Props {
  loading: boolean;
}

export default function LoadingBar({ loading }: Props) {
  const translateX = useRef(new Animated.Value(-BAR_WIDTH)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (loading) {
      translateX.setValue(-BAR_WIDTH);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      animationRef.current = Animated.loop(
        Animated.timing(translateX, {
          toValue: width + BAR_WIDTH,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      animationRef.current.start();
    } else {
      animationRef.current?.stop();
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      animationRef.current?.stop();
    };
  }, [loading]);

  return (
    <View style={styles.track}>
      <Animated.View
        style={[
          styles.bar,
          { transform: [{ translateX }], opacity },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 2,
    width: '100%',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  bar: {
    height: 2,
    width: BAR_WIDTH,
    backgroundColor: theme.accent.blue,
    borderRadius: 1,
  },
});