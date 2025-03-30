import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, Button, Avatar } from 'react-native-paper';
import { COLORS } from '../../config/settings';

interface UpgradeItemProps {
  name: string;
  description: string;
  price: number;
  level: number;
  canAfford: boolean;
  onBuy: () => void;
}

const UpgradeItem: React.FC<UpgradeItemProps> = ({
  name,
  description,
  price,
  level,
  canAfford,
  onBuy
}) => {
  // Formatăm numărul de vizualizări pentru afișare (fără zecimale)
  const formatNumber = (num: number): string => {
    if (num >= 1000000000) { // Miliarde
      return Math.floor(num / 1000000000) + 'B';
    } else if (num >= 1000000) { // Milioane
      return Math.floor(num / 1000000) + 'M';
    } else if (num >= 1000) { // Mii
      return Math.floor(num / 1000) + 'K';
    }
    return Math.floor(num).toString();
  };

  // Alege iconița în funcție de nume
  const getIcon = () => {
    if (name.includes('Telefon')) return 'cellphone';
    if (name.includes('Studio')) return 'movie-edit';
    if (name.includes('Echipă')) return 'account-group';
    return 'star';
  };

  return (
    <Card style={[styles.container, !canAfford && styles.disabledCard]}>
      <Card.Content style={styles.content}>
        <View style={styles.infoContainer}>
          <View style={styles.titleRow}>
            <Avatar.Icon 
              size={40} 
              icon={getIcon()} 
              color={COLORS.text}
              style={{
                backgroundColor: level > 0 ? COLORS.success : COLORS.secondary,
                opacity: !canAfford ? 0.6 : 1
              }}
            />
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{name}</Text>
              <Text style={styles.description}>{description}</Text>
            </View>
          </View>
          
          {level > 0 && (
            <View style={styles.levelContainer}>
              <Text style={styles.levelText}>Nivel: {level}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.actionContainer}>
          <View style={[styles.priceContainer, !canAfford && styles.priceDisabled]}>
            <Text style={styles.priceLabel}>Cost:</Text>
            <Text style={styles.price}>{formatNumber(price)}</Text>
          </View>
          <Button
            mode="contained"
            style={[styles.buyButton, !canAfford && styles.buyButtonDisabled]}
            labelStyle={styles.buttonLabel}
            disabled={!canAfford}
            onPress={onBuy}
            icon="basket"
          >
            {level > 0 ? 'UPGRADE' : 'CUMPĂRĂ'}
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    elevation: 3,
  },
  disabledCard: {
    opacity: 0.7,
  },
  content: {
    padding: 12,
  },
  infoContainer: {
    flex: 2,
    paddingRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleContainer: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  description: {
    fontSize: 12,
    color: COLORS.text,
    opacity: 0.7,
  },
  levelContainer: {
    marginTop: 8,
    marginLeft: 52, // Aliniază cu textul titlului
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: 'bold',
  },
  actionContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: COLORS.background,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  priceLabel: {
    fontSize: 14,
    color: COLORS.text,
    opacity: 0.8,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  priceDisabled: {
    opacity: 0.6,
  },
  buyButton: {
    backgroundColor: COLORS.secondary,
    width: '100%',
    borderRadius: 8,
  },
  buyButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default UpgradeItem; 