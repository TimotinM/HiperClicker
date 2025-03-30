import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider, DefaultTheme as PaperDefaultTheme } from 'react-native-paper';
import HomeScreen from './app/screens/HomeScreen';
import SettingsScreen from './app/screens/SettingsScreen';
import AuthScreen from './app/screens/AuthScreen';
import LeaderboardScreen from './app/screens/LeaderboardScreen';
import BoostersScreen from './app/screens/BoostersScreen';
import { useAuth } from './app/hooks/useAuth';
import { useGame } from './app/state/gameStore';
import { COLORS, STORAGE_KEYS } from './config/settings';
import { initAds } from './app/utils/adService';
import mobileAds from './app/utils/adService';

// Definim tema pentru react-native-paper
const paperTheme = {
  ...PaperDefaultTheme,
  dark: true,
  colors: {
    ...PaperDefaultTheme.colors,
    primary: COLORS.primary,
    accent: COLORS.secondary,
    background: COLORS.background,
    surface: COLORS.card,
    text: COLORS.text,
    placeholder: COLORS.textSecondary,
    error: COLORS.notification,
    onSurface: COLORS.text,
    disabled: COLORS.disabled,
    backdrop: 'rgba(0,0,0,0.5)',
  },
};

// Definim tipul pentru stiva de navigare
type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
  Auth: undefined;
  Leaderboard: undefined;
  Boosters: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Funcție simplă pentru a calcula venitul pasiv
function calculatePassiveIncome(passiveViews: number) {
  return (amount: number) => {
    // Logica pentru calculul venitului pasiv
    console.log(`Adăugat venit pasiv: ${amount} vizualizări`);
  };
}

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [adsInitialized, setAdsInitialized] = useState(false);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { setUserId, passiveViews, addPassiveViews, updateActiveBoosters } = useGame();

  // Inițializăm aplicația și încărcăm datele salvate
  useEffect(() => {
    const initApp = async () => {
      try {
        // Încărcăm datele din storage
        await AsyncStorage.getItem(STORAGE_KEYS.USER_SESSION);
        
        // Inițializăm AdMob
        await mobileAds()
          .initialize()
          .then((adapterStatuses: Map<string, any>) => {
            // Verificăm dacă inițializarea a reușit
            const statusArray = Array.from(adapterStatuses.entries());
            if (statusArray.length > 0) {
              // Toate adaptoarele sunt inițializate
              setAdsInitialized(true);
              // Preîncărcăm reclamele
              initAds();
            }
          });
        
        setIsReady(true);
      } catch (error) {
        console.error('Eroare la inițializarea aplicației:', error);
        setIsReady(true);
      }
    };

    initApp();
  }, []);

  // Efect pentru adăugarea venitului pasiv la fiecare jumătate de secundă
  useEffect(() => {
    if (!isAuthenticated || passiveViews <= 0) return;

    console.log(`Configurare venit pasiv: ${passiveViews} vizualizări pe minut`);
    
    // Actualizăm mai des pentru o experiență mai fluidă
    const interval = setInterval(() => {
      // Calculăm mai exact rata pe secundă și o împărțim la 2 pentru actualizare la fiecare 500ms
      const amountPerTick = passiveViews / 60 / 2; 
      
      // Adăugăm vizualizările pasive
      addPassiveViews(amountPerTick);
    }, 500);

    return () => clearInterval(interval);
  }, [isAuthenticated, passiveViews, addPassiveViews]);
  
  // Efect pentru actualizarea boosterelor active
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Actualizăm boosterele la fiecare secundă pentru a fi mai responsive
    const interval = setInterval(() => {
      updateActiveBoosters();
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, updateActiveBoosters]);

  // Definim temă personalizată pentru navigare
  const navTheme: Theme = {
    dark: true,
    colors: {
      primary: COLORS.primary,
      background: COLORS.background,
      card: COLORS.card,
      text: COLORS.text,
      border: COLORS.border,
      notification: COLORS.notification,
    },
    fonts: {
      regular: {
        fontFamily: 'System',
        fontWeight: '400',
      },
      medium: {
        fontFamily: 'System',
        fontWeight: '500',
      },
      bold: {
        fontFamily: 'System',
        fontWeight: '700',
      },
      heavy: {
        fontFamily: 'System',
        fontWeight: '900',
      },
    },
  };

  // Nu afișăm nimic până când nu se încarcă datele
  if (!isReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <StatusBar style="light" />
        <NavigationContainer theme={navTheme}>
          {!isAuthenticated ? (
            // Ecranul de autentificare
            <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
              <Stack.Screen name="Auth" component={AuthScreen} />
            </Stack.Navigator>
          ) : (
            // Ecranele principale după autentificare
            <Stack.Navigator 
              initialRouteName="Home"
              screenOptions={{
                headerStyle: {
                  backgroundColor: COLORS.card,
                },
                headerTintColor: COLORS.text,
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen 
                name="Home" 
                component={HomeScreen as any} 
                options={{ 
                  headerShown: false 
                }}
              />
              <Stack.Screen 
                name="Settings" 
                component={SettingsScreen as any} 
                options={{ 
                  title: 'Setări' 
                }}
              />
              <Stack.Screen 
                name="Leaderboard" 
                component={LeaderboardScreen as any} 
                options={{ 
                  title: 'Clasament' 
                }}
              />
              <Stack.Screen 
                name="Boosters" 
                component={BoostersScreen as any} 
                options={{ 
                  title: 'Boostere și Bonusuri',
                  animation: 'slide_from_bottom'
                }}
              />
            </Stack.Navigator>
          )}
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
