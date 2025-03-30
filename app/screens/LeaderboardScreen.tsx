import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Image, Dimensions } from 'react-native';
import { Text, Card, Badge, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../config/settings';
import { getLeaderboard } from '../utils/supabase';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// Tipul pentru elementele din clasament
interface LeaderboardItem {
  userId: string;
  username: string;
  totalViews: number;
  rank: number;
}

// Tipul pentru proprietățile ecranului
type LeaderboardScreenProps = NativeStackScreenProps<any, 'Leaderboard'>;

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ navigation }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { userId } = useAuth();
  
  // Funcție pentru formatarea numerelor mari
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return Math.floor(num).toString();
  };
  
  // Funcție pentru obținerea clasamentului
  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await getLeaderboard();
      setLeaderboard(data);
    } catch (error) {
      console.error('Eroare la încărcarea clasamentului:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Funcție pentru actualizarea clasamentului (pull-to-refresh)
  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };
  
  // Încărcăm clasamentul la deschiderea ecranului
  useEffect(() => {
    fetchLeaderboard();
  }, []);
  
  // Funcție de randare pentru elementele din clasament
  const renderItem = ({ item, index }: { item: LeaderboardItem; index: number }) => {
    const isCurrentUser = item.userId === userId;
    
    // Definim stilurile pentru podium (primele 3 poziții)
    let podiumStyle = {};
    let podiumColor = '';
    let badgeColor = '';
    
    // Setăm stilurile în funcție de poziție
    switch (item.rank) {
      case 1:
        podiumStyle = styles.firstPlace;
        podiumColor = '#FFD700'; // Aur
        badgeColor = '#C9B037';
        break;
      case 2:
        podiumStyle = styles.secondPlace;
        podiumColor = '#C0C0C0'; // Argint
        badgeColor = '#D7D7D7';
        break;
      case 3:
        podiumStyle = styles.thirdPlace;
        podiumColor = '#CD7F32'; // Bronz
        badgeColor = '#AD8A56';
        break;
      default:
        podiumColor = COLORS.textSecondary;
        badgeColor = COLORS.disabled;
    }
    
    return (
      <Card 
        style={[
          styles.card, 
          isCurrentUser && styles.currentUserCard,
          item.rank <= 3 && podiumStyle
        ]} 
        elevation={isCurrentUser ? 4 : 2}
      >
        <LinearGradient
          colors={[isCurrentUser ? 'rgba(255,77,79,0.1)' : 'rgba(0,0,0,0)', 'rgba(0,0,0,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardGradient}
        >
          <View style={styles.rankContainer}>
            <View style={[styles.rankBadge, { backgroundColor: badgeColor }]}>
              <Text style={styles.rankText}>{item.rank}</Text>
            </View>
          </View>
          
          <View style={styles.userInfo}>
            <View style={styles.usernameContainer}>
              <Text 
                style={[
                  styles.username, 
                  isCurrentUser && styles.currentUsername,
                  item.rank <= 3 && { color: podiumColor }
                ]}
              >
                @{item.username}
              </Text>
              {isCurrentUser && (
                <Badge style={styles.userBadge}>TU</Badge>
              )}
            </View>
            <Text style={styles.subtitleText}>
              <FontAwesome5 name="fire" size={12} color={COLORS.primary} /> Utilizator activ
            </Text>
          </View>
          
          <View style={styles.statsContainer}>
            <Text style={styles.viewsCount}>{formatNumber(item.totalViews)}</Text>
            <Text style={styles.viewsLabel}>vizualizări</Text>
          </View>
        </LinearGradient>
      </Card>
    );
  };
  
  return (
    <View style={styles.container}>
      <Card style={styles.headerCard} elevation={4}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <Text style={styles.headerTitle}>Top Creatori</Text>
          <Text style={styles.headerSubtitle}>Vezi cine are cele mai multe vizualizări</Text>
        </LinearGradient>
      </Card>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Se încarcă clasamentul...</Text>
        </View>
      ) : (
        <FlatList
          data={leaderboard}
          renderItem={renderItem}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesome5 name="trophy" size={48} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>Niciun utilizator în clasament</Text>
              <Text style={styles.emptySubtext}>Fii primul care urcă în top!</Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
      )}
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  headerGradient: {
    padding: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  card: {
    marginBottom: 12,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
  },
  cardGradient: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  currentUserCard: {
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  firstPlace: {
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  secondPlace: {
    borderLeftWidth: 4,
    borderLeftColor: '#C0C0C0',
  },
  thirdPlace: {
    borderLeftWidth: 4,
    borderLeftColor: '#CD7F32',
  },
  rankContainer: {
    marginRight: 16,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  userInfo: {
    flex: 1,
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginRight: 8,
  },
  currentUsername: {
    color: COLORS.primary,
  },
  userBadge: {
    backgroundColor: COLORS.primary,
    fontSize: 10,
  },
  subtitleText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statsContainer: {
    alignItems: 'center',
  },
  viewsCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  viewsLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
});

export default LeaderboardScreen; 