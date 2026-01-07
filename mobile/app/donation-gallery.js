import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, 
  Image, ActivityIndicator, Dimensions, TextInput, StatusBar 
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import api from '../src/services/api';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#1A3C40',
  secondary: '#417D7A',
  accent: '#F4A261', 
  background: '#FBFBFB',
  card: '#FFFFFF',
  textMain: '#1A1A1A',
  textSub: '#888888',
  divider: '#F0F0F0',
  success: '#2E7D32',
  progressBg: '#E0E0E0'
};

export default function DonationGallery() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // 1. DEKLARASI FUNGSI DULU (SEBELUM DIPANGGIL)
  const fetchCampaigns = async () => {
    try {
      const res = await api.get('/data/campaigns');
      setCampaigns(res.data);
    } catch (error) {
      console.log('Error fetch campaigns:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 2. BARU DIPANGGIL DI USE EFFECT
  useEffect(() => { 
    fetchCampaigns(); 
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCampaigns();
  };

  const goToHistory = () => {
    router.push({ pathname: '/history', params: { initialTab: 'donasi' } });
  };

  const filteredData = useMemo(() => {
    return campaigns.filter(c => 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.shelter?.nickname.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [campaigns, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalDonation = campaigns.reduce((acc, curr) => {
    return acc + (parseInt(curr.currentAmount) || 0);
  }, 0);
  
  const totalCampaigns = campaigns.length;

  const formatRupiah = (num) => {
    return 'Rp ' + parseInt(num).toLocaleString('id-ID');
  };

  const getPercent = (current, target) => {
    const pct = Math.round((parseInt(current) / parseInt(target)) * 100);
    return pct > 100 ? 100 : pct;
  };

  const handleShelterClick = (shelterId) => {
    if (shelterId) {
      router.push({ pathname: '/shelter-detail', params: { id: shelterId } });
    }
  };

  // --- RENDER ITEM ---
  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.9}
      onPress={() => router.push({ pathname: '/donation-detail', params: { id: item.id } })}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.cardImg} />
      
      {/* SHELTER BADGE (FIXED CLICKABLE) */}
      <TouchableOpacity 
        style={styles.shelterBadge} 
        onPress={() => handleShelterClick(item.shelter?.id)}
        activeOpacity={0.8}
      >
        <Image 
          source={{ uri: item.shelter?.shelterPhotos?.split(',')[0] || 'https://via.placeholder.com/50' }} 
          style={styles.shelterAvatar} 
        />
        <Text style={styles.shelterName} numberOfLines={1}>{item.shelter?.nickname}</Text>
      </TouchableOpacity>

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${getPercent(item.currentAmount, item.targetAmount)}%` }]} />
        </View>
        
        <View style={styles.statsRow}>
          <View>
            <Text style={styles.statsLabel}>Terkumpul</Text>
            <Text style={styles.statsValue}>{formatRupiah(item.currentAmount)}</Text>
          </View>
          <View style={{alignItems:'flex-end'}}>
            <Text style={styles.statsLabel}>Target</Text>
            <Text style={styles.statsTarget}>{formatRupiah(item.targetAmount)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Donasi & Kebaikan</Text>
        
        <TouchableOpacity style={styles.historyBtn} onPress={goToHistory}>
          <MaterialCommunityIcons name="history" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Feather name="search" size={18} color="#999" />
        <TextInput 
          placeholder="Cari program donasi..." 
          style={styles.input} 
          value={searchQuery}
          onChangeText={(text) => { setSearchQuery(text); setCurrentPage(1); }} 
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => { setSearchQuery(''); setCurrentPage(1); }}>
            <Feather name="x-circle" size={18} color="#CCC" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={currentData}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
          
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="hand-heart-outline" size={60} color="#DDD" />
              <Text style={styles.emptyText}>Belum ada program donasi.</Text>
            </View>
          }

          ListFooterComponent={
            <>
              {filteredData.length > itemsPerPage && (
                <View style={styles.pagination}>
                  <TouchableOpacity style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]} disabled={currentPage === 1} onPress={() => setCurrentPage(p => p - 1)}>
                    <Feather name="chevron-left" size={20} color={currentPage === 1 ? "#CCC" : "#FFF"} />
                  </TouchableOpacity>
                  <Text style={styles.pageText}>{currentPage} / {totalPages}</Text>
                  <TouchableOpacity style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]} disabled={currentPage === totalPages} onPress={() => setCurrentPage(p => p + 1)}>
                    <Feather name="chevron-right" size={20} color={currentPage === totalPages ? "#CCC" : "#FFF"} />
                  </TouchableOpacity>
                </View>
              )}

              {filteredData.length > 0 && (
                <View style={styles.footerStats}>
                  <Text style={styles.footerTitle}>Dampak Kebaikanmu</Text>
                  <Text style={styles.footerSub}>Bersama kita bantu anabul hidup layak.</Text>
                  
                  <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                      <View style={styles.iconCircle}>
                        <FontAwesome5 name="hand-holding-heart" size={20} color={COLORS.accent} />
                      </View>
                      <Text style={styles.statBoxVal}>{formatRupiah(totalDonation)}</Text>
                      <Text style={styles.statBoxLabel}>Total Donasi</Text>
                    </View>
                    
                    <View style={styles.statDivider} />

                    <View style={styles.statBox}>
                      <View style={[styles.iconCircle, {backgroundColor: '#E3F2FD'}]}>
                        <FontAwesome5 name="cat" size={20} color={COLORS.info} />
                      </View>
                      <Text style={styles.statBoxVal}>{totalCampaigns}</Text>
                      <Text style={styles.statBoxLabel}>Program Aktif</Text>
                    </View>
                  </View>
                </View>
              )}
              <View style={{height: 30}} />
            </>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 10 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  historyBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', marginHorizontal: 20, height: 50, borderRadius: 16, paddingHorizontal: 15, borderWidth: 1, borderColor: '#EEE', marginBottom: 15 },
  input: { flex: 1, marginLeft: 10, fontSize: 14, color: COLORS.textMain, fontWeight: '500' },
  
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  
  card: { backgroundColor: '#FFF', borderRadius: 20, marginBottom: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: {width:0, height:4}, overflow: 'hidden' },
  cardImg: { width: '100%', height: 180, resizeMode: 'cover' },
  
  // SHELTER BADGE (Z-INDEX PENTING BIAR BISA DIKLIK)
  shelterBadge: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.95)', padding: 6, paddingRight: 12, borderRadius: 20, elevation: 3, zIndex: 10 },
  shelterAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#EEE', marginRight: 8 },
  shelterName: { fontSize: 11, fontWeight: '700', color: COLORS.primary, maxWidth: 150 },

  cardContent: { padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textMain, marginBottom: 16, lineHeight: 22 },
  progressContainer: { height: 8, backgroundColor: COLORS.progressBg, borderRadius: 4, marginBottom: 10, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: COLORS.accent, borderRadius: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  statsLabel: { fontSize: 10, color: COLORS.textSub, marginBottom: 2 },
  statsValue: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  statsTarget: { fontSize: 12, fontWeight: '600', color: COLORS.textSub },

  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 10, gap: 20 },
  pageBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  pageBtnDisabled: { backgroundColor: '#EEE', elevation: 0 },
  pageText: { fontSize: 16, fontWeight: '800', color: COLORS.primary },

  footerStats: { backgroundColor: COLORS.primary, borderRadius: 24, padding: 24, marginTop: 20, alignItems: 'center', position: 'relative', overflow: 'hidden' },
  footerTitle: { fontSize: 18, fontWeight: '900', color: '#FFF', marginBottom: 4 },
  footerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 20 },
  statsGrid: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 15, width: '100%', justifyContent: 'space-around', alignItems: 'center' },
  statBox: { alignItems: 'center' },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statBoxVal: { fontSize: 16, fontWeight: '900', color: '#FFF' },
  statBoxLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },

  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#999', marginTop: 15, fontSize: 14 },
  resetText: { color: COLORS.secondary, fontWeight: 'bold', marginTop: 10 },
});