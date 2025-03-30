import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GAME_SETTINGS, UPGRADE_TYPES, STORAGE_KEYS, BOOSTER_DESCRIPTIONS, BOOSTER_TYPES } from '../../config/settings';
import supabase, { saveUserProgress, saveUserUpgrades, getUserProgress, getUserUpgrades, saveUserBoosters, getUserBoosters } from '../utils/supabase';
import * as Crypto from 'expo-crypto';

// Interfața pentru starea unui upgrade
export interface UpgradeState {
  level: number;
  value: number;
  basePrice: number;
  priceMultiplier: number;
  increment: number;
}

// Interfața pentru starea jocului
interface GameState {
  // Date utilizator
  userId: string | null;
  isOnline: boolean;
  isOnlineMode: boolean; // Proprietate pentru a verifica dacă jocul este în modul online
  
  // Statistici de joc
  views: number;
  clickValue: number;
  passiveViews: number;
  totalClicks: number;
  criticalTaps: number;
  
  // Upgrade-uri - noul format cu valori specifice
  upgrades: Record<string, UpgradeState>;
  
  // Boostere
  activeBoosters: Array<{id: string, type: string, endTime: number, multiplier?: number}>;
  boosterInventory: Record<string, number>;
  
  // Acțiuni
  incrementViews: () => void;
  upgradeClickValue: () => void;
  addPassiveViews: (amount: number) => void;
  resetGame: () => void;
  
  // Gestionare utilizator
  setUserId: (id: string | null) => void;
  setOnlineMode: (isOnline: boolean) => void;
  setUpgrades: (upgrades: Record<string, UpgradeState>) => void;
  
  // Funcționalități de persistență
  saveGame: () => Promise<void>;
  loadGame: () => Promise<void>;
  
  // Funcționalități de sincronizare cu backend
  syncProgress: () => Promise<boolean>;
  loadFromServer: () => Promise<boolean>;
  
  // Upgrade-uri
  canBuyUpgrade: (upgradeType: string) => boolean;
  buyUpgrade: (upgradeType: string) => void;
  
  // Boostere
  updateActiveBoosters: () => void;
  getBoosterCount: (type: string) => number;
  canBuyBooster: (type: string) => boolean;
  buyBooster: (type: string) => boolean;
  useBoosterFromInventory: (type: string) => boolean;
  
  // Adăugă un multiplicator temporar
  addMultiplier: (multiplier: number, duration: number) => void;
  
  // Adaugă un booster de tip AI Content Generator
  addAIContentGenerator: (duration: number) => void;
}

// Configurația inițială pentru upgrade-uri
const INITIAL_UPGRADES: Record<string, UpgradeState> = {
  [UPGRADE_TYPES.CLICK_VALUE]: {
    level: 0,
    value: GAME_SETTINGS.INITIAL_CLICK_VALUE,
    basePrice: 100,
    priceMultiplier: 1.5,
    increment: 1.0,
  },
  [UPGRADE_TYPES.PASSIVE_INCOME]: {
    level: 0,
    value: GAME_SETTINGS.INITIAL_PASSIVE_VIEWS,
    basePrice: 250,
    priceMultiplier: 1.8,
    increment: 0.5,
  },
  [UPGRADE_TYPES.CRITICAL_CHANCE]: {
    level: 0,
    value: GAME_SETTINGS.CRITICAL_CHANCE * 100, // Procentaj 0-100
    basePrice: 500,
    priceMultiplier: 2.0,
    increment: 1.0, // +1% șansă
  },
  [UPGRADE_TYPES.CRITICAL_MULTIPLIER]: {
    level: 0,
    value: GAME_SETTINGS.CRITICAL_MULTIPLIER,
    basePrice: 1000,
    priceMultiplier: 2.5,
    increment: 0.5, // +0.5x multiplicator
  },
};

