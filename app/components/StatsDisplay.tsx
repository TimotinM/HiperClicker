import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Card, ProgressBar } from 'react-native-paper';
import { COLORS } from '../../config/settings';

interface StatsDisplayProps {
  views: number;
  clickValue: number;
  passiveViews?: number;
  criticalTaps?: number;
  totalClicks?: number;
}

const StatsDisplay: React.FC<StatsDisplayProps> = ({ 
  views, 
  clickValue, 
  passiveViews = 0, 
  criticalTaps = 0, 
  totalClicks = 0 
}) => {
  // Formatăm numărul de vizualizări pentru afișare, fără zecimale
  const formatNumber = (num: number): string => {
    if (num >= 1000000000) { // Miliarde
      return Math.floor(num / 1000000000) + 'B';
    } else if (num >= 1000000) { // Milioane
      return Math.floor(num / 1000000) + 'M';
    } else if (num >= 1000) { // Mii
      return Math.floor(num / 1000) + 'K';
    } else {
      // Afișăm numărul întreg
      return Math.floor(num).toString();
    }
  };
  
  // Calculăm rata de critical tap
  const criticalRate = totalClicks > 0 
    ? ((criticalTaps / totalClicks) * 100).toFixed(1) 
    : '0.0';

  return (
    <Card style={styles.container}>
      <Card.Content style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>VIZUALIZĂRI</Text>
            <View style={styles.valueWrapper}>
              <Text style={styles.statValue}>{formatNumber(views)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>PER TAP</Text>
            <View style={styles.valueWrapper}>
              <Text style={styles.statValue}>{formatNumber(clickValue)}</Text>
            </View>
          </View>
        </View>
        
        {passiveViews > 0 && (
          <View style={styles.passiveContainer}>
            <Text style={styles.passiveLabel}>
              Vizualizări pasive: <Text style={styles.passiveValue}>{formatNumber(passiveViews)}</Text>/sec
            </Text>
          </View>
        )}
        
        {totalClicks > 0 && (
          <View style={styles.criticalContainer}>
            <Text style={styles.criticalLabel}>Critical rate: {criticalRate}%</Text>
            <ProgressBar 
              progress={totalClicks > 0 ? criticalTaps / totalClicks : 0} 
              color={COLORS.critical} 
              style={styles.criticalBar}
            />
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '90%',
    marginVertical: 16,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    elevation: 4,
  },
  content: {
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.text,
    opacity: 0.7,
    marginBottom: 4,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  valueWrapper: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  divider: {
    width: 1,
    height: '80%',
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },
  passiveContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  passiveLabel: {
    fontSize: 14,
    color: COLORS.text,
    opacity: 0.8,
  },
  passiveValue: {
    fontWeight: 'bold',
    color: COLORS.success,
  },
  criticalContainer: {
    marginTop: 8,
  },
  criticalLabel: {
    fontSize: 12,
    color: COLORS.text,
    opacity: 0.7,
    marginBottom: 4,
  },
  criticalBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
  },
});

export default StatsDisplay; 