import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar, SafeAreaView, Dimensions, Animated, PanResponder } from 'react-native';
import { Text, Card, Button, FAB, Divider, Badge } from 'react-native-paper';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import LinearGradient from '../components/LinearGradientFix';
import { useGame } from '../state/gameStore';
import { useAuth } from '../hooks/useAuth';
import ClickerButton from '../components/ClickerButton';
import SimpleUpgradeCard from '../components/SimpleUpgradeCard';
import ActiveBoosterIndicator from '../components/ActiveBoosterIndicator';
import { COLORS, UPGRADE_TYPES } from '../../config/settings';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

const { width, height } = Dimensions.get('window');
const DRAWER_HEIGHT = height * 0.7; // Înălțimea maximă a sertarului de upgrade-uri
const DRAWER_PEEK_HEIGHT = 70; // Cât de mult se vede din sertar când e închis

type HomeScreenProps = NativeStackScreenProps<any, 'Home'>;

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerAnim = useRef(new Animated.Value(0)).current;
  
  // State pentru autentificare
  const { username, userId, isAuthenticated, isOnlineMode } = useAuth();
  
  // State pentru joc
  const {
    views,
    clickValue,
    passiveViews,
    resetGame,
    incrementViews,
    upgrades,
    buyUpgrade,
    canBuyUpgrade,
    syncProgress,
    setUserId,
    setOnlineMode,
    activeBoosters,
  } = useGame();
  
  // Animație pentru deschiderea/închiderea sertarului
  const toggleDrawer = () => {
    const toValue = drawerOpen ? 0 : 1;
    
    Animated.spring(drawerAnim, {
      toValue,
      useNativeDriver: true,
      friction: 8,
      tension: 60,
    }).start();
    
    setDrawerOpen(!drawerOpen);
  };
  
  // Calculăm poziția sertarului
  const drawerTranslateY = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [DRAWER_HEIGHT - DRAWER_PEEK_HEIGHT, 0],
  });
  
  // PanResponder pentru gestiunea swipe-ului
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        // Limităm mișcarea între 0 și DRAWER_HEIGHT - DRAWER_PEEK_HEIGHT
        const newPosition = Math.min(
          Math.max(gestureState.dy, 0),
          DRAWER_HEIGHT - DRAWER_PEEK_HEIGHT
        );
        
        // Convertim pozitia în valoare pentru animație (inversă)
        const animValue = 1 - (newPosition / (DRAWER_HEIGHT - DRAWER_PEEK_HEIGHT));
        drawerAnim.setValue(animValue);
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Determinăm dacă sertarul trebuie deschis sau închis
        // în funcție de direcția și viteza gestului
        if (gestureState.vy > 0.5 || gestureState.dy > (DRAWER_HEIGHT - DRAWER_PEEK_HEIGHT) / 2) {
          // Închide sertarul
          Animated.spring(drawerAnim, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
            tension: 60,
          }).start();
          setDrawerOpen(false);
        } else {
          // Deschide sertarul
          Animated.spring(drawerAnim, {
            toValue: 1,
            useNativeDriver: true,
            friction: 8,
            tension: 60,
          }).start();
          setDrawerOpen(true);
        }
      },
    })
  ).current;
  
  // Sincronizare date utilizator
  useEffect(() => {
    if (userId && isOnlineMode) {
      // Setăm ID-ul utilizatorului în game store
      setUserId(userId);
      setOnlineMode(isOnlineMode);
    }
  }, [userId, isOnlineMode]);
  
  // Efect pentru sincronizarea datelor
  useEffect(() => {
    const interval = setInterval(() => {
      if (isOnlineMode && userId) {
        syncProgress();
      }
    }, 30000); // Sincronizare la 30 secunde
    
    return () => clearInterval(interval);
  }, [isOnlineMode, userId]);
  
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
  
  // Funcția pentru cumpărarea unui upgrade
  const handleBuyUpgrade = (type: string) => {
    buyUpgrade(type);
    
    // Sincronizare după upgrade semnificativ
    if (isOnlineMode && userId) {
      syncProgress();
    }
  };
  
  // Componente personalizate pentru badge-uri
  const OnlineBadge = () => (
    <View style={styles.onlineBadge}>
      <MaterialCommunityIcons name="cloud-check" size={10} color="#FFF" />
    </View>
  );
  
  const OfflineBadge = () => (
    <View style={styles.offlineBadge}>
      <MaterialCommunityIcons name="cloud-off-outline" size={10} color="#FFF" />
    </View>
  );
  
  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
      <ExpoStatusBar style="light" />
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', COLORS.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {/* Header cu profil și statistici */}
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
              <LinearGradient
                colors={[COLORS.gradient.start, COLORS.gradient.end]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.profileBorder}
              >
                <Image 
                  source={require('../../assets/default-avatar.png')} 
                  style={styles.profileImage}
                  defaultSource={require('../../assets/default-avatar.png')}
                />
              </LinearGradient>
              {isOnlineMode ? (
                <OnlineBadge />
              ) : (
                <OfflineBadge />
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.usernameText}>@{username || 'user'}</Text>
              <View style={styles.statsRow}>
                <FontAwesome5 name="eye" size={12} color={COLORS.textSecondary} />
                <Text style={styles.statsText}>{formatNumber(views)} vizionări</Text>
              </View>
            </View>
          </View>
          
          {/* Butoane de navigare */}
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => navigation.navigate('Leaderboard')}
            >
              <FontAwesome5 name="trophy" size={16} color={COLORS.secondary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => navigation.navigate('Boosters')}
            >
              <FontAwesome5 name="bolt" size={16} color={COLORS.booster} />
              {activeBoosters && activeBoosters.length > 0 && (
                <View style={styles.boosterIndicator} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <FontAwesome5 name="cog" size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Secțiunea de statistici */}
        <Card style={styles.statsCard}>
          <LinearGradient
            colors={[COLORS.card, 'rgba(0,0,0,0.8)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statsCardGradient}
          >
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatNumber(views)}</Text>
                <Text style={styles.statLabel}>Total Vizionări</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatNumber(clickValue)}</Text>
                <Text style={styles.statLabel}>Pe Tap</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatNumber(passiveViews)}/s</Text>
                <Text style={styles.statLabel}>Pasiv</Text>
              </View>
            </View>
            
            {/* Adăugăm indicatori pentru boostere active */}
            {activeBoosters && activeBoosters.length > 0 && (
              <>
                <Divider style={styles.miniDivider} />
                <View style={styles.activeBoosters}>
                  <Text style={styles.activeBoostersTitle}>Boostere active:</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.activeBoostersContent}
                  >
                    {activeBoosters.map(booster => (
                      <View key={booster.id} style={styles.activeBoosterItem}>
                        <ActiveBoosterIndicator 
                          type={booster.type}
                          endTime={booster.endTime}
                          size="small"
                        />
                      </View>
                    ))}
                  </ScrollView>
                </View>
              </>
            )}
          </LinearGradient>
        </Card>
        
        {/* Butonul central - acum poziționat mai jos */}
        <View style={styles.clickerSectionLower}>
          <ClickerButton onPress={incrementViews} clickValue={clickValue} />
        </View>
        
        {/* Sertar pentru upgrade-uri */}
        <Animated.View 
          style={[
            styles.upgradeDrawer,
            { 
              transform: [{ translateY: drawerTranslateY }],
              bottom: insets.bottom,
            }
          ]}
        >
          {/* Handle pentru tragere */}
          <View {...panResponder.panHandlers} style={styles.drawerHandle}>
            <View style={styles.handleBar} />
            
            <View style={styles.upgradesHeader}>
              <Text style={styles.upgradesTitle}>Îmbunătățește-ți conținutul</Text>
              <FontAwesome5 
                name={drawerOpen ? "chevron-down" : "chevron-up"} 
                size={14} 
                color={COLORS.secondary} 
              />
            </View>
          </View>
          
          {/* Conținutul sertarului */}
          <ScrollView 
            style={styles.upgradesContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.upgradesContent}
          >
            {Object.values(UPGRADE_TYPES).map((type) => (
              <SimpleUpgradeCard
                key={type}
                type={type}
                upgrades={upgrades}
                onBuy={() => handleBuyUpgrade(type)}
                canBuy={canBuyUpgrade(type)}
              />
            ))}
            
            {/* Spațiu suplimentar la final */}
            <View style={styles.bottomPadding} />
          </ScrollView>
        </Animated.View>
        
        {/* Buton de reset */}
        <FAB
          style={[styles.resetButton, { bottom: insets.bottom > 0 ? insets.bottom + DRAWER_PEEK_HEIGHT : DRAWER_PEEK_HEIGHT + 16 }]}
          icon="refresh"
          color={COLORS.text}
          onPress={() => {
            resetGame();
            if (isOnlineMode && userId) {
              syncProgress();
            }
          }}
          small
        />
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
    marginBottom: 10,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  profileBorder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.success,
    borderWidth: 1,
    borderColor: COLORS.background,
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.disabled,
    borderWidth: 1,
    borderColor: COLORS.background,
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flexDirection: 'column',
  },
  usernameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statsText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  syncButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  statsCard: {
    marginVertical: 10,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
  },
  statsCardGradient: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '70%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'center',
  },
  clickerSectionLower: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 100, // Mai mult spațiu în partea de jos
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 20, // Adăugăm padding pentru a compensa poziția deplasată
  },
  upgradeDrawer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: DRAWER_HEIGHT,
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  drawerHandle: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 10,
  },
  handleBar: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    marginBottom: 10,
  },
  upgradesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    width: '100%',
  },
  upgradesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  upgradesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  upgradesContent: {
    paddingBottom: 60, // Spațiu pentru butonul FAB
  },
  bottomPadding: {
    height: 40,
  },
  resetButton: {
    position: 'absolute',
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  boosterIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.booster,
    borderWidth: 1,
    borderColor: COLORS.background,
  },
  miniDivider: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 8,
  },
  activeBoosters: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  activeBoostersTitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  activeBoostersContent: {
    paddingRight: 8,
  },
  activeBoosterItem: {
    marginRight: 8,
  },
  noBoostersText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 4,
  },
});

export default HomeScreen; 