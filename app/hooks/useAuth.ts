import { useState, useEffect, useCallback } from 'react';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import supabase from '../utils/supabase';
import { STORAGE_KEYS } from '../../config/settings';

// Tipul pentru starea de autentificare
type AuthState = {
  isLoading: boolean;
  isAuthenticated: boolean | null;
  userId: string | null;
  username: string | null;
  errorMessage: string | null;
  isOnlineMode: boolean;
};

// Tipul pentru hook-ul de autentificare
export interface AuthHook {
  isLoading: boolean;
  isAuthenticated: boolean | null;
  userId: string | null;
  username: string | null;
  errorMessage: string | null;
  isOnlineMode: boolean;
  signInAnonymously: (username: string, offlineMode: boolean) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateUsername: (newUsername: string) => Promise<boolean>;
  setCurrentUserId: (id: string | null) => void;
}

// Generator de ID unic pentru dispozitiv
const generateDeviceId = async (): Promise<string> => {
  try {
    const existingId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (existingId) return existingId;
    
    const uniqueId = Crypto.randomUUID();
    await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, uniqueId);
    return uniqueId;
  } catch (error) {
    console.error('Eroare la generarea ID-ului de dispozitiv:', error);
    return `device_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }
};

// Verifică dacă există conexiune la internet
const checkNetworkConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('user_profiles').select('count', { count: 'exact', head: true });
    return !error;
  } catch (e) {
    console.error('Eroare la verificarea conexiunii:', e);
    return false;
  }
};

// Funcție pentru crearea/actualizarea profilului utilizatorului
const ensureUserProfile = async (userId: string, username: string | null): Promise<string> => {
  // Verificăm dacă profilul există
  const { data, error } = await supabase
    .from('user_profiles')
    .select('username')
    .eq('user_id', userId)
    .single();
  
  const defaultUsername = username?.trim() || `Utilizator${Math.floor(Math.random() * 10000)}`;
  
  // Dacă profilul nu există sau avem eroare, îl creăm
  if (error || !data) {
    console.log('Creăm profil nou pentru utilizator:', userId);
    
    const { error: insertError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        username: defaultUsername,
        total_views: 0
      });
    
    if (insertError) {
      console.error('Eroare la crearea profilului:', insertError);
    }
    
    return defaultUsername;
  }
  
  // Dacă avem un username nou și diferit de cel existent, actualizăm profilul
  if (username && username.trim() !== data.username) {
    console.log(`Actualizăm username de la "${data.username}" la "${username.trim()}"`);
    
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ username: username.trim() })
      .eq('user_id', userId);
    
    if (updateError) {
      console.error('Eroare la actualizarea profilului:', updateError);
      return data.username;
    }
    
    return username.trim();
  }
  
  return data.username;
};

// Hook-ul pentru autentificare
export const useAuth = (): AuthHook => {
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOnlineMode, setIsOnlineMode] = useState<boolean>(true);
  
  // Funcție pentru a actualiza starea de autentificare
  const updateAuthState = useCallback((updates: Partial<AuthState>) => {
    if ('isLoading' in updates) setIsLoading(updates.isLoading || false);
    if ('isAuthenticated' in updates) setIsAuthenticated(updates.isAuthenticated || null);
    if ('userId' in updates) setUserId(updates.userId || null);
    if ('username' in updates) setUsername(updates.username || null);
    if ('errorMessage' in updates) setErrorMessage(updates.errorMessage || null);
    if ('isOnlineMode' in updates) setIsOnlineMode(updates.isOnlineMode || false);
  }, []);
  
  // Funcție pentru a resetă starea la deautentificare
  const resetAuthState = useCallback(() => {
    updateAuthState({
      isAuthenticated: false,
      userId: null,
      username: null,
      isLoading: false,
      errorMessage: null,
      isOnlineMode: false,
    });
  }, [updateAuthState]);
  
  // Verificăm sesiunea la încărcarea aplicației
  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      
      try {
        // Verificăm dacă există o sesiune salvată
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log('Nu există sesiune activă');
          resetAuthState();
          return;
        }
        
        console.log('Sesiune existentă detectată:', session.user.id);
        
        // Verificăm/creăm profilul utilizatorului
        const profileUsername = await ensureUserProfile(session.user.id, null);
        
        // Actualizăm starea
        updateAuthState({
          isAuthenticated: true,
          userId: session.user.id,
          username: profileUsername,
          isLoading: false,
          isOnlineMode: true,
        });
      } catch (error) {
        console.error('Eroare la verificarea sesiunii:', error);
        resetAuthState();
        setErrorMessage('Eroare la verificarea sesiunii.');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
  }, [resetAuthState, updateAuthState]);
  
  // Ascultăm schimbările de stare pentru autentificare
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('Schimbare în starea de autentificare:', event);
        
        if (event === 'SIGNED_IN' && session) {
          console.log('Utilizator autentificat:', session.user.id);
          
          try {
            // Verificăm/creăm profilul utilizatorului
            const profileUsername = await ensureUserProfile(session.user.id, null);
            
            // Actualizăm starea
            updateAuthState({
              isAuthenticated: true,
              userId: session.user.id,
              username: profileUsername,
              isLoading: false,
              errorMessage: null,
              isOnlineMode: true,
            });
          } catch (error) {
            console.error('Eroare la procesarea evenimentului de autentificare:', error);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('Utilizator deautentificat');
          resetAuthState();
        }
      }
    );
    
    // Curățăm listener-ul când componenta este demontată
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [resetAuthState, updateAuthState]);
  
  // Funcția pentru login anonim
  const signInAnonymously = async (usernameParam: string, offlineMode: boolean = false): Promise<boolean> => {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      // Mod offline
      if (offlineMode) {
        let deviceId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
        
        if (!deviceId) {
          deviceId = `offline_${Crypto.randomUUID()}`;
          await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
        }
        
        updateAuthState({
          isAuthenticated: true,
          userId: deviceId,
          username: usernameParam || 'Utilizator Offline',
          isLoading: false,
          isOnlineMode: false,
        });
        
        return true;
      }
      
      // Verificăm conexiunea la internet
      const hasConnection = await checkNetworkConnection();
      if (!hasConnection) {
        throw new Error('Nu există conexiune la internet. Folosește modul offline.');
      }
      
      // Generăm ID și credențiale pentru autentificare
      const deviceId = await generateDeviceId();
      const emailPrefix = deviceId.substring(0, 8);
      const email = `user${emailPrefix}@hiperclicker.com`;
      const password = `${deviceId}_secret_pw`;
      
      console.log('Încercăm autentificarea cu email:', email);
      
      // Încercăm să ne conectăm
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      // Dacă utilizatorul există, ne-am conectat cu succes
      if (!signInError && signInData?.user) {
        console.log('Utilizator existent autentificat:', signInData.user.id);
        
        // Asigurăm profilul utilizatorului și actualizăm numele dacă este necesar
        const profileUsername = await ensureUserProfile(signInData.user.id, usernameParam);
        
        // Actualizăm starea
        updateAuthState({
          isAuthenticated: true,
          userId: signInData.user.id,
          username: profileUsername,
          isLoading: false,
          errorMessage: null,
          isOnlineMode: true,
        });
        
        return true;
      }
      
      // Dacă utilizatorul nu există, îl creăm
      if (signInError && signInError.message.includes('Invalid login credentials')) {
        console.log('Credențiale invalide, creăm utilizator nou');
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (signUpError || !signUpData?.user) {
          throw signUpError || new Error('Nu s-a putut crea contul');
        }
        
        console.log('Utilizator nou creat:', signUpData.user.id);
        
        // Așteaptă puțin pentru a ne asigura că utilizatorul a fost creat în Supabase
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Creăm profilul utilizatorului
        const profileUsername = await ensureUserProfile(signUpData.user.id, usernameParam);
        
        // Actualizăm starea
        updateAuthState({
          isAuthenticated: true,
          userId: signUpData.user.id,
          username: profileUsername,
          isLoading: false,
          errorMessage: null,
          isOnlineMode: true,
        });
        
        return true;
      }
      
      // Dacă ajungem aici, nu am reușit să ne autentificăm sau să creăm un utilizator
      throw new Error(signInError?.message || 'Autentificarea a eșuat');
    } catch (error) {
      console.error('Eroare la autentificare:', error);
      setIsLoading(false);
      setErrorMessage(error instanceof Error ? error.message : 'A apărut o eroare la autentificare');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Funcție pentru deautentificare
  const signOut = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      resetAuthState();
    } catch (error) {
      console.error('Eroare la deautentificare:', error);
      setIsLoading(false);
      setErrorMessage(error instanceof Error ? error.message : 'A apărut o eroare la deautentificare');
    }
  };
  
  // Funcție pentru actualizarea numelui de utilizator
  const updateUsername = async (newUsername: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      if (!userId) {
        throw new Error('ID utilizator lipsă, nu se poate actualiza numele');
      }
      
      if (!newUsername || newUsername.trim().length < 3) {
        throw new Error('Numele de utilizator trebuie să aibă cel puțin 3 caractere');
      }
      
      // Actualizăm profilul utilizatorului
      const profileUsername = await ensureUserProfile(userId, newUsername);
      
      // Actualizăm starea locală
      setUsername(profileUsername);
      setIsLoading(false);
      
      return true;
    } catch (error) {
      console.error('Eroare la actualizarea numelui de utilizator:', error);
      setIsLoading(false);
      setErrorMessage(error instanceof Error ? error.message : 'A apărut o eroare la actualizarea numelui');
      return false;
    }
  };
  
  // Setează direct userId
  const setCurrentUserId = (id: string | null) => {
    setUserId(id);
  };
  
  return {
    isLoading,
    isAuthenticated,
    userId,
    username,
    errorMessage,
    isOnlineMode,
    signInAnonymously,
    signOut,
    updateUsername,
    setCurrentUserId,
  };
};

export default useAuth; 