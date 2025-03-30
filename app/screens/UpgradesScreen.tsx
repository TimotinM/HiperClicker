import React from 'react';
import { StyleSheet, ScrollView, SafeAreaView, StatusBar, View } from 'react-native';
import { Text, Button, Surface, Divider } from 'react-native-paper';
import { useGame } from '../state/gameStore';
import { COLORS, UPGRADE_TYPES } from '../../config/settings';
import UpgradeItem from '../components/UpgradeItem';
import StatsDisplay from '../components/StatsDisplay';

// Descrierile pentru fiecare tip de upgrade
const UPGRADE_DESCRIPTIONS = {
  [UPGRADE_TYPES.CLICK_VALUE]: {
    name: 'Telefon mai bun',
    description: '+50% vizualizări per tap',
  },
  [UPGRADE_TYPES.PASSIVE_INCOME]: {
    name: 'Studio de editare',
    description: '+5 vizualizări/secundă',
  },
  [UPGRADE_TYPES.CRITICAL_CHANCE]: {
    name: 'Specialist în SEO',
    description: 'Crește șansa de tap critic',
  },
  [UPGRADE_TYPES.CRITICAL_MULTIPLIER]: {
    name: 'Echipă de marketing',
    description: 'Crește valoarea tap-urilor critice',
  },
};

const UpgradesScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  // Accesăm starea jocului
  const { 
    views, 
    clickValue, 
    passiveViews, 
    totalClicks,
    criticalTaps,
    buyUpgrade, 
    upgrades,
    canBuyUpgrade,
  } = useGame();
  
  // Calculăm costul pentru fiecare upgrade
  const getUpgradeCost = (upgradeId: string) => {
    const upgrade = upgrades[upgradeId];
    if (!upgrade) return 0;
    
    return Math.floor(upgrade.basePrice * Math.pow(upgrade.priceMultiplier, upgrade.level));
  };
  
  // Array cu upgrade-urile disponibile în joc
  const availableUpgrades = Object.entries(UPGRADE_DESCRIPTIONS).map(([upgradeId, info]) => ({
    id: upgradeId,
    name: info.name,
    description: info.description,
    level: upgrades[upgradeId]?.level || 0,
    price: getUpgradeCost(upgradeId),
  }));
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.background} barStyle="light-content" />
      
      <Surface style={styles.header} elevation={4}>
        <Button
          mode="contained"
          icon="arrow-left"
          onPress={onBack}
          style={styles.backButton}
          labelStyle={styles.backButtonLabel}
        >
          ÎNAPOI
        </Button>
        <Text style={styles.title}>UPGRADE-URI</Text>
        <View style={styles.placeholderButton} />
      </Surface>
      
      <StatsDisplay 
        views={views} 
        clickValue={clickValue} 
        passiveViews={passiveViews} 
        totalClicks={totalClicks}
        criticalTaps={criticalTaps}
      />
      
      <View style={styles.upgradeHeaderContainer}>
        <View style={styles.headerLine} />
        <Text style={styles.upgradeHeader}>Îmbunătățiri disponibile</Text>
        <View style={styles.headerLine} />
      </View>
      
      <ScrollView style={styles.upgradesContainer}>
        {availableUpgrades.map((upgrade) => (
          <UpgradeItem
            key={upgrade.id}
            name={upgrade.name}
            description={upgrade.description}
            price={upgrade.price}
            level={upgrade.level}
            canAfford={canBuyUpgrade(upgrade.id)}
            onBuy={() => buyUpgrade(upgrade.id)}
          />
        ))}
      </ScrollView>
      
      <Button
        mode="contained"
        icon="close"
        onPress={onBack}
        style={styles.closeButton}
      >
        ÎNCHIDE
      </Button>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: COLORS.card,
    elevation: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 10,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    marginLeft: 0,
    paddingHorizontal: 5,
  },
  backButtonLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  placeholderButton: {
    width: 80,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    letterSpacing: 1,
  },
  upgradeHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  headerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  upgradeHeader: {
    fontSize: 16,
    color: COLORS.text,
    marginHorizontal: 8,
    opacity: 0.7,
    fontWeight: 'bold',
  },
  upgradesContainer: {
    flex: 1,
  },
  closeButton: {
    backgroundColor: COLORS.primary,
    width: '100%',
    borderRadius: 8,
    marginTop: 16,
    marginHorizontal: 16,
    paddingVertical: 12,
  },
});

export default UpgradesScreen; 