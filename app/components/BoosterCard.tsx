import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Badge } from 'react-native-paper';
import { FontAwesome5 } from '@expo/vector-icons';
import { COLORS, BOOSTER_DESCRIPTIONS } from '../../config/settings';

interface BoosterCardProps {
  type: string;
  count: number;
  onBuy: () => void;
  onUse: () => void;
  canBuy: boolean;
}

const BoosterCard: React.FC<BoosterCardProps> = ({ 
  type, 
  count, 
  onBuy, 
  onUse, 
  canBuy 
}) => {
  const booster = BOOSTER_DESCRIPTIONS[type];
  
  if (!booster) return null;
  
  return (
    <Card style={styles.card}>
      <Card.Content style={styles.content}>
        <View style={styles.leftSection}>
          <View style={[
            styles.iconContainer,
            booster.premium ? styles.premiumIcon : styles.standardIcon
          ]}>
            <FontAwesome5 
              name={booster.icon || 'bolt'} 
              size={18} 
              color={booster.premium ? COLORS.premium : COLORS.text} 
            />
          </View>
          
          <View style={styles.infoContainer}>
            <Text style={styles.name}>{booster.name}</Text>
            <Text style={styles.description}>{booster.description}</Text>
            
            <View style={styles.statsRow}>
              {booster.multiplier && (
                <View style={styles.stat}>
                  <FontAwesome5 name="fire" size={10} color={COLORS.secondary} />
                  <Text style={styles.statText}>x{booster.multiplier}</Text>
                </View>
              )}
              
              <View style={styles.stat}>
                <FontAwesome5 name="clock" size={10} color={COLORS.secondary} />
                <Text style={styles.statText}>{booster.duration / 1000}s</Text>
              </View>
              
              <View style={styles.stat}>
                <FontAwesome5 name="eye" size={10} color={COLORS.primary} />
                <Text style={styles.statText}>{booster.price}</Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.rightSection}>
          {count > 0 && (
            <Badge style={styles.countBadge}>{count}</Badge>
          )}
          
          <View style={styles.buttons}>
            {count > 0 ? (
              <Button 
                mode="contained" 
                onPress={onUse}
                style={styles.useButton}
                labelStyle={styles.buttonLabel}
                uppercase={false}
              >
                Folosește
              </Button>
            ) : (
              <Button 
                mode="contained" 
                onPress={onBuy}
                disabled={!canBuy}
                style={[
                  styles.buyButton,
                  !canBuy && styles.disabledButton
                ]}
                labelStyle={styles.buttonLabel}
                uppercase={false}
              >
                Cumpără
              </Button>
            )}
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  leftSection: {
    flexDirection: 'row',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  standardIcon: {
    backgroundColor: 'rgba(156, 39, 176, 0.3)',
    borderWidth: 1,
    borderColor: COLORS.booster,
  },
  premiumIcon: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderWidth: 1,
    borderColor: COLORS.premium,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  description: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  statText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  countBadge: {
    backgroundColor: COLORS.primary,
    color: COLORS.text,
    marginBottom: 8,
  },
  buttons: {
    flexDirection: 'row',
  },
  useButton: {
    backgroundColor: COLORS.booster,
    minWidth: 80,
  },
  buyButton: {
    backgroundColor: COLORS.primary,
    minWidth: 80,
  },
  disabledButton: {
    backgroundColor: COLORS.disabled,
  },
  buttonLabel: {
    fontSize: 12,
  },
});

export default BoosterCard; 