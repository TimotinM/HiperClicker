import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { FontAwesome5 } from '@expo/vector-icons';
import { COLORS, UPGRADE_DESCRIPTIONS } from '../../config/settings';
import { UpgradeState } from '../state/gameStore';

interface UpgradeCardProps {
  type: string;
  upgrades: Record<string, UpgradeState>;
  onBuy: () => void;
  canBuy: boolean;
}

const SimpleUpgradeCard: React.FC<UpgradeCardProps> = ({ type, upgrades, onBuy, canBuy }) => {
  const upgrade = upgrades[type];
  
  if (!upgrade) return null;
  
  // Obținem descrierea upgrade-ului
  const description = UPGRADE_DESCRIPTIONS[type];
  
  // Calculăm prețul de cumpărare
  const nextPrice = Math.floor(upgrade.basePrice * Math.pow(upgrade.priceMultiplier, upgrade.level));
  
  return (
    <Card style={[styles.card, !canBuy && styles.disabledCard]} elevation={2}>
      <TouchableOpacity 
        style={styles.cardContent}
        onPress={onBuy}
        disabled={!canBuy}
      >
        <View style={styles.infoContainer}>
          <Text style={styles.title}>{description?.name || type}</Text>
          <Text style={styles.description}>Nivel: {upgrade.level}</Text>
          <Text style={styles.priceText}>Cost: {nextPrice}</Text>
        </View>
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
    overflow: 'hidden',
  },
  disabledCard: {
    borderLeftColor: COLORS.disabled,
    opacity: 0.8,
  },
  cardContent: {
    padding: 12,
  },
  infoContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  priceText: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default SimpleUpgradeCard; 