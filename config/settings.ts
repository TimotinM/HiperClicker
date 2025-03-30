/**
 * Configurările generale ale aplicației HiperClicker
 */

// Configurare Supabase (adaugă valorile tale reale)
export const SUPABASE_URL = 'https://yuikrxaokuatfmkbqgsf.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1aWtyeGFva3VhdGZta2JxZ3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyODAwODQsImV4cCI6MjA1ODg1NjA4NH0.Kqkm-gZ0DZcEYZhaH-Gf7bM8uIRWcTJWXxO4vxlr3hA';

// Constante pentru joc
export const GAME_SETTINGS = {
  // Valoarea inițială a vizualizărilor
  INITIAL_VIEWS: 0,
  
  // Valoarea implicită pentru fiecare click (conform regulilor de joc)
  INITIAL_CLICK_VALUE: 1,
  
  // Factorul de multiplicare pentru upgrade-uri
  UPGRADE_MULTIPLIER: 1.5,
  
  // Intervalul de salvare automată (în milisecunde)
  AUTOSAVE_INTERVAL: 30000, // 30 secunde
  
  // Șansa pentru un critical tap (5%)
  CRITICAL_CHANCE: 0.05,
  
  // Multiplicator pentru critical tap
  CRITICAL_MULTIPLIER: 5,
  
  // Cantitatea de vizualizări pasive pe secundă (inițial 0)
  INITIAL_PASSIVE_VIEWS: 0,
  
  // Intervalul pentru generarea de vizualizări pasive (în milisecunde)
  PASSIVE_INTERVAL_MS: 1000, // 1 secundă
};

// Tipurile de upgrade-uri disponibile
export const UPGRADE_TYPES = {
  CLICK_VALUE: 'CLICK_VALUE',
  PASSIVE_INCOME: 'PASSIVE_INCOME',
  CRITICAL_CHANCE: 'CRITICAL_CHANCE',
  CRITICAL_MULTIPLIER: 'CRITICAL_MULTIPLIER',
};

// Descrierile upgrade-urilor pentru UI
export const UPGRADE_DESCRIPTIONS = {
  [UPGRADE_TYPES.CLICK_VALUE]: {
    name: 'Tap Power',
    description: 'Îmbunătățește valorea fiecărui tap și capturează mai multe vizualizări!',
    icon: 'hand-pointer',
  },
  [UPGRADE_TYPES.PASSIVE_INCOME]: {
    name: 'Engagement',
    description: 'Crește rata de vizualizări pasive pe secundă prin algoritmi mai buni!',
    icon: 'clock',
  },
  [UPGRADE_TYPES.CRITICAL_CHANCE]: {
    name: 'Viral Chance',
    description: 'Mărește șansa ca conținutul tău să devină viral și să explodeze!',
    icon: 'bolt',
  },
  [UPGRADE_TYPES.CRITICAL_MULTIPLIER]: {
    name: 'Trend Multiplier',
    description: 'Mărește impactul loviturilor virale când devii trending!',
    icon: 'star',
  },
};

// Tipurile de boostere disponibile (temporare)
export const BOOSTER_TYPES = {
  TRENDING_BOOST: 'TRENDING_BOOST',
  AI_CONTENT_GENERATOR: 'AI_CONTENT_GENERATOR',
  MEGA_TRENDING_BOOST: 'MEGA_TRENDING_BOOST',
  ENGAGEMENT_BOOST: 'ENGAGEMENT_BOOST'
};

// Descrierile boosterelor pentru UI
export const BOOSTER_DESCRIPTIONS = {
  [BOOSTER_TYPES.TRENDING_BOOST]: {
    name: 'Trending Boost',
    description: 'x2 vizualizări pentru 30 secunde',
    icon: 'fire',
    multiplier: 2,
    duration: 30000, // 30 secunde în milisecunde
    price: 1000,
    premium: false
  },
  [BOOSTER_TYPES.AI_CONTENT_GENERATOR]: {
    name: 'AI Content Generator',
    description: 'Auto-click timp de 10 secunde',
    icon: 'robot',
    clicksPerSecond: 5,
    duration: 10000, // 10 secunde în milisecunde
    price: 2000,
    premium: false
  },
  [BOOSTER_TYPES.MEGA_TRENDING_BOOST]: {
    name: 'Mega Trending Boost',
    description: 'x5 vizualizări timp de 1 minut',
    icon: 'crown',
    multiplier: 5,
    duration: 60000, // 1 minut în milisecunde
    price: 5000,
    premium: true
  },
  [BOOSTER_TYPES.ENGAGEMENT_BOOST]: {
    name: 'Engagement Boost',
    description: 'x3 vizualizări pasive pentru 45 secunde',
    icon: 'heart',
    multiplier: 3,
    duration: 45000, // 45 secunde în milisecunde
    price: 3000,
    premium: false
  }
};

