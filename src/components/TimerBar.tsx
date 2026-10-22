import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { theme } from '../theme';

interface TimerBarProps {
  timeRemaining: number;
  totalTime: number;
  isPaused?: boolean;
}

export const TimerBar: React.FC<TimerBarProps> = ({ timeRemaining, totalTime }) => {
  const progressAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const pulseRef = useRef<Animated.CompositeAnimation | null>(null);
  const isUrgent = timeRemaining <= 3;
  const percent = Math.max(0, Math.min(100, (timeRemaining / totalTime) * 100));

  useEffect(() => {
    const target = Math.max(0, timeRemaining / totalTime);
    Animated.timing(progressAnim, { toValue: target, duration: 250, useNativeDriver: false }).start();
  }, [timeRemaining, totalTime]);

  // Flash/pulse the bar when ≤ 3s
  useEffect(() => {
    if (isUrgent) {
      pulseRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(opacityAnim, { toValue: 0.35, duration: 280, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
        ])
      );
      pulseRef.current.start();
    } else {
      pulseRef.current?.stop();
      opacityAnim.setValue(1);
    }
    return () => pulseRef.current?.stop();
  }, [isUrgent]);

  const barColor = isUrgent ? theme.colors.error : percent > 50 ? theme.colors.primary : '#F59E0B';

  return (
    <View style={styles.track}>
      <Animated.View
        style={[
          styles.fill,
          { width: `${percent}%`, backgroundColor: barColor, opacity: opacityAnim },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: { height: 4, backgroundColor: theme.colors.borderLight, width: '100%' },
  fill: { height: '100%', borderRadius: 2 },
});
