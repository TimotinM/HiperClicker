import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Animated, Text, Dimensions } from 'react-native';
import LinearGradient from './LinearGradientFix';
import { COLORS } from '../../config/settings';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useGame } from '../state/gameStore';

const { width } = Dimensions.get('window');
const BUTTON_SIZE = width * 0.5; // 50% din lățimea ecranului

interface ClickerButtonProps {
  onPress: () => void;
  clickValue: number;
}

const ClickerButton: React.FC<ClickerButtonProps> = ({ onPress, clickValue }) => {
  const [isTapped, setIsTapped] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  // Obținem boosterele active din state
  const { activeBoosters } = useGame();
  const [effectiveClickValue, setEffectiveClickValue] = useState(clickValue);
  
  // Calculăm valoarea efectivă a clickului, ținând cont de multiplicatori
  useEffect(() => {
    let totalMultiplier = 1;
    const now = Date.now();
    
    // Verificăm dacă există boostere active care oferă multiplicatori
    activeBoosters.forEach(booster => {
      if (booster.endTime > now && booster.multiplier) {
        totalMultiplier *= booster.multiplier;
      }
    });
    
    setEffectiveClickValue(clickValue * totalMultiplier);
  }, [clickValue, activeBoosters]);
  
  // Animație permanentă de pulsație
  useEffect(() => {
    const pulsate = Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.05,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ]);
    
    Animated.loop(pulsate).start();
  }, []);
  
  // Animație de rotație continuă
  useEffect(() => {
    const rotate = Animated.timing(rotateAnim, {
      toValue: 1,
      duration: 20000,
      useNativeDriver: true,
    });
    
    Animated.loop(rotate).start();
  }, []);
  
  // Animație pentru strălucire
  useEffect(() => {
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1500,
          useNativeDriver: false,
        })
      ])
    );
    
    glow.start();
    
    return () => glow.stop();
  }, []);
  
  const handlePress = () => {
    // Activăm feedback haptic pentru o experiență mai imersivă
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    setIsTapped(true);
    
    // Animație de apăsare
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsTapped(false);
    });
    
    // Executăm funcția de callback
    onPress();
  };
  
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });
  
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8]
  });
  
  const shadowSize = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 20]
  });
  
  return (
    <View style={styles.container}>
      {/* Efect de strălucire */}
      <Animated.View 
        style={[
          styles.glowEffect, 
          { 
            opacity: glowOpacity,
            shadowRadius: shadowSize,
          }
        ]} 
      />
      
      {/* Butonul principal */}
      <Animated.View
        style={[
          styles.buttonWrapper,
          {
            transform: [
              { scale: scaleAnim },
            ]
          }
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handlePress}
          style={styles.touchable}
        >
          <LinearGradient
            colors={[COLORS.gradient.start, COLORS.gradient.middle, COLORS.gradient.end]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            {/* Animație de elemente TikTok */}
            <Animated.View 
              style={[
                styles.rotatingElement, 
                { transform: [{ rotate: spin }] }
              ]}
            >
              <FontAwesome5 name="fire" size={20} color="rgba(255,255,255,0.4)" />
            </Animated.View>
            
            <View style={styles.innerCircle}>
              <FontAwesome5 name="play" size={36} color="#fff" />
              <Text style={styles.buttonText}>TAP</Text>
              <Text style={styles.valueText}>
                +{Math.floor(effectiveClickValue)}
                {effectiveClickValue > clickValue && (
                  <Text style={styles.multiplierText}> (×{(effectiveClickValue / clickValue).toFixed(1)})</Text>
                )}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
      
      {/* Text ajutător */}
      <Text style={styles.helperText}>Devino viral!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: BUTTON_SIZE * 1.2,  // Ajustăm containerul să aibă aceeași dimensiune ca glowEffect
    height: BUTTON_SIZE * 1.2, // pentru a asigura centrarea corectă
  },
  buttonWrapper: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    elevation: 8,
    shadowColor: COLORS.gradient.start,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    position: 'absolute', // Poziționăm absolut pentru a putea centra perfect
    top: (BUTTON_SIZE * 1.2 - BUTTON_SIZE) / 2, // Calculăm poziția exactă pentru centrare
    left: (BUTTON_SIZE * 1.2 - BUTTON_SIZE) / 2,
  },
  touchable: {
    width: '100%',
    height: '100%',
    borderRadius: BUTTON_SIZE / 2,
    overflow: 'hidden',
  },
  gradient: {
    width: '100%',
    height: '100%',
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  innerCircle: {
    width: BUTTON_SIZE * 0.85,
    height: BUTTON_SIZE * 0.85,
    borderRadius: (BUTTON_SIZE * 0.85) / 2,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonText: {
    fontSize: BUTTON_SIZE * 0.15,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 5,
    textAlign: 'center',
  },
  valueText: {
    fontSize: BUTTON_SIZE * 0.1,
    color: COLORS.secondary,
    marginTop: 2,
  },
  multiplierText: {
    fontSize: BUTTON_SIZE * 0.07,
    color: COLORS.premium,
    fontWeight: 'bold',
  },
  glowEffect: {
    position: 'absolute',
    width: BUTTON_SIZE * 1.2,
    height: BUTTON_SIZE * 1.2,
    borderRadius: (BUTTON_SIZE * 1.2) / 2,
    backgroundColor: COLORS.primary,
    opacity: 0.2,
    shadowColor: COLORS.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  rotatingElement: {
    position: 'absolute',
    top: BUTTON_SIZE * 0.2,
    right: BUTTON_SIZE * 0.2,
  },
  helperText: {
    position: 'absolute',
    bottom: -40,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  }
});

export default ClickerButton; 