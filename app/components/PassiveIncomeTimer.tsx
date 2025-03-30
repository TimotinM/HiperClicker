import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../config/settings';

interface PassiveIncomeTimerProps {
  passiveViews: number;
  onTick: (amount: number) => void;
}

const PASSIVE_INCOME_INTERVAL = 1000; // 1 secundă

const PassiveIncomeTimer: React.FC<PassiveIncomeTimerProps> = ({ passiveViews, onTick }) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());
  const appState = useRef<AppStateStatus>(AppState.currentState);
  
  // Funcție pentru adăugarea venitului pasiv
  const addPassiveIncome = () => {
    if (passiveViews <= 0) return;
    
    const now = Date.now();
    const timeDiff = now - lastUpdateRef.current;
    
    // Adăugăm venitul pasiv proporțional cu timpul trecut
    const incomeToAdd = (passiveViews * timeDiff) / 1000;
    
    if (incomeToAdd > 0) {
      onTick(incomeToAdd);
    }
    
    lastUpdateRef.current = now;
  };
  
  // Salvam timpul ultimei actualizări când aplicația intră în background
  const saveLastUpdateTime = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_UPDATE_TIME, lastUpdateRef.current.toString());
    } catch (error) {
      console.error('Eroare la salvarea timpului ultimei actualizări:', error);
    }
  };
  
  // Recuperăm timpul offline când aplicația revine în prim-plan
  const handleOfflineIncome = async () => {
    try {
      const lastUpdateTimeStr = await AsyncStorage.getItem(STORAGE_KEYS.LAST_UPDATE_TIME);
      
      if (lastUpdateTimeStr) {
        const lastUpdateTime = parseInt(lastUpdateTimeStr, 10);
        const now = Date.now();
        const timeDiffSeconds = (now - lastUpdateTime) / 1000;
        
        // Adăugăm venitul pasiv acumulat în timp offline (limitat la max 24 ore)
        if (timeDiffSeconds > 0 && passiveViews > 0) {
          const maxOfflineTimeSeconds = 24 * 60 * 60; // 24 ore
          const actualTimeDiff = Math.min(timeDiffSeconds, maxOfflineTimeSeconds);
          const offlineIncome = passiveViews * actualTimeDiff;
          
          if (offlineIncome > 0) {
            onTick(offlineIncome);
            console.log(`Venit pasiv offline adăugat: ${offlineIncome} pentru ${actualTimeDiff} secunde`);
          }
        }
      }
      
      // Actualizăm timpul de referință
      lastUpdateRef.current = Date.now();
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_UPDATE_TIME, lastUpdateRef.current.toString());
    } catch (error) {
      console.error('Eroare la procesarea venitului offline:', error);
    }
  };
  
  // Gestionăm schimbările de stare ale aplicației
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        // Aplicația intră în background
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        await saveLastUpdateTime();
      } else if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // Aplicația revine în prim-plan
        await handleOfflineIncome();
        startTimer();
      }
      
      appState.current = nextAppState;
    });
    
    return () => {
      subscription.remove();
    };
  }, [passiveViews]);
  
  // Funcție pentru pornirea timer-ului
  const startTimer = () => {
    if (!timerRef.current) {
      timerRef.current = setInterval(addPassiveIncome, PASSIVE_INCOME_INTERVAL);
    }
  };
  
  // Inițializăm timer-ul la încărcarea componentei
  useEffect(() => {
    handleOfflineIncome();
    startTimer();
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Actualizăm timer-ul când se schimbă rata de venit pasiv
  useEffect(() => {
    // Restart timer when passive views change
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (passiveViews > 0) {
      startTimer();
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [passiveViews]);
  
  // Componenta nu renderează nimic în UI
  return null;
};

export default PassiveIncomeTimer; 