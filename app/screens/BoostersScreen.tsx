import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Text, Card, Button, Snackbar } from 'react-native-paper';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Crypto from 'expo-crypto';
import { useGame } from '../state/gameStore';
import BoosterCard from '../components/BoosterCard';
import ActiveBoosterIndicator from '../components/ActiveBoosterIndicator';
import { showRewardedAd } from '../utils/adService';
import { COLORS, BOOSTER_TYPES, BOOSTER_DESCRIPTIONS, ADMOB_CONFIG } from '../../config/settings';

const BoostersScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  const { 
    views,
    activeBoosters,
    boosterInventory,
    buyBooster,
    canBuyBooster,
    useBoosterFromInventory,
    getBoosterCount,
    addMultiplier,
    updateActiveBoosters,
    addAIContentGenerator
  } = useGame();
  
  // Actualizăm boosterele active mai frecvent în acest ecran
  useEffect(() => {
    console.log('Boosters Screen - Active Boosters:', activeBoosters);
    
    // Actualizăm boosterele la fiecare secundă în acest ecran
    const interval = setInterval(() => {
      updateActiveBoosters();
    }, 1000);
    
    return () => clearInterval(interval);
  }, [updateActiveBoosters, activeBoosters]);
  
  // Funcție pentru afișarea unui mesaj Snackbar
  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };
  
  // Funcție pentru formatarea numerelor mari
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return Math.floor(num).toString();
  };
  
  // Funcție pentru cumpărarea unui booster
  const handleBuyBooster = (type: string) => {
    if (canBuyBooster(type)) {
      const success = buyBooster(type);
      if (success) {
        showSnackbar(`Ai cumpărat un ${BOOSTER_DESCRIPTIONS[type].name}!`);
      } else {
        showSnackbar('Nu ai suficiente vizualizări!');
      }
    } else {
      showSnackbar('Nu ai suficiente vizualizări pentru a cumpăra acest booster!');
    }
  };
  
  // Funcție pentru utilizarea unui booster
  const handleUseBooster = (type: string) => {
    if (getBoosterCount(type) > 0) {
      const success = useBoosterFromInventory(type);
      if (success) {
        showSnackbar(`Ai activat ${BOOSTER_DESCRIPTIONS[type].name}!`);
      } else {
        showSnackbar('Nu ai niciun booster de acest tip!');
      }
    } else {
      showSnackbar('Nu ai niciun booster de acest tip!');
    }
  };
  
  // Funcție pentru a obține un booster gratuit prin vizionarea unei reclame
  const handleWatchAd = async () => {
    setLoading(true);
    
    try {
      console.log('Începe vizionarea reclamei...');
      
      // Afișăm reclama cu recompensă
      const result = await showRewardedAd();
      console.log('Rezultat reclamă:', result);
      
      if (result.success) {
        // Utilizatorul a vizionat reclama complet
        console.log('Reclamă vizionată cu succes!');
        
        // Verificăm dacă tipul este direct views_multiplier
        if (result.type === 'views_multiplier') {
          // Dacă avem un rezultat direct cu tip views_multiplier
          const duration = ADMOB_CONFIG.REWARDED_DURATION;
          const multiplier = result.amount || ADMOB_CONFIG.REWARDED_VIEWS_MULTIPLIER;
          
          console.log('Adăugăm multiplicator direct:', { multiplier, duration });
          
          // Adăugăm multiplicatorul
          addMultiplier(multiplier, duration);
          
          // Verificăm dacă s-a adăugat boosterul
          console.log('Boostere active după adăugare:', activeBoosters);
          
          showSnackbar(`Felicitări! Ai activat un multiplicator de x${multiplier} pentru ${duration / 1000} secunde!`);
        } else {
          // Altfel, aplicăm logica anterioară
          const randomValue = Math.random();
          console.log('Random value pentru alegerea recompensei:', randomValue);
          
          // Adaugăm o șansă de a primi un AI Content Generator
          if (randomValue < 0.3) { // Șansă de 30% pentru AI Generator
            console.log('Adăugăm AI Content Generator:');
            
            // Obținem configurația boosterului
            const config = BOOSTER_DESCRIPTIONS[BOOSTER_TYPES.AI_CONTENT_GENERATOR];
            
            // Adăugăm un nou booster AI Content Generator
            addAIContentGenerator(config.duration);
            
            showSnackbar(`Felicitări! Ai activat un AI Content Generator pentru ${config.duration / 1000} secunde!`);
          } else if (randomValue < ADMOB_CONFIG.FREE_BOOSTER_CHANCE + 0.3) {
            // Primește un booster aleatoriu
            const boosterTypes: string[] = Object.values(BOOSTER_TYPES).filter(type => 
              !BOOSTER_DESCRIPTIONS[type as string].premium
            );
            
            const randomIndex = Math.floor(Math.random() * boosterTypes.length);
            const randomBoosterType = boosterTypes[randomIndex];
            
            console.log('Adăugăm booster aleatoriu:', randomBoosterType);
            
            // Adăugăm un booster în inventar direct
            const success = buyBooster(randomBoosterType);
            if (success) {
              showSnackbar(`Felicitări! Ai primit un ${BOOSTER_DESCRIPTIONS[randomBoosterType].name} gratuit!`);
            }
          } else {
            // Primește un multiplicator de vizualizări temporar
            const duration = ADMOB_CONFIG.REWARDED_DURATION;
            const multiplier = ADMOB_CONFIG.REWARDED_VIEWS_MULTIPLIER;
            
            console.log('Adăugăm multiplicator aleatoriu:', { multiplier, duration });
            
            // Adăugăm multiplicatorul
            addMultiplier(multiplier, duration);
            
            // Verificăm dacă s-a adăugat boosterul
            console.log('Boostere active după adăugare:', activeBoosters);
            
            showSnackbar(`Felicitări! Ai activat un multiplicator de x${multiplier} pentru ${duration / 1000} secunde!`);
          }
        }
      } else {
        console.log('Reclamă nefinalizată');
        showSnackbar('Trebuie să privești reclama până la capăt pentru a primi recompensa.');
      }
    } catch (error) {
      console.error('Eroare la afișarea reclamei:', error);
      showSnackbar('A apărut o eroare. Încearcă din nou mai târziu.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', COLORS.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {/* Header cu balanța de puncte */}
        <View style={styles.header}>
          <Text style={styles.title}>Boostere și Bonusuri</Text>
          <View style={styles.balanceContainer}>
            <FontAwesome5 name="eye" size={16} color={COLORS.primary} />
            <Text style={styles.balanceText}>{formatNumber(views)}</Text>
          </View>
        </View>
        
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Secțiune pentru boostere active */}
          <Card style={styles.card}>
            <Card.Title title="Boostere Active" />
            <Card.Content>
              {activeBoosters && activeBoosters.length > 0 ? (
                <View style={styles.activeBoosters}>
                  {activeBoosters.map(booster => (
                    <ActiveBoosterIndicator 
                      key={booster.id}
                      type={booster.type}
                      endTime={booster.endTime}
                      size="large"
                    />
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>Nu ai niciun booster activ momentan.</Text>
              )}
            </Card.Content>
          </Card>
          
          {/* Boostere disponibile pentru cumpărare */}
          <Card style={styles.card}>
            <Card.Title title="Boostere Disponibile" />
            <Card.Content>
              {(Object.values(BOOSTER_TYPES) as string[])
                .filter(type => !BOOSTER_DESCRIPTIONS[type].premium)
                .map(type => (
                  <BoosterCard
                    key={type}
                    type={type}
                    count={getBoosterCount(type)}
                    onBuy={() => handleBuyBooster(type)}
                    onUse={() => handleUseBooster(type)}
                    canBuy={canBuyBooster(type)}
                  />
                ))}
            </Card.Content>
          </Card>
          
          {/* Boostere premium */}
          <Card style={styles.card}>
            <Card.Title 
              title="Boostere Premium" 
              right={(props) => (
                <View style={styles.premiumBadge}>
                  <FontAwesome5 name="crown" size={14} color={COLORS.premium} />
                </View>
              )} 
            />
            <Card.Content>
              {(Object.values(BOOSTER_TYPES) as string[])
                .filter(type => BOOSTER_DESCRIPTIONS[type].premium)
                .map(type => (
                  <BoosterCard
                    key={type}
                    type={type}
                    count={getBoosterCount(type)}
                    onBuy={() => handleBuyBooster(type)}
                    onUse={() => handleUseBooster(type)}
                    canBuy={canBuyBooster(type)}
                  />
                ))}
            </Card.Content>
          </Card>
          
          {/* Buton pentru a viziona o reclamă și primi un booster gratuit */}
          <Card style={styles.card}>
            <Card.Title title="Boostere Gratuite" />
            <Card.Content>
              <Text style={styles.adText}>
                Vizionează o reclamă pentru a primi un booster gratuit sau un multiplicator temporar de x2!
              </Text>
              <Button 
                mode="contained" 
                style={styles.adButton}
                loading={loading}
                onPress={handleWatchAd}
                icon="play"
              >
                Vizionează Reclamă
              </Button>
            </Card.Content>
          </Card>
          
          {/* Misiuni zilnice - vor fi implementate ulterior */}
          <Card style={styles.card}>
            <Card.Title title="Misiuni Zilnice" subtitle="În curând" />
            <Card.Content>
              <Text style={styles.comingSoonText}>
                Misiunile zilnice vor fi disponibile în curând. Revino pentru recompense zilnice!
              </Text>
            </Card.Content>
          </Card>
          
          {/* Spațiu la final pentru a nu se suprapune cu FAB */}
          <View style={{ height: 70 }} />
        </ScrollView>
        
        {/* Snackbar pentru notificări */}
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          style={styles.snackbar}
        >
          {snackbarMessage}
        </Snackbar>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  balanceText: {
    color: COLORS.text,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  card: {
    marginBottom: 16,
    backgroundColor: COLORS.card,
    borderRadius: 12,
  },
  activeBoosters: {
    marginTop: 8,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 16,
  },
  premiumBadge: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 16,
  },
  adText: {
    color: COLORS.text,
    marginBottom: 16,
  },
  adButton: {
    backgroundColor: COLORS.booster,
    marginVertical: 8,
  },
  comingSoonText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginVertical: 16,
  },
  snackbar: {
    backgroundColor: COLORS.card,
    marginBottom: 16,
  },
});

export default BoostersScreen; 