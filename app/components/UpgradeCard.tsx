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

const UpgradeCard: React.FC<UpgradeCardProps> = ({ type, upgrades, onBuy, canBuy }) => {
  const upgrade = upgrades[type];
  
  if (!upgrade) return null;
  
  // Obținem descrierea upgrade-ului
  const description = UPGRADE_DESCRIPTIONS[type];
  
  // Calculăm prețul de cumpărare
  const nextPrice = Math.floor(upgrade.basePrice * Math.pow(upgrade.priceMultiplier, upgrade.level));
  
  // Obținem iconița corespunzătoare tipului de upgrade
  const getIcon = () => {
    switch (type) {
      case 'CLICK_VALUE':
        return 'hand-pointer';
      case 'PASSIVE_INCOME':
        return 'clock';
      case 'CRITICAL_CHANCE':
        return 'bolt';
      case 'CRITICAL_MULTIPLIER':
        return 'star';
      default:
        return 'arrow-up';
    }
  };
  
  return (
    <Card style={[styles.card, !canBuy && styles.disabledCard]} elevation={2}>
      <TouchableOpacity 
        style={styles.cardContent}
        onPress={onBuy}
        disabled={!canBuy}
      >
        <View style={styles.iconContainer}>
          <FontAwesome5 
            name={getIcon()} 
            size={24} 
            color={canBuy ? COLORS.secondary : COLORS.disabled} 
          />
        </View>
        
        <View style={styles.infoContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{description?.name || type}</Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Niv. {upgrade.level}</Text>
            </View>
          </View>
          
          <Text style={styles.description} numberOfLines={2}>
            {description?.description || 'Îmbunătățește caracteristica.'}
          </Text>
          
          <View style={styles.statsRow}>
            <Text style={styles.currentValue}>
              Curent: {type === 'PASSIVE_INCOME' ? `${upgrade.value.toFixed(1)}/s` : upgrade.value.toFixed(1)}
            </Text>
            <Text style={styles.nextValue}>
              → {type === 'PASSIVE_INCOME' ? `${(upgrade.value + upgrade.increment).toFixed(1)}/s` : (upgrade.value + upgrade.increment).toFixed(1)}
            </Text>
          </View>
        </View>
        
        <View style={[styles.priceContainer, !canBuy && styles.disabledPrice]}>
          <Text style={styles.priceText}>{nextPrice}</Text>
          <FontAwesome5 name="eye" size={12} color={COLORS.text} style={styles.priceIcon} />
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
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginRight: 8,
  },
  levelBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  levelText: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: 'bold',
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
  currentValue: {
    fontSize: 12,
    color: COLORS.text,
    marginRight: 6,
  },
  nextValue: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: 'bold',
  },
  priceContainer: {
    height: 30,
    minWidth: 70,
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledPrice: {
    backgroundColor: COLORS.disabled,
  },
  priceText: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 4,
  },
  priceIcon: {
    marginTop: 1,
  },
});

export default UpgradeCard; 