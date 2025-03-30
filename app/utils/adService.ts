import { Platform } from 'react-native';
import { ADMOB_CONFIG } from '../../config/settings';

// Încercăm să importăm modulul real de AdMob, iar dacă nu reușim, folosim mock-ul
let mobileAdsModule, InterstitialAd, RewardedAd, AdEventType, TestIds, BannerAd, BannerAdSize, RewardedAdEventType;

try {
  // Încercăm să importăm modulul real
  const admob = require('react-native-google-mobile-ads');
  mobileAdsModule = admob.default;
  InterstitialAd = admob.InterstitialAd;
  RewardedAd = admob.RewardedAd;
  AdEventType = admob.AdEventType;
  TestIds = admob.TestIds;
  BannerAd = admob.BannerAd;
  BannerAdSize = admob.BannerAdSize;
  RewardedAdEventType = admob.RewardedAdEventType;
  
  console.log('Folosim modulul real AdMob');
} catch (error) {
  // Dacă modulul real nu e disponibil, folosim mock-ul
  const mockAdmob = require('./adMockService');
  mobileAdsModule = mockAdmob.default;
  InterstitialAd = mockAdmob.InterstitialAd;
  RewardedAd = mockAdmob.RewardedAd;
  AdEventType = mockAdmob.AdEventType;
  TestIds = mockAdmob.TestIds;
  BannerAd = mockAdmob.BannerAd;
  BannerAdSize = mockAdmob.BannerAdSize;
  RewardedAdEventType = mockAdmob.RewardedAdEventType;
  
  console.log('Folosim modulul mock AdMob pentru dezvoltare');
}

// ID-uri de test pentru dezvoltare
const TEST_BANNER_ID = TestIds.BANNER;
const TEST_INTERSTITIAL_ID = TestIds.INTERSTITIAL;
const TEST_REWARDED_ID = TestIds.REWARDED;

// Definesc tipul pentru funcția de inițializare a mobileAds
type MobileAdsType = {
  initialize: () => Promise<Map<string, any>>;
};

// Folosim ID-uri de test în dezvoltare dacă este configurat așa
const IS_DEVELOPMENT = ADMOB_CONFIG.USE_TEST_IDS;

const getBannerId = () => {
  if (IS_DEVELOPMENT) return TEST_BANNER_ID;
  return Platform.OS === 'android' ? ADMOB_CONFIG.BANNER_ID_ANDROID : ADMOB_CONFIG.BANNER_ID_IOS;
};

const getInterstitialId = () => {
  if (IS_DEVELOPMENT) return TEST_INTERSTITIAL_ID;
  return Platform.OS === 'android' ? ADMOB_CONFIG.INTERSTITIAL_ID_ANDROID : ADMOB_CONFIG.INTERSTITIAL_ID_IOS;
};

const getRewardedId = () => {
  if (IS_DEVELOPMENT) return TEST_REWARDED_ID;
  return Platform.OS === 'android' ? ADMOB_CONFIG.REWARDED_ID_ANDROID : ADMOB_CONFIG.REWARDED_ID_IOS;
};

// Contor pentru afișarea reclamelor interstitiale
let interstitialCounter = 0;

// Funcție pentru a verifica dacă ar trebui să afișăm o reclamă interstitială
const shouldShowInterstitial = () => {
  // Dacă reclamele sunt dezactivate, nu afișăm
  if (!ADMOB_CONFIG.ENABLED) return false;
  
  // Incrementăm contorul
  interstitialCounter++;
  
  // Verificăm dacă am ajuns la frecvența stabilită
  if (interstitialCounter >= ADMOB_CONFIG.INTERSTITIAL_FREQUENCY) {
    // Resetăm contorul
    interstitialCounter = 0;
    return true;
  }
  
  return false;
};

// Creăm o instanță pre-încărcată pentru reclamele interstitiale
let interstitialAd: any = null;