// Creăm store-ul pentru starea jocului
const useGameStore = create<GameState>((set, get) => ({
  // Date utilizator
  userId: null,
  isOnline: false,
  isOnlineMode: false,
  
  // Statistici inițiale
  views: GAME_SETTINGS.INITIAL_VIEWS,
  clickValue: GAME_SETTINGS.INITIAL_CLICK_VALUE,
  passiveViews: GAME_SETTINGS.INITIAL_PASSIVE_VIEWS,
  totalClicks: 0,
  criticalTaps: 0,
  
  // Upgrade-uri - noua structură
  upgrades: INITIAL_UPGRADES,
  
  // Boostere
  activeBoosters: [],
  boosterInventory: {},
  
  // Incrementăm vizualizările când utilizatorul face tap
  incrementViews: () => {
    const { upgrades, activeBoosters } = get();
    
    // Valoarea de bază a click-ului
    const baseClickValue = get().clickValue;
    
    // Calculăm șansa de tap critic
    const criticalChance = upgrades[UPGRADE_TYPES.CRITICAL_CHANCE].value / 100;
    const criticalMultiplier = upgrades[UPGRADE_TYPES.CRITICAL_MULTIPLIER].value;
    
    // Verificăm dacă avem un tap critic
    const isCritical = Math.random() < criticalChance;
    let totalMultiplier = isCritical ? criticalMultiplier : 1;
    
    if (isCritical) {
      console.log(`TAP CRITIC! Multiplicator: x${criticalMultiplier}`);
    }
    
    // Aplicăm multiplicatorii din boostere active
    const now = Date.now();
    let hasBoosterBonus = false;
    
    // Verificăm dacă există boostere active care oferă multiplicatori
    activeBoosters.forEach(booster => {
      if (booster.endTime > now && booster.multiplier) {
        hasBoosterBonus = true;
        // Memorăm multiplicatorul înainte de a aplica boosterul
        const prevMultiplier = totalMultiplier;
        totalMultiplier *= booster.multiplier;
        
        console.log(`Booster aplicat (tap): ${booster.type} (x${booster.multiplier}) - ${prevMultiplier} → ${totalMultiplier}`);
      }
    });
    
    // Calculăm valoarea finală a incrementului
    const increment = baseClickValue * totalMultiplier;
    
    if (hasBoosterBonus || isCritical) {
      console.log(`Valoare click finală: ${baseClickValue} × ${totalMultiplier} = ${increment}`);
    }
    
    // Actualizăm starea
    set(state => ({
      views: state.views + increment,
      totalClicks: state.totalClicks + 1,
      criticalTaps: isCritical ? state.criticalTaps + 1 : state.criticalTaps
    }));
    
    // Salvăm starea jocului
    get().saveGame();
  },
  
  // Upgrade pentru valoarea click-ului
  upgradeClickValue: () => {
    set(state => ({
      clickValue: state.clickValue * 1.2, // Crește valoarea cu 20%
    }));
    get().saveGame();
  },
  
  // Adăugăm vizualizări pasive
  addPassiveViews: (amount) => {
    if (amount <= 0) return;
    
    const { activeBoosters } = get();
    let finalAmount = amount;
    const now = Date.now();
    
    console.log(`Venit pasiv inițial: ${amount} vizualizări`);
    
    // Aplicăm multiplicatorii din boostere active pentru vizualizări pasive
    let hasBoosterApplied = false;
    
    activeBoosters.forEach(booster => {
      if (booster.endTime > now && booster.multiplier) {
        // Verificăm dacă boosterul este de orice tip care afectează vizualizările
        // Notă: În mod implicit, toate boosterele cu multiplicator se aplică la vizualizările pasive
        hasBoosterApplied = true;
        
        // Memorăm multiplicatorul anterior
        const amountBefore = finalAmount;
        
        // Aplicăm multiplicatorul
        finalAmount *= booster.multiplier;
        
        console.log(`Booster aplicat: ${booster.type} (x${booster.multiplier}) - ${amountBefore} → ${finalAmount}`);
      }
    });
    
    if (!hasBoosterApplied) {
      console.log('Nu s-a aplicat niciun booster la venitul pasiv.');
    }
    
    if (finalAmount > amount) {
      console.log(`Venit pasiv final după boostere: ${finalAmount} vizualizări`);
    }
    
    // Actualizăm starea
    set(state => ({
      views: state.views + finalAmount,
    }));
  },
  
  // Resetăm jocul
  resetGame: () => {
    const { userId, isOnline } = get();
    
    set({
      views: GAME_SETTINGS.INITIAL_VIEWS,
      clickValue: GAME_SETTINGS.INITIAL_CLICK_VALUE,
      passiveViews: GAME_SETTINGS.INITIAL_PASSIVE_VIEWS,
      totalClicks: 0,
      criticalTaps: 0,
      upgrades: INITIAL_UPGRADES,
    });
    
    // Salvăm starea jocului
    get().saveGame();
    
    // Sincronizăm cu serverul după resetare (moment important)
    if (isOnline && userId) {
      // Utilizăm setTimeout pentru a rula sincronizarea asincron
      setTimeout(() => {
        get().syncProgress();
      }, 100);
    }
  },
  
  // Setăm upgrades-urile
  setUpgrades: (upgrades) => {
    set({ upgrades });
  },
  
  // Setăm ID-ul utilizatorului
  setUserId: (id) => {
    set({ userId: id });
    
    if (id) {
      // Încărcăm progresul de pe server
      get().loadFromServer();
    }
  },
  
  // Setăm modul online
  setOnlineMode: (isOnline) => {
    set({ 
      isOnline,
      isOnlineMode: isOnline 
    });
  },
  
  // Verificăm dacă utilizatorul poate cumpăra un upgrade
  canBuyUpgrade: (upgradeType) => {
    const { views, upgrades } = get();
    
    if (!upgrades[upgradeType]) return false;
    
    const upgrade = upgrades[upgradeType];
    const cost = Math.floor(upgrade.basePrice * Math.pow(upgrade.priceMultiplier, upgrade.level));
    
    return views >= cost;
  },
  
  // Cumpărăm un upgrade
  buyUpgrade: (upgradeType) => {
    const { views, upgrades, userId, isOnline } = get();
    
    if (!upgrades[upgradeType]) return;
    
    const upgrade = upgrades[upgradeType];
    const cost = Math.floor(upgrade.basePrice * Math.pow(upgrade.priceMultiplier, upgrade.level));
    
    // Verificăm dacă avem suficiente vizualizări
    if (views < cost) return;
    
    // Actualizăm upgrade-ul și statisticile în funcție de tipul său
    const updatedUpgrades = { ...upgrades };
    
    switch (upgradeType) {
      case UPGRADE_TYPES.CLICK_VALUE:
        set(state => ({
          views: state.views - cost,
          clickValue: state.clickValue + upgrade.increment,
          upgrades: {
            ...state.upgrades,
            [upgradeType]: {
              ...upgrade,
              level: upgrade.level + 1,
              value: upgrade.value + upgrade.increment,
            }
          }
        }));
        break;
      
      case UPGRADE_TYPES.PASSIVE_INCOME:
        set(state => ({
          views: state.views - cost,
          passiveViews: state.passiveViews + upgrade.increment,
          upgrades: {
            ...state.upgrades,
            [upgradeType]: {
              ...upgrade,
              level: upgrade.level + 1,
              value: upgrade.value + upgrade.increment,
            }
          }
        }));
        break;
      
      case UPGRADE_TYPES.CRITICAL_CHANCE:
        set(state => ({
          views: state.views - cost,
          upgrades: {
            ...state.upgrades,
            [upgradeType]: {
              ...upgrade,
              level: upgrade.level + 1,
              value: Math.min(upgrade.value + upgrade.increment, 100), // Max 100%
            }
          }
        }));
        break;
      
      case UPGRADE_TYPES.CRITICAL_MULTIPLIER:
        set(state => ({
          views: state.views - cost,
          upgrades: {
            ...state.upgrades,
            [upgradeType]: {
              ...upgrade,
              level: upgrade.level + 1,
              value: upgrade.value + upgrade.increment,
            }
          }
        }));
        break;
    }
    
    // Salvăm starea jocului
    get().saveGame();
    
    // Sincronizăm cu serverul după cumpărarea unui upgrade (moment important)
    if (isOnline && userId) {
      // Utilizăm setTimeout pentru a rula sincronizarea asincron
      setTimeout(() => {
        get().syncProgress();
      }, 100);
    }
  },
  
  // Salvăm starea jocului în AsyncStorage
  saveGame: async () => {
    try {
      const { 
        views, 
        clickValue, 
        passiveViews, 
        totalClicks, 
        criticalTaps, 
        upgrades,
        userId,
        isOnline,
        activeBoosters,
        boosterInventory
      } = get();
      
      // Salvăm local indiferent de conexiune
      const gameState = {
        views,
        clickValue,
        passiveViews,
        totalClicks,
        criticalTaps,
        upgrades,
        activeBoosters,
        boosterInventory
      };
      
      await AsyncStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(gameState));
    } catch (error) {
      console.error('Eroare la salvarea progresului:', error);
    }
  },
  
  // Încărcăm starea jocului din AsyncStorage
  loadGame: async () => {
    try {
      const gameStateJSON = await AsyncStorage.getItem(STORAGE_KEYS.GAME_STATE);
      
      if (gameStateJSON) {
        const gameState = JSON.parse(gameStateJSON);
        
        set({
          views: gameState.views ?? GAME_SETTINGS.INITIAL_VIEWS,
          clickValue: gameState.clickValue ?? GAME_SETTINGS.INITIAL_CLICK_VALUE,
          passiveViews: gameState.passiveViews ?? GAME_SETTINGS.INITIAL_PASSIVE_VIEWS,
          totalClicks: gameState.totalClicks ?? 0,
          criticalTaps: gameState.criticalTaps ?? 0,
          upgrades: gameState.upgrades ?? INITIAL_UPGRADES,
          activeBoosters: gameState.activeBoosters ?? [],
          boosterInventory: gameState.boosterInventory ?? {}
        });
      }
    } catch (error) {
      console.error('Eroare la încărcarea progresului:', error);
    }
  },
  
  // Sincronizăm progresul cu serverul
  syncProgress: async () => {
    const { userId, views, clickValue, passiveViews, totalClicks, criticalTaps, upgrades, isOnline, boosterInventory } = get();
    
    if (!isOnline || !userId) {
      console.log('Nu se poate sincroniza: offline sau fără utilizator.');
      return false;
    }
    
    try {
      // Transformăm upgrade-urile în formatul simplu pentru baza de date
      const simpleUpgrades: Record<string, number> = {};
      Object.entries(upgrades).forEach(([key, upgrade]) => {
        simpleUpgrades[key] = upgrade.level;
      });
      
      // Salvăm progresul utilizatorului
      const progressSuccess = await saveUserProgress(userId, {
        views: views,
        click_value: clickValue,
        passive_views: passiveViews,
        total_clicks: Math.floor(totalClicks),
        critical_taps: Math.floor(criticalTaps)
      });
      
      // Salvăm upgrade-urile utilizatorului
      const upgradeSuccess = await saveUserUpgrades(userId, simpleUpgrades);
      
      // Salvăm boosterele utilizatorului
      const boosterSuccess = await saveUserBoosters(userId, boosterInventory);
      
      return progressSuccess && upgradeSuccess && boosterSuccess;
    } catch (error) {
      console.error('Eroare la sincronizarea progresului:', error);
      return false;
    }
  },
  
  // Încărcăm progresul de pe server
  loadFromServer: async () => {
    const { userId, isOnline } = get();
    
    if (!isOnline || !userId) {
      console.log('Nu se poate încărca de pe server: offline sau fără utilizator.');
      return false;
    }
    
    try {
      // Încărcăm progresul utilizatorului
      const progress = await getUserProgress(userId);
      const userUpgradesLevels = await getUserUpgrades(userId);
      const userBoosters = await getUserBoosters(userId);
      
      if (progress) {
        set({
          views: progress.views,
          clickValue: progress.click_value,
          passiveViews: progress.passive_views,
          totalClicks: progress.total_clicks,
          criticalTaps: progress.critical_taps
        });
      }
      
      if (userUpgradesLevels) {
        // Convertim nivelurile de upgrade în obiecte UpgradeState complete
        const currentUpgrades = get().upgrades;
        const updatedUpgrades = { ...currentUpgrades };
        
        Object.entries(userUpgradesLevels).forEach(([type, level]) => {
          if (currentUpgrades[type]) {
            // Recalculăm valoarea în funcție de nivel
            let newValue = 0;
            
            switch (type) {
              case UPGRADE_TYPES.CLICK_VALUE:
                newValue = GAME_SETTINGS.INITIAL_CLICK_VALUE + (currentUpgrades[type].increment * level);
                break;
              case UPGRADE_TYPES.PASSIVE_INCOME:
                newValue = GAME_SETTINGS.INITIAL_PASSIVE_VIEWS + (currentUpgrades[type].increment * level);
                break;
              case UPGRADE_TYPES.CRITICAL_CHANCE:
                newValue = GAME_SETTINGS.CRITICAL_CHANCE * 100 + (currentUpgrades[type].increment * level);
                newValue = Math.min(newValue, 100); // Max 100%
                break;
              case UPGRADE_TYPES.CRITICAL_MULTIPLIER:
                newValue = GAME_SETTINGS.CRITICAL_MULTIPLIER + (currentUpgrades[type].increment * level);
                break;
            }
            
            updatedUpgrades[type] = {
              ...currentUpgrades[type],
              level,
              value: newValue
            };
          }
        });
        
        set({ upgrades: updatedUpgrades });
      }
      
      // Încărcăm boosterele utilizatorului
      if (userBoosters) {
        set({ boosterInventory: userBoosters });
      }
      
      return true;
    } catch (error) {
      console.error('Eroare la încărcarea progresului de pe server:', error);
      return false;
    }
  },
  
  // Boostere
  updateActiveBoosters: () => {
    const { activeBoosters } = get();
    const now = Date.now();
    
    // Filtrăm boosterele care nu au expirat
    const updatedBoosters = activeBoosters.filter(booster => booster.endTime > now);
    
    // Verificăm dacă există boostere AI_CONTENT_GENERATOR active și facem click-uri automate
    for (const booster of activeBoosters) {
      // Verificăm dacă boosterul nu a expirat și este de tipul AI_CONTENT_GENERATOR
      if (booster.endTime > now && booster.type === BOOSTER_TYPES.AI_CONTENT_GENERATOR) {
        // Obținem configurația boosterului
        const config = BOOSTER_DESCRIPTIONS[booster.type];
        
        // Verificăm dacă configurația există și are clicksPerSecond
        if (config && config.clicksPerSecond) {
          // Calculăm câte click-uri ar trebui să facem la această actualizare
          const clicksToPerform = Math.round(config.clicksPerSecond / 5);
          
          // Facem numărul corespunzător de click-uri
          for (let i = 0; i < clicksToPerform; i++) {
            get().incrementViews();
          }
        }
      }
    }
    
    // Actualizăm starea doar dacă s-a schimbat ceva
    if (updatedBoosters.length !== activeBoosters.length) {
      set({ activeBoosters: updatedBoosters });
      
      // Salvăm starea jocului când un booster expiră
      get().saveGame();
    }
  },
  
  getBoosterCount: (type: string) => {
    const { boosterInventory } = get();
    return boosterInventory[type] || 0;
  },
  
  canBuyBooster: (type: string) => {
    const { views } = get();
    const boosterConfig = BOOSTER_DESCRIPTIONS[type];
    
    if (!boosterConfig) return false;
    
    return views >= boosterConfig.price;
  },
  
  buyBooster: (type: string) => {
    const { views, boosterInventory, userId, isOnline } = get();
    const boosterConfig = BOOSTER_DESCRIPTIONS[type];
    
    if (!boosterConfig) return false;
    
    // Verificăm dacă avem suficiente vizualizări
    if (views < boosterConfig.price) return false;
    
    // Actualizăm inventarul și scădem vizualizările
    const updatedInventory = { ...boosterInventory };
    updatedInventory[type] = (updatedInventory[type] || 0) + 1;
    
    set(state => ({
      views: state.views - boosterConfig.price,
      boosterInventory: updatedInventory
    }));
    
    // Salvăm starea jocului
    get().saveGame();
    
    // Sincronizăm cu serverul dacă suntem online
    if (isOnline && userId) {
      // Salvăm boosterele în baza de date
      saveUserBoosters(userId, updatedInventory);
      
      // Sincronizăm și progresul
      setTimeout(() => {
        get().syncProgress();
      }, 100);
    }
    
    return true;
  },
  
  useBoosterFromInventory: (type: string) => {
    const { boosterInventory, activeBoosters, userId, isOnline } = get();
    const boosterConfig = BOOSTER_DESCRIPTIONS[type];
    
    if (!boosterConfig) return false;
    
    // Verificăm dacă avem cel puțin un booster de acest tip
    if (!boosterInventory[type] || boosterInventory[type] <= 0) return false;
    
    // Actualizăm inventarul
    const updatedInventory = { ...boosterInventory };
    updatedInventory[type] = updatedInventory[type] - 1;
    
    // Calculăm timpul de expirare
    const now = Date.now();
    const endTime = now + boosterConfig.duration;
    
    // Creăm noul booster activ
    const newBooster = {
      id: Crypto.randomUUID(),
      type,
      endTime,
      multiplier: boosterConfig.multiplier
    };
    
    // Actualizăm starea
    set(state => ({
      boosterInventory: updatedInventory,
      activeBoosters: [...state.activeBoosters, newBooster]
    }));
    
    // Salvăm starea jocului
    get().saveGame();
    
    // Sincronizăm cu serverul dacă suntem online
    if (isOnline && userId) {
      // Salvăm boosterele în baza de date
      saveUserBoosters(userId, updatedInventory);
    }
    
    return true;
  },
  
  // Adăugă un multiplicator temporar
  addMultiplier: (multiplier: number, duration: number) => {
    // Generăm un ID unic pentru acest booster
    const id = Crypto.randomUUID();
    
    // Calculăm timpul de expirare
    const now = Date.now();
    const endTime = now + duration;
    
    // Creăm noul booster de tip multiplicator din boosterele definite
    // Folosim TRENDING_BOOST ca tip pentru a avea acces la toate proprietățile necesare
    const newBooster = {
      id,
      type: BOOSTER_TYPES.TRENDING_BOOST, // Folosim un tip de booster definit în loc de string direct
      endTime,
      multiplier
    };
    
    // Adăugăm în lista de boostere active
    set(state => ({
      activeBoosters: [...state.activeBoosters, newBooster]
    }));
    
    // Salvăm starea jocului
    get().saveGame();
    
    console.log('Multiplicator adăugat:', newBooster);
  },
  
  // Adaugă un booster de tip AI Content Generator
  addAIContentGenerator: (duration: number = 10000) => {
    // Generăm un ID unic pentru acest booster
    const id = Crypto.randomUUID();
    
    // Calculăm timpul de expirare
    const now = Date.now();
    const endTime = now + duration;
    
    // Creăm noul booster de tip AI Content Generator
    const newBooster = {
      id,
      type: BOOSTER_TYPES.AI_CONTENT_GENERATOR,
      endTime
    };
    
    // Adăugăm în lista de boostere active
    set(state => ({
      activeBoosters: [...state.activeBoosters, newBooster]
    }));
    
    // Salvăm starea jocului
    get().saveGame();
    
    console.log('AI Content Generator adăugat:', newBooster);
    
    return newBooster;
  },
}));

// Export pentru hook-ul de utilizare a store-ului
export const useGame = useGameStore;

export default useGameStore; 