import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity, 
  TextInput, ActivityIndicator, StatusBar 
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import api from '../src/services/api';

export default function ShelterGalleryScreen() {
  const router = useRouter();
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchShelters();
  }, []);

  const fetchShelters = async () => {
    try {
      const res = await api.get('/clinics'); 
      console.log("Data Shelter yang didapat:", res.data.length); // Cek jumlah di terminal
      setShelters(res.data);
    } catch (error) {
      console.log('Error fetching shelters:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- FILTER PENCARIAN ---
  const filteredShelters = shelters.filter(item => {
    if (!search) return true; // Kalau search kosong, TAMPILKAN SEMUA

    const searchText = search.toLowerCase();
    
    // Fallback: Cek nickname, kalau kosong cek name, kalau kosong anggap string kosong
    const nameToCheck = item.nickname || item.name || '';
    const addressToCheck = item.shelterAddress || '';
    const servicesToCheck = item.services || '';

    return nameToCheck.toLowerCase().includes(searchText) || 
           addressToCheck.toLowerCase().includes(searchText) ||
           servicesToCheck.toLowerCase().includes(searchText);
  });

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push({
        pathname: '/shelter-detail',
        params: { id: item.id }
      })}
    >
      <Image 
        source={{ uri: item.shelterPhotos ? item.shelterPhotos.split(',')[0] : 'https://placehold.co/400x300.png' }} 
        style={styles.cardImage} 
      />
      <View style={styles.cardContent}>
        <View style={styles.rowBetween}>
          {/* Prioritaskan Nickname, kalau gada pakai Name */}
          <Text style={styles.cardTitle}>{item.nickname || item.name || 'Mitra Shelter'}</Text>
          
          {item.isClinic && (
            <View style={styles.badgeClinic}>
              <FontAwesome5 name="hospital" size={10} color="#FFF" />
              <Text style={styles.badgeText}>Klinik</Text>
            </View>
          )}
        </View>

        <View style={styles.rowLocation}>
          <Feather name="map-pin" size={12} color="#666" />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.shelterAddress || 'Lokasi belum diatur'}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
             <FontAwesome5 name="cat" size={12} color="#12464C" />
             <Text style={styles.statText}>{item.catsRescued || 0} Rescue</Text>
          </View>
          <View style={styles.statItem}>
             <Feather name="calendar" size={12} color="#12464C" />
             <Text style={styles.statText}>Est. {item.operatingYear || '-'}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={{flexDirection:'row', alignItems:'center', marginBottom: 15}}>
          <TouchableOpacity onPress={() => router.back()} style={{marginRight:10}}>
             <Feather name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mitra Shelter & Klinik</Text>
        </View>

        <View style={styles.searchBar}>
          <Feather name="search" size={20} color="#999" />
          <TextInput 
            style={styles.input}
            placeholder="Cari mitra..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#12464C" />
        </View>
      ) : (
        <FlatList
          data={filteredShelters}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 20 }}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.center}>
               <FontAwesome5 name="store-slash" size={40} color="#DDD" />
               <Text style={{color:'#999', marginTop:10}}>
                 {search ? 'Pencarian tidak ditemukan.' : 'Tidak ada data shelter.'}
               </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { backgroundColor: '#FFF', padding: 20, paddingBottom: 15, elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F0F0', borderRadius: 10, paddingHorizontal: 12, height: 45 },
  input: { flex: 1, marginLeft: 10, fontSize: 14 },
  card: { backgroundColor: '#FFF', borderRadius: 12, marginBottom: 15, overflow: 'hidden', elevation: 2 },
  cardImage: { width: '100%', height: 140, backgroundColor: '#EEE' },
  cardContent: { padding: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1, marginRight: 5 },
  badgeClinic: { flexDirection:'row', backgroundColor: '#E91E63', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, alignItems:'center', gap: 4 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  rowLocation: { flexDirection: 'row', alignItems: 'center', marginTop: 6, marginBottom: 10 },
  locationText: { fontSize: 12, color: '#666', marginLeft: 5, flex: 1 },
  statsRow: { flexDirection: 'row', gap: 15, borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 10 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statText: { fontSize: 12, color: '#555', fontWeight: '500' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 }
});