import React from 'react';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { ViewStyle } from 'react-native';

interface LinearGradientProps {
  colors: readonly [string, string, ...string[]];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: ViewStyle;
  children?: React.ReactNode;
}

/**
 * Wrapper pentru LinearGradient din expo-linear-gradient pentru a rezolva problemele de tipuri
 */
export const LinearGradient: React.FC<LinearGradientProps> = ({ 
  colors, 
  start, 
  end, 
  style, 
  children 
}) => {
  return (
    <ExpoLinearGradient
      colors={colors}
      start={start}
      end={end}
      style={style}
    >
      {children}
    </ExpoLinearGradient>
  );
};

export default LinearGradient; 