import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { COLORS, BOOSTER_DESCRIPTIONS } from '../../config/settings';
import { FontAwesome5 } from '@expo/vector-icons';

interface ActiveBoosterProps {
  type: string;
  endTime: number;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Componentă pentru afișarea unui booster activ
 * Poate fi utilizată în diferite locuri din aplicație cu dimensiuni diferite
 */
const ActiveBoosterIndicator: React.FC<ActiveBoosterProps> = ({ 
  type, 
  endTime,
  size = 'medium'
}) => {
  const [timeRemaining, setTimeRemaining] = React.useState<string>('');
  
  // Referință la booster
  const boosterConfig = BOOSTER_DESCRIPTIONS[type];
  
  // Dimensiunile în funcție de size
  const dimensions = {
    small: { height: 24, iconSize: 10, fontSize: 9, nameSize: 10 },
    medium: { height: 30, iconSize: 12, fontSize: 10, nameSize: 11 },
    large: { height: 40, iconSize: 16, fontSize: 12, nameSize: 14 }
  };
  
  // Actualizează timpul rămas
  React.useEffect(() => {
    const updateTime = () => {
      const remaining = Math.max(0, endTime - Date.now());
      const seconds = Math.floor(remaining / 1000);
      const minutes = Math.floor(seconds / 60);
      
      if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds % 60}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };
    
    // Actualizare inițială
    updateTime();
    
    // Actualizăm la fiecare secundă
    const interval = setInterval(updateTime, 1000);
    
    return () => clearInterval(interval);
  }, [endTime]);
  
  if (!boosterConfig) {
    console.error(`ActiveBoosterIndicator: Configurația pentru tipul "${type}" nu a fost găsită`);
    
    // Voi afișa un indicator generic pentru boosterele fără configurație
    return (
      <View style={[
        styles.container,
        { height: dimensions[size].height, backgroundColor: 'rgba(150,0,0,0.6)' }
      ]}>
        <View style={styles.iconContainer}>
          <FontAwesome5 
            name="question" 
            size={dimensions[size].iconSize} 
            color={COLORS.warning} 
          />
        </View>
        <Text style={[
          styles.text, 
          { fontSize: dimensions[size].fontSize }
        ]}>
          {timeRemaining}
        </Text>
      </View>
    );
  }
  
  // Pentru dimensiunea small afișăm doar iconița și timpul
  if (size === 'small') {
    return (
      <View style={[
        styles.container,
        { height: dimensions[size].height }
      ]}>
        <View style={styles.iconContainer}>
          <FontAwesome5 
            name={boosterConfig.icon || 'bolt'} 
            size={dimensions[size].iconSize} 
            color={boosterConfig.premium ? COLORS.premium : COLORS.primary} 
          />
        </View>
        <Text style={[
          styles.text, 
          { fontSize: dimensions[size].fontSize }
        ]}>
          {timeRemaining}
        </Text>
      </View>
    );
  }
  
  return (
    <View style={[
      styles.containerLarge,
      { minHeight: dimensions[size].height }
    ]}>
      <View style={styles.boosterHeader}>
        <View style={styles.iconContainerLarge}>
          <FontAwesome5 
            name={boosterConfig.icon || 'bolt'} 
            size={dimensions[size].iconSize} 
            color={boosterConfig.premium ? COLORS.premium : COLORS.primary} 
          />
        </View>
        <Text style={[
          styles.boosterName, 
          { fontSize: dimensions[size].nameSize }
        ]}>
          {boosterConfig.name}
        </Text>
      </View>
      
      <View style={styles.boosterInfo}>
        <Text style={[styles.effect, { fontSize: dimensions[size].fontSize }]}>
          {boosterConfig.description}
        </Text>
        <Text style={[
          styles.timeText, 
          { fontSize: dimensions[size].fontSize }
        ]}>
          Timp rămas: {timeRemaining}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  containerLarge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '100%',
    marginBottom: 8,
  },
  iconContainer: {
    marginRight: 4,
  },
  iconContainerLarge: {
    marginRight: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 6,
    borderRadius: 8,
  },
  text: {
    color: COLORS.text,
    fontWeight: 'bold',
  },
  boosterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  boosterName: {
    color: COLORS.text,
    fontWeight: 'bold',
    flex: 1,
  },
  boosterInfo: {
    marginLeft: 26, // Alinierea cu textul de la header
  },
  effect: {
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  timeText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  }
});

export default ActiveBoosterIndicator; 