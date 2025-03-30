import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Switch, Alert, Linking } from 'react-native';
import { Text, Card, Button, TextInput, Divider, Avatar } from 'react-native-paper';
import { FontAwesome5 } from '@expo/vector-icons';
import LinearGradient from '../components/LinearGradientFix';
import { COLORS } from '../../config/settings';
import { useAuth } from '../hooks/useAuth';
import { useGame } from '../state/gameStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// Tipul pentru proprietățile ecranului
type SettingsScreenProps = NativeStackScreenProps<any, 'Settings'>;

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { 
    username, 
    isOnlineMode, 
    updateUsername, 
    signOut 
  } = useAuth();
  
  const { resetGame, syncProgress, setOnlineMode } = useGame();
  
  // State pentru gestionarea formularului
  const [newUsername, setNewUsername] = useState(username || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showUsernameForm, setShowUsernameForm] = useState(false);
  const [isOnlineSwitchEnabled, setIsOnlineSwitchEnabled] = useState(isOnlineMode);
  
  // Handler pentru resetarea jocului
  const handleReset = () => {
    Alert.alert(
      'Resetare progres',
      'Ești sigur că vrei să resetezi tot progresul? Această acțiune nu poate fi anulată!',
      [
        {
          text: 'Anulează',
          style: 'cancel',
        },
        {
          text: 'Resetează',
          onPress: () => {
            resetGame();
            Alert.alert(
              'Progres resetat',
              'Tot progresul tău a fost resetat cu succes.'
            );
          },
          style: 'destructive',
        },
      ]
    );
  };
  
  // Handler pentru sincronizare
  const handleSync = async () => {
    if (!isOnlineMode) {
      Alert.alert(
        'Mod offline',
        'Nu te poți sincroniza în modul offline. Activează modul online și încearcă din nou.'
      );
      return;
    }
    
    try {
      const success = await syncProgress();
      if (success) {
        Alert.alert(
          'Sincronizare reușită',
          'Progresul tău a fost sincronizat cu succes.'
        );
      } else {
        Alert.alert(
          'Eroare de sincronizare',
          'Nu s-a putut sincroniza progresul. Încearcă din nou mai târziu.'
        );
      }
    } catch (error) {
      Alert.alert(
        'Eroare de sincronizare',
        'A apărut o eroare la sincronizarea progresului. Încearcă din nou mai târziu.'
      );
    }
  };
  
  // Handler pentru actualizarea numelui de utilizator
  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) {
      Alert.alert('Nume de utilizator invalid', 'Te rugăm să introduci un nume de utilizator valid.');
      return;
    }
    
    if (newUsername.trim() === username) {
      setShowUsernameForm(false);
      return;
    }
    
    setIsUpdating(true);
    try {
      const success = await updateUsername(newUsername.trim());
      if (success) {
        Alert.alert(
          'Nume actualizat',
          `Numele tău de utilizator a fost schimbat în "${newUsername.trim()}".`
        );
        setShowUsernameForm(false);
      } else {
        Alert.alert(
          'Eroare',
          'Nu s-a putut actualiza numele de utilizator. Încearcă din nou mai târziu.'
        );
      }
    } catch (error) {
      Alert.alert(
        'Eroare',
        'A apărut o eroare la actualizarea numelui de utilizator. Încearcă din nou mai târziu.'
      );
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Handler pentru schimbarea modului online/offline
  const toggleOnlineMode = () => {
    const newValue = !isOnlineSwitchEnabled;
    setIsOnlineSwitchEnabled(newValue);
    setOnlineMode(newValue);
    
    if (newValue) {
      // Sincronizăm automat dacă trecem în modul online
      syncProgress();
    }
  };
  
  // Handler pentru deconectare
  const handleSignOut = () => {
    Alert.alert(
      'Deconectare',
      'Ești sigur că vrei să te deconectezi? Progresul tău va fi salvat.',
      [
        {
          text: 'Anulează',
          style: 'cancel',
        },
        {
          text: 'Deconectează-te',
          onPress: signOut,
        },
      ]
    );
  };
  
  return (
    <ScrollView style={styles.container}>
      {/* Secțiunea de profil */}
      <Card style={styles.profileCard}>
        <LinearGradient
          colors={[COLORS.gradient.start, COLORS.gradient.end]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.profileHeader}
        >
          <Avatar.Image 
            size={80} 
            source={require('../../assets/default-avatar.png')} 
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.usernameText}>@{username || 'user'}</Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusIndicator, { backgroundColor: isOnlineMode ? COLORS.success : COLORS.disabled }]} />
              <Text style={styles.statusText}>{isOnlineMode ? 'Online' : 'Offline'}</Text>
            </View>
          </View>
        </LinearGradient>
      </Card>
      
      {/* Setări cont */}
      <Card style={styles.settingsCard}>
        <Card.Title 
          title="Setări cont" 
          left={(props) => <FontAwesome5 name="user-cog" size={24} color={COLORS.primary} />}
        />
        <Card.Content>
          {showUsernameForm ? (
            <View style={styles.formGroup}>
              <TextInput
                label="Nume utilizator nou"
                value={newUsername}
                onChangeText={setNewUsername}
                style={styles.input}
                autoCapitalize="none"
                disabled={isUpdating}
                maxLength={20}
              />
              <View style={styles.buttonRow}>
                <Button 
                  mode="outlined" 
                  onPress={() => setShowUsernameForm(false)} 
                  style={styles.cancelButton}
                  disabled={isUpdating}
                >
                  Anulează
                </Button>
                <Button 
                  mode="contained" 
                  onPress={handleUpdateUsername} 
                  style={styles.saveButton}
                  loading={isUpdating}
                  disabled={isUpdating || newUsername.trim() === username || !newUsername.trim()}
                >
                  Salvează
                </Button>
              </View>
            </View>
          ) : (
            <Button 
              mode="outlined" 
              icon="account-edit" 
              onPress={() => setShowUsernameForm(true)}
              style={styles.actionButton}
            >
              Schimbă numele de utilizator
            </Button>
          )}
          
          <Divider style={styles.divider} />
          
          <View style={styles.switchContainer}>
            <Text>Mod online</Text>
            <Switch
              value={isOnlineSwitchEnabled}
              onValueChange={toggleOnlineMode}
              trackColor={{ false: COLORS.disabled, true: COLORS.primary }}
              thumbColor={isOnlineSwitchEnabled ? COLORS.secondary : '#f4f3f4'}
            />
          </View>
          
          <Text style={styles.helperText}>
            {isOnlineSwitchEnabled 
              ? 'Modul online îți permite să sincronizezi progresul și să apari în clasament.' 
              : 'În modul offline nu te poți sincroniza sau apărea în clasament, dar jocul funcționează fără conexiune la internet.'}
          </Text>
        </Card.Content>
      </Card>
      
      {/* Sincronizare și date */}
      <Card style={styles.settingsCard}>
        <Card.Title 
          title="Sincronizare și date" 
          left={(props) => <FontAwesome5 name="sync" size={24} color={COLORS.primary} />}
        />
        <Card.Content>
          <Button 
            mode="outlined" 
            icon="cloud-sync" 
            onPress={handleSync}
            style={styles.actionButton}
            disabled={!isOnlineMode}
          >
            Sincronizează progresul
          </Button>
          
          <Divider style={styles.divider} />
          
          <Button 
            mode="outlined" 
            icon="refresh" 
            onPress={handleReset}
            style={[styles.actionButton, styles.dangerButton]}
          >
            Resetează progresul
          </Button>
          
          <Text style={styles.helperText}>
            Această acțiune va șterge tot progresul tău și va reseta jocul la valorile inițiale.
          </Text>
        </Card.Content>
      </Card>
      
      {/* Despre aplicație */}
      <Card style={styles.settingsCard}>
        <Card.Title 
          title="Despre aplicație" 
          left={(props) => <FontAwesome5 name="info-circle" size={24} color={COLORS.primary} />}
        />
        <Card.Content>
          <Text style={styles.appInfo}>
            HiperClicker v1.0.0
          </Text>
          <Text style={styles.helperText}>
            O aplicație distractivă pentru a simula viața de creatori de conținut viral pe rețelele sociale.
          </Text>
          
          <Divider style={styles.divider} />
          
          <Button 
            mode="outlined" 
            icon="heart" 
            onPress={() => Linking.openURL('https://example.com/support')}
            style={styles.actionButton}
          >
            Susține dezvoltatorii
          </Button>
        </Card.Content>
      </Card>
      
      {/* Deconectare */}
      <Button 
        mode="contained" 
        icon="logout" 
        onPress={handleSignOut}
        style={styles.signOutButton}
      >
        Deconectare
      </Button>
      
      {/* Spațiu suplimentar la final */}
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  profileCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
  },
  profileHeader: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  profileInfo: {
    marginLeft: 16,
  },
  usernameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: COLORS.text,
    opacity: 0.8,
  },
  settingsCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
  },
  formGroup: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'transparent',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    marginRight: 8,
    borderColor: COLORS.border,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  actionButton: {
    marginVertical: 4,
  },
  dangerButton: {
    borderColor: COLORS.warning,
    color: COLORS.warning,
  },
  divider: {
    marginVertical: 16,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 8,
  },
  appInfo: {
    fontSize: 16,
    color: COLORS.text,
    marginVertical: 8,
  },
  signOutButton: {
    marginVertical: 16,
    backgroundColor: COLORS.warning,
  },
  bottomPadding: {
    height: 40,
  },
});

export default SettingsScreen; 