import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  Image, ActivityIndicator, Dimensions, TextInput, StatusBar, RefreshControl 
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../src/services/api';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#1A3C40',
  secondary: '#417D7A',
  background: '#FBFBFB',
  card: '#FFFFFF',
  textSub: '#777777',
};

export default function AdopsiScreen() {
  const router = useRouter();
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchCats(); }, []);

  const fetchCats = async () => {
    try {
      const res = await api.get('/data/cats');
      setCats(res.data);
    } catch (error) {
      console.log('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCats();
  };

  // Filter Search
  const filteredCats = cats.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    cat.breed.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatAge = (totalMonths) => {
    if (totalMonths < 12) return `${totalMonths} Bln`;
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    return months === 0 ? `${years} Thn` : `${years}th ${months}bln`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* HEADER KHUSUS TAB */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Adopsi Anabul 🐾</Text>
        <Text style={styles.headerSub}>Temukan teman bulu impianmu di sini.</Text>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color="#999" />
          <TextInput 
            placeholder="Cari ras atau nama..." 
            style={styles.input} 
            value={searchQuery} 
            onChangeText={setSearchQuery} 
          />
        </View>
      </View>

      {/* LIST KUCING */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop: 50}} />
      ) : (
        <ScrollView 
          contentContainerStyle={styles.grid} 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.row}>
            {filteredCats.map((cat) => (
              <TouchableOpacity 
                key={cat.id} 
                style={styles.card} 
                activeOpacity={0.9}
                onPress={() => router.push({ pathname: '/cat-detail', params: { id: cat.id } })}
              >
                <Image source={{ uri: cat.images?.split(',')[0] }} style={styles.cardImg} />
                
                <View style={styles.cardInfo}>
                  <Text style={styles.catName} numberOfLines={1}>{cat.name}</Text>
                  
                  <View style={styles.miniTagWrapper}>
                    {cat.personality?.split(',').slice(0, 1).map((p, i) => (
                      <View key={i} style={styles.miniTagPerso}><Text style={styles.miniTagText}>{p}</Text></View>
                    ))}
                  </View>

                  <View style={styles.cardFooter}>
                    <View style={styles.locBox}>
                      <Ionicons name="location-sharp" size={10} color={COLORS.secondary} />
                      <Text style={styles.locText} numberOfLines={1}>
                        {cat.shelter?.shelterAddress?.split(',')[0] || 'Shelter'}
                      </Text>
                    </View>
                    <Text style={styles.ageLabel}>{formatAge(cat.age)}</Text>
                  </View>
                </View>

                <View style={[styles.miniGender, { backgroundColor: cat.gender === 'Jantan' ? '#E3F2FD' : '#FCE4EC' }]}>
                  <MaterialCommunityIcons name={cat.gender === 'Jantan' ? 'gender-male' : 'gender-female'} size={12} color={cat.gender === 'Jantan' ? '#1976D2' : '#C2185B'} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{height: 80}} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15, backgroundColor: '#FFF' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.primary },
  headerSub: { fontSize: 14, color: '#888', marginTop: 4 },
  searchSection: { paddingHorizontal: 20, marginBottom: 15 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', height: 45, borderRadius: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: '#EEE' },
  input: { flex: 1, marginLeft: 12, fontSize: 14, color: COLORS.primary },
  grid: { paddingHorizontal: 20, paddingBottom: 50 },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: (width / 2) - 28, backgroundColor: '#FFF', borderRadius: 16, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, overflow: 'hidden' },
  cardImg: { width: '100%', height: 140, resizeMode: 'cover' },
  cardInfo: { padding: 10 },
  catName: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  miniTagWrapper: { flexDirection: 'row', marginTop: 6, marginBottom: 8 },
  miniTagPerso: { backgroundColor: '#F4A26120', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  miniTagText: { fontSize: 9, fontWeight: '800', color: COLORS.secondary },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: 6 },
  locBox: { flexDirection: 'row', alignItems: 'center', gap: 2, flex: 1, marginRight: 4 },
  locText: { fontSize: 9, color: COLORS.textSub, fontWeight: '700' },
  ageLabel: { fontSize: 9, color: COLORS.primary, fontWeight: '900' },
  miniGender: { position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)' },
});