// Recompense pentru misiuni zilnice
export const DAILY_MISSION_REWARDS = {
  VIEWS: 'VIEWS',
  FREE_BOOSTER: 'FREE_BOOSTER'
};

// Tipuri de misiuni zilnice
export const DAILY_MISSION_TYPES = {
  REACH_VIEWS: 'REACH_VIEWS',
  USE_BOOSTERS: 'USE_BOOSTERS',
  GET_CRITICAL_TAPS: 'GET_CRITICAL_TAPS',
  SHARE_CONTENT: 'SHARE_CONTENT'
};

// Chei pentru AsyncStorage
export const STORAGE_KEYS = {
  GAME_STATE: 'hiper_clicker_game_state',
  USER_SESSION: 'hiper_clicker_session',
  DEVICE_ID: 'hiper_clicker_device_id',
  LAST_UPDATE_TIME: 'hiper_clicker_last_update_time',
  ACTIVE_BOOSTERS: 'hiper_clicker_active_boosters',
  DAILY_MISSIONS: 'hiper_clicker_daily_missions',
  LAST_DAILY_RESET: 'hiper_clicker_last_daily_reset'
};

// Paleta de culori a aplicației
export const COLORS = {
  primary: '#FF4D4F',       // Roșu TikTok
  secondary: '#00F2EA',     // Turcoaz TikTok
  background: '#121212',    // Fundal închis
  card: '#1E1E1E',          // Card închis
  text: '#FFFFFF',          // Text alb
  textSecondary: '#AAAAAA', // Text secundar
  success: '#4CAF50',       // Verde succes
  notification: '#FF9800',  // Portocaliu notificări
  warning: '#F44336',       // Roșu avertizare
  info: '#2196F3',          // Albastru informație
  border: '#333333',        // Margini întunecate
  disabled: '#666666',      // Dezactivat
  critical: '#FF2D55',      // Critical hit
  gradient: {
    start: '#FF4D4F',       // Roșu TikTok
    middle: '#FF0050',      // Roz TikTok 
    end: '#00F2EA',         // Turcoaz TikTok
  },
  glow: '#FF0050',          // Culoare strălucire
  premium: '#FFD700',       // Auriu pentru lucruri premium
  booster: '#9C27B0',       // Violet pentru boostere
};

// AdMob - ID-uri pentru reclame (pentru producție, trebuie înlocuite cu ID-urile reale)
export const ADMOB_CONFIG = {
  // Flag pentru a activa/dezactiva reclamele
  ENABLED: true,
  
  // Flag pentru a folosi ID-uri de test
  USE_TEST_IDS: true,
  
  // ID-uri pentru banner
  BANNER_ID_ANDROID: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY',
  BANNER_ID_IOS: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY',
  
  // ID-uri pentru interstitiale
  INTERSTITIAL_ID_ANDROID: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY',
  INTERSTITIAL_ID_IOS: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY',
  
  // ID-uri pentru recompense
  REWARDED_ID_ANDROID: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY',
  REWARDED_ID_IOS: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY',
  
  // Frecvența reclamelor interstitiale (număr de acțiuni între reclame)
  INTERSTITIAL_FREQUENCY: 5,
  
  // Recompensă pentru vizionarea unei reclame rewarded
  REWARDED_VIEWS_MULTIPLIER: 2,
  REWARDED_DURATION: 30000, // 30 secunde în milisecunde
  
  // Șansa de a primi un booster gratuit din reclame rewarded
  FREE_BOOSTER_CHANCE: 0.3, // 30% șansă
};

// Tipuri de recompense pentru reclame
export const AD_REWARD_TYPES = {
  VIEWS_MULTIPLIER: 'VIEWS_MULTIPLIER',
  FREE_BOOSTER: 'FREE_BOOSTER'
}; 