// Funcție pentru a încărca reclama interstitială
const loadInterstitialAd = () => {
  interstitialAd = InterstitialAd.createForAdRequest(getInterstitialId());
  
  interstitialAd.load();
  
  return new Promise<boolean>((resolve) => {
    const unsubscribeLoaded = interstitialAd?.addAdEventListener(AdEventType.LOADED, () => {
      unsubscribeLoaded?.();
      resolve(true);
    });
    
    const unsubscribeError = interstitialAd?.addAdEventListener(AdEventType.ERROR, (error: any) => {
      console.error('Eroare la încărcarea reclamei interstitiale:', error);
      unsubscribeError?.();
      resolve(false);
    });
  });
};

// Funcție pentru a afișa reclama interstitială
const showInterstitialAd = async (): Promise<boolean> => {
  // Dacă nu avem o reclamă încărcată, încercăm să o încărcăm
  if (!interstitialAd) {
    const loaded = await loadInterstitialAd();
    if (!loaded) return false;
  }
  
  // Verificăm dacă reclama este încărcată
  if (!interstitialAd?.loaded) {
    const loaded = await loadInterstitialAd();
    if (!loaded) return false;
  }
  
  return new Promise<boolean>((resolve) => {
    const unsubscribeClosed = interstitialAd?.addAdEventListener(AdEventType.CLOSED, () => {
      unsubscribeClosed?.();
      // Pre-încărcăm următoarea reclamă pentru utilizare viitoare
      loadInterstitialAd();
      resolve(true);
    });
    
    // Afișăm reclama
    interstitialAd?.show();
  });
};

// Importăm funcția mock rewardedAd direct
let showRewardedAdImpl;

if (typeof RewardedAd === 'undefined') {
  // Folosim implementarea mock
  const mockAdmob = require('./adMockService');
  showRewardedAdImpl = mockAdmob.showRewardedAd;
  console.log('Folosim funcția mock showRewardedAd');
} else {
  // Folosim implementarea reală
  showRewardedAdImpl = async (): Promise<{ success: boolean; type?: string; amount?: number }> => {
    // Creăm instanța pentru reclama cu recompensă
    const rewardedAd = RewardedAd.createForAdRequest(getRewardedId());
    
    // Încărcăm reclama
    return new Promise((resolve) => {
      const unsubscribeLoaded = rewardedAd.addAdEventListener(AdEventType.LOADED, () => {
        unsubscribeLoaded();
        // Afișăm reclama când este încărcată
        rewardedAd.show();
      });
      
      const unsubscribeEarned = rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward: any) => {
        unsubscribeEarned();
        // Returnăm detaliile recompensei
        resolve({
          success: true,
          type: reward.type,
          amount: reward.amount,
        });
      });
      
      const unsubscribeError = rewardedAd.addAdEventListener(AdEventType.ERROR, (error: any) => {
        unsubscribeError();
        console.error('Eroare la încărcarea reclamei cu recompensă:', error);
        resolve({ success: false });
      });
      
      const unsubscribeClosed = rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
        unsubscribeClosed();
        // Dacă utilizatorul închide reclama înainte de a primi recompensa
        resolve({ success: false });
      });
      
      // Încărcăm reclama
      rewardedAd.load();
    });
  };
}

// Funcție pentru a afișa o reclamă cu recompensă
const showRewardedAd = async (): Promise<{ success: boolean; type?: string; amount?: number }> => {
  return showRewardedAdImpl();
};

// Pre-încărcăm reclama interstitială la inițializarea aplicației
const initAds = () => {
  loadInterstitialAd();
};

// Exportăm direct funcția mobileAds
const mobileAds = () => {
  return {
    initialize: () => Promise.resolve(new Map<string, any>())
  };
};

// Exportăm componentele și funcțiile necesare
export {
  BannerAd,
  BannerAdSize,
  getBannerId,
  showInterstitialAd,
  showRewardedAd,
  initAds,
  shouldShowInterstitial,
  mobileAds
};

export default mobileAds;

// Exportăm și tipul pentru a putea fi folosit în alte fișiere
export type { MobileAdsType }; 