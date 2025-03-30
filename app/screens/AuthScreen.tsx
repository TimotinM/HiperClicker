import React, { useState, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar, Image, ActivityIndicator, Alert } from 'react-native';
import { Text, Button, Card, TextInput, Switch, Snackbar, DefaultTheme } from 'react-native-paper';
import { COLORS } from '../../config/settings';
import { useAuth } from '../hooks/useAuth';
import { useGame } from '../state/gameStore';
import supabase from '../utils/supabase';

const AuthScreen: React.FC = () => {
  const [username, setUsername] = useState('');
  const [offlineMode, setOfflineMode] = useState(false);
  const [customErrorMessage, setCustomErrorMessage] = useState<string | null>(null);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [authAttempts, setAuthAttempts] = useState(0);
  
  // Temă personalizată pentru TextInput
  const inputTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      text: COLORS.text,
      placeholder: COLORS.textSecondary,
      primary: COLORS.primary,
      background: COLORS.background,
      onSurfaceVariant: COLORS.text, // Pentru label când e activat
      onSurface: COLORS.text,        // Pentru text și outline când e inactiv
    },
  };
  
  const { signInAnonymously, isLoading, errorMessage, updateUsername, setCurrentUserId } = useAuth();
  const { setUserId, setOnlineMode } = useGame();
  
  // Resetăm mesajele de eroare când se schimbă modul offline
  useEffect(() => {
    setCustomErrorMessage(null);
  }, [offlineMode]);
  
  // Sugerăm modul offline după eșuarea mai multor încercări
  useEffect(() => {
    if (authAttempts >= 2 && !offlineMode) {
      setCustomErrorMessage("Se pare că există probleme de conexiune. Îți sugerăm să folosești modul offline.");
    }
  }, [authAttempts, offlineMode]);
  
  // Validăm numele de utilizator
  const validateUsername = (name: string): boolean => {
    // Numele trebuie să aibă minim 3 caractere
    if (name && name.trim().length < 3) {
      setCustomErrorMessage('Numele trebuie să aibă minim 3 caractere');
      return false;
    }
    setCustomErrorMessage(null);
    return true;
  };
  
  // Funcția pentru autentificare
  const handleLogin = async () => {
    // Resetăm mesajele de eroare
    setCustomErrorMessage(null);
    
    if (offlineMode) {
      // Mod offline
      console.log("Utilizatorul a ales modul offline");
      setUserId(null);
      setOnlineMode(false);
      return;
    }
    
    // Validăm numele de utilizator dacă a fost introdus
    if (username && !validateUsername(username)) {
      return;
    }
    
    try {
      console.log("Încercăm autentificarea anonimă...");
      // Incrementăm contorul de încercări
      setAuthAttempts(prev => prev + 1);
      
      // Autentificare anonimă prin Supabase
      const success = await signInAnonymously(username, offlineMode);
      
      if (success) {
        console.log("Autentificare reușită, setăm modul online");
        setOnlineMode(true);
        
        // După autentificare, așteptăm puțin pentru a ne asigura că starea de autentificare este complet actualizată
        setTimeout(async () => {
          // Actualizăm numele de utilizator dacă a fost furnizat
          if (username.trim()) {
            console.log("Actualizăm numele de utilizator la:", username.trim());
            try {
              // Verificăm dacă autentificarea a fost finalizată complet și obținem userId
              const { data: { session } } = await supabase.auth.getSession();
              
              if (session && session.user) {
                console.log("Sesiune validă găsită, userId:", session.user.id);
                
                // Setăm userId-ul direct pentru a evita probleme de sincronizare
                setCurrentUserId(session.user.id);
                
                // Așteptăm o fracțiune de secundă pentru a permite propagarea stării
                await new Promise(resolve => setTimeout(resolve, 100));
                
                const updateSuccess = await updateUsername(username.trim());
                if (!updateSuccess) {
                  console.warn("Actualizarea numelui de utilizator a eșuat");
                }
              } else {
                console.warn("Nu s-a putut actualiza numele - sesiune invalidă");
              }
            } catch (updateError) {
              console.error("Eroare la actualizarea numelui:", updateError);
              // Nu afișăm eroarea la utilizator, continuăm cu autentificarea
            }
          }
        }, 1500); // Păstrăm timpul de așteptare la 1.5 secunde
      } else {
        console.log("Autentificarea a eșuat, afișăm notificare");
        // Verificăm dacă există un mesaj specific de eroare
        if (!errorMessage) {
          setCustomErrorMessage("Autentificarea a eșuat. Poți încerca din nou sau să folosești modul offline.");
        }
        setShowSnackbar(true);
        
        // După 3 încercări eșuate, sugerăm modul offline
        if (authAttempts >= 2) {
          setOfflineMode(true);
        }
      }
    } catch (error) {
      console.error("Eroare în handleLogin:", error);
      setAuthAttempts(prev => prev + 1);
      
      setCustomErrorMessage(error instanceof Error 
        ? `Eroare: ${error.message}` 
        : "A apărut o eroare. Încearcă din nou sau folosește modul offline.");
      setShowSnackbar(true);
      
      // După 3 încercări eșuate, sugerăm modul offline
      if (authAttempts >= 2) {
        setOfflineMode(true);
      }
    }
  };
  
  // Mesajul de eroare poate veni fie din hook, fie din validarea locală
  const displayError = customErrorMessage || errorMessage;
  
  // Formăm un mesaj mai prietenos pentru utilizator
  const getSnackbarMessage = () => {
    if (displayError) {
      if (displayError.includes("Email address") && displayError.includes("invalid")) {
        return "Probleme cu serverul de autentificare. Poți folosi modul offline pentru a juca.";
      }
      if (displayError.includes("conexiune")) {
        return "Nu există conexiune la internet. Folosește modul offline.";
      }
      return displayError;
    }
    return "A apărut o eroare de autentificare. Încearcă din nou sau folosește modul offline.";
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.background} barStyle="light-content" />
      
      <View style={styles.header}>
        <Text style={styles.title}>HiperClicker</Text>
        <Text style={styles.subtitle}>Devine viral cu fiecare TAP!</Text>
      </View>
      
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Bine ai venit!</Text>
          
          <TextInput
            label="Nume de utilizator (opțional)"
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              if (customErrorMessage) validateUsername(text);
            }}
            style={styles.input}
            mode="outlined"
            outlineColor={COLORS.border}
            activeOutlineColor={COLORS.primary}
            disabled={isLoading}
            theme={inputTheme}
            placeholderTextColor={COLORS.textSecondary}
            textColor={COLORS.text}
          />
          
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Mod offline</Text>
            <Switch
              value={offlineMode}
              onValueChange={setOfflineMode}
              color={COLORS.primary}
              disabled={isLoading}
            />
          </View>
          
          {displayError && (
            <Text style={styles.errorText}>
              {displayError}
            </Text>
          )}
          
          <Button
            mode="contained"
            style={styles.button}
            labelStyle={styles.buttonLabel}
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
          >
            {offlineMode ? 'JOACĂ OFFLINE' : 'ÎNCEPE SĂ JOCI'}
          </Button>
          
          <Text style={styles.infoText}>
            {offlineMode 
              ? 'În modul offline, progresul tău nu va fi salvat online și nu vei apărea în clasament.' 
              : 'În modul online, progresul tău va fi sincronizat și vei apărea în clasamentul global.'}
          </Text>
        </Card.Content>
      </Card>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Creează conținut, acumulează vizualizări și ajunge faimos!
        </Text>
      </View>
      
      <Snackbar
        visible={showSnackbar}
        onDismiss={() => setShowSnackbar(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {getSnackbarMessage()}
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: COLORS.primary,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.text,
    marginTop: 8,
  },
  card: {
    width: '90%',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
    backgroundColor: COLORS.background,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  switchLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  errorText: {
    color: COLORS.notification,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    borderRadius: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 16,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: COLORS.text,
    opacity: 0.7,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  snackbar: {
    backgroundColor: COLORS.notification,
  },
});

export default AuthScreen; 