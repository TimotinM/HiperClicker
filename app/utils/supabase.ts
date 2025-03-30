import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, STORAGE_KEYS } from '../../config/settings';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Inițializăm clientul Supabase cu configurațiile necesare
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Interfața pentru datele de profil utilizator
export interface UserProfileData {
  id: number; // ID serial
  user_id: string; // UUID-ul utilizatorului
  username: string;
  total_views: number;
  created_at: string;
  updated_at: string;
}

// Interfața pentru date despre progresul utilizatorului
export interface UserProgressData {
  user_id: string; 
  views: number;
  total_clicks: number;
  critical_taps: number;
  click_value: number;
  passive_views: number;
  last_synced: string;
}

// Interfața pentru datele despre upgrade-urile utilizatorului
export interface UserUpgradeData {
  user_id: string;
  upgrade_id: string;
  level: number;
  last_upgraded: string;
}

// Interfața pentru elementele din clasament
export interface LeaderboardEntry {
  username: string;
  total_views: number;
  rank: number;
}

// Tipul pentru elementele din clasament
export interface LeaderboardItem {
  userId: string;
  username: string;
  totalViews: number;
  rank: number;
}

// Adaug interfața pentru boosterele utilizatorului
export interface UserBoosterData {
  user_id: string;
  booster_type: string;
  count: number;
  last_updated: string;
}

// Salvăm progresul utilizatorului
export const saveUserProgress = async (
  userId: string,
  progressData: Omit<UserProgressData, 'user_id' | 'last_synced'>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        ...progressData,
        last_synced: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('Eroare la salvarea progresului:', error);
      return false;
    }
    else {
      console.log('Progresul utilizatorului a fost salvat cu succes');
    }

    // Actualizăm și profilul utilizatorului cu numărul total de vizualizări
    await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        total_views: progressData.views,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    return true;
  } catch (err) {
    console.error('Eroare la salvarea progresului:', err);
    return false;
  }
};

// Salvăm upgrade-urile utilizatorului
export const saveUserUpgrades = async (
  userId: string,
  upgrades: { [key: string]: number }
): Promise<boolean> => {
  try {
    // Transformăm obiectul de upgrade-uri într-un array de înregistrări pentru upsert
    const upgradeRecords = Object.entries(upgrades).map(([upgradeId, level]) => ({
      user_id: userId,
      upgrade_id: upgradeId,
      level,
      last_upgraded: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('user_upgrades')
      .upsert(upgradeRecords, { onConflict: 'user_id,upgrade_id' });

    if (error) {
      console.error('Eroare la salvarea upgrade-urilor:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Eroare la salvarea upgrade-urilor:', err);
    return false;
  }
};

// Luăm progresul utilizatorului
export const getUserProgress = async (userId: string): Promise<UserProgressData | null> => {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Eroare la preluarea progresului:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Eroare la preluarea progresului:', err);
    return null;
  }
};

// Luăm upgrade-urile utilizatorului
export const getUserUpgrades = async (userId: string): Promise<{ [key: string]: number } | null> => {
  try {
    const { data, error } = await supabase
      .from('user_upgrades')
      .select('upgrade_id, level')
      .eq('user_id', userId);

    if (error) {
      console.error('Eroare la preluarea upgrade-urilor:', error);
      return null;
    }

    // Definim interfața pentru elementele returnate de query
    interface UpgradeItem {
      upgrade_id: string;
      level: number;
    }

    // Transformăm array-ul de înregistrări într-un obiect { upgradeId: level }
    return data.reduce((acc: { [key: string]: number }, item: UpgradeItem) => {
      acc[item.upgrade_id] = item.level;
      return acc;
    }, {});
  } catch (err) {
    console.error('Eroare la preluarea upgrade-urilor:', err);
    return null;
  }
};

// Funcția pentru obținerea clasamentului
export const getLeaderboard = async (limit: number = 20): Promise<LeaderboardItem[]> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, username, total_views')
      .order('total_views', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Eroare la obținerea clasamentului:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Mapăm datele pentru a adăuga rangul și a le converti în formatul așteptat
    return data.map((entry, index) => ({
      userId: entry.id,
      username: entry.username || 'Utilizator anonim',
      totalViews: entry.total_views || 0,
      rank: index + 1
    }));
  } catch (error) {
    console.error('Eroare la obținerea clasamentului:', error);
    return [];
  }
};

// Actualizăm numele de utilizator
export const updateUsername = async (userId: string, username: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        username,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('Eroare la actualizarea numelui de utilizator:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Eroare la actualizarea numelui de utilizator:', err);
    return false;
  }
};

// Salvăm boosterele utilizatorului
export const saveUserBoosters = async (
  userId: string,
  boosters: { [key: string]: number }
): Promise<boolean> => {
  try {
    // Transformăm obiectul de boostere într-un array de înregistrări pentru upsert
    const boosterRecords = Object.entries(boosters).map(([boosterType, count]) => ({
      user_id: userId,
      booster_type: boosterType,
      count,
      last_updated: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('user_boosters')
      .upsert(boosterRecords, { onConflict: 'user_id,booster_type' });

    if (error) {
      console.error('Eroare la salvarea boosterelor:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Eroare la salvarea boosterelor:', err);
    return false;
  }
};

// Luăm boosterele utilizatorului
export const getUserBoosters = async (userId: string): Promise<{ [key: string]: number } | null> => {
  try {
    const { data, error } = await supabase
      .from('user_boosters')
      .select('booster_type, count')
      .eq('user_id', userId);

    if (error) {
      console.error('Eroare la preluarea boosterelor:', error);
      return null;
    }

    // Definim interfața pentru elementele returnate de query
    interface BoosterItem {
      booster_type: string;
      count: number;
    }

    // Transformăm array-ul de înregistrări într-un obiect { boosterType: count }
    return data.reduce((acc: { [key: string]: number }, item: BoosterItem) => {
      acc[item.booster_type] = item.count;
      return acc;
    }, {});
  } catch (err) {
    console.error('Eroare la preluarea boosterelor:', err);
    return null;
  }
};

// Adăugăm un tip specific de booster pentru un utilizator
export const addUserBooster = async (
  userId: string,
  boosterType: string,
  count: number = 1
): Promise<boolean> => {
  try {
    // Mai întâi obținem numărul actual de boostere
    const { data, error: fetchError } = await supabase
      .from('user_boosters')
      .select('count')
      .eq('user_id', userId)
      .eq('booster_type', boosterType)
      .single();
    
    let currentCount = 0;
    
    if (!fetchError && data) {
      currentCount = data.count;
    }
    
    // Actualizăm numărul de boostere
    const { error: updateError } = await supabase
      .from('user_boosters')
      .upsert({
        user_id: userId,
        booster_type: boosterType,
        count: currentCount + count,
        last_updated: new Date().toISOString(),
      }, { onConflict: 'user_id,booster_type' });
    
    if (updateError) {
      console.error('Eroare la adăugarea boosterelor:', updateError);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Eroare la adăugarea boosterelor:', err);
    return false;
  }
};

export default supabase; 