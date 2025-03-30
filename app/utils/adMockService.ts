import React from 'react';
import { View, Text } from 'react-native';

/**
 * Acest fișier conține simulări pentru serviciul de reclame AdMob
 * Utilizat pentru dezvoltare locală fără module native
 */

// Acest fișier furnizează un serviciu mock pentru AdMob în timpul dezvoltării

export const TestIds = {
  BANNER: 'mock-banner',
  INTERSTITIAL: 'mock-interstitial',
  REWARDED: 'mock-rewarded'
};

export enum AdEventType {
  LOADED = 'loaded',
  ERROR = 'error',
  OPENED = 'opened',
  CLOSED = 'closed'
}

export enum RewardedAdEventType {
  LOADED = 'loaded',
  EARNED_REWARD = 'earned_reward'
}

export const BannerAdSize = {
  BANNER: 'BANNER',
  ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER'
};

// Mock pentru InterstitialAd
export class InterstitialAd {
  loaded = false;
  eventListeners: {type: string, handler: Function}[] = [];
  
  static createForAdRequest(adUnitId: string) {
    return new InterstitialAd();
  }
  
  load() {
    setTimeout(() => {
      this.loaded = true;
      this.notifyListeners(AdEventType.LOADED, null);
    }, 500);
  }
  
  show() {
    if (this.loaded) {
      this.notifyListeners(AdEventType.OPENED, null);
      
      setTimeout(() => {
        this.notifyListeners(AdEventType.CLOSED, null);
        this.loaded = false;
      }, 1000);
    }
  }
  
  addAdEventListener(type: string, handler: Function) {
    this.eventListeners.push({ type, handler });
    return () => {
      this.eventListeners = this.eventListeners.filter(
        listener => listener.type !== type || listener.handler !== handler
      );
    };
  }
  
  notifyListeners(type: string, payload: any) {
    this.eventListeners.forEach(listener => {
      if (listener.type === type) {
        listener.handler(payload);
      }
    });
  }
}

// Mock pentru RewardedAd
export class RewardedAd {
  loaded = false;
  eventListeners: {type: string, handler: Function}[] = [];
  
  static createForAdRequest(adUnitId: string) {
    return new RewardedAd();
  }
  
  load() {
    setTimeout(() => {
      this.loaded = true;
      this.notifyListeners(AdEventType.LOADED, null);
    }, 500);
  }
  
  show() {
    if (this.loaded) {
      console.log('Mock RewardedAd.show - Se deschide reclama');
      this.notifyListeners(AdEventType.OPENED, null);
      
      setTimeout(() => {
        console.log('Mock RewardedAd.show - Se oferă recompensa');
        this.notifyListeners(RewardedAdEventType.EARNED_REWARD, {
          type: 'views_multiplier',
          amount: 2
        });
        
        setTimeout(() => {
          console.log('Mock RewardedAd.show - Se închide reclama');
          this.notifyListeners(AdEventType.CLOSED, null);
          this.loaded = false;
        }, 500);
      }, 1000);
    } else {
      console.log('Mock RewardedAd.show - Reclama nu este încărcată');
    }
  }
  
  addAdEventListener(type: string, handler: Function) {
    this.eventListeners.push({ type, handler });
    return () => {
      this.eventListeners = this.eventListeners.filter(
        listener => listener.type !== type || listener.handler !== handler
      );
    };
  }
  
  notifyListeners(type: string, payload: any) {
    this.eventListeners.forEach(listener => {
      if (listener.type === type) {
        listener.handler(payload);
      }
    });
  }
}

// Mock pentru BannerAd (nu necesar deci returnam doar un obiect simplu)
export class BannerAd {
  constructor() {}
}

// Mock pentru funcțiile de serviciu
export const showInterstitialAd = () => {
  return new Promise<boolean>(resolve => {
    setTimeout(() => resolve(true), 1000);
  });
};

export const showRewardedAd = async () => {
  console.log('Mock showRewardedAd apelat - Simulăm reclama recompensată');
  
  // Simulează un delay pentru a face experiența mai realistă
  return new Promise<{success: boolean, type?: string, amount?: number}>(resolve => {
    console.log('Începe simularea reclamei cu recompensă (2 secunde)');
    
    setTimeout(() => {
      console.log('Reclamă finalizată, returnez recompensa: multiplier x2 pentru 30 secunde');
      
      // Returnăm un obiect cu structura așteptată de handleWatchAd din BoostersScreen
      resolve({
        success: true,
        type: 'views_multiplier', // Trebuie să se potrivească cu ce verifică BoostersScreen
        amount: 2                  // Multiplicator x2
      });
    }, 2000);
  });
};

export const initAds = () => {
  console.log('Mock AdMob initialized');
};

// Mock pentru inițializare
const initialize = () => Promise.resolve(new Map());

export default {
  initialize
}; 