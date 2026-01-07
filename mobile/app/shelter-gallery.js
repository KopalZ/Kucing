import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  Image, ActivityIndicator, Dimensions, StatusBar, TextInput, Modal, Switch 
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../src/services/api';

const { width, height } = Dimensions.get('window');

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
  danger: '#D32F2F',
  info: '#1976D2'
};

export default function ShelterGallery() {
  const router = useRouter();
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter State
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filter, setFilter] = useState({
    city: 'Semua',
    onlyClinic: false,
    openNow: false,
    services: [] // Array layanan yang dipilih
  });

  const [availableCities, setAvailableCities] = useState(['Semua']);
  
  // List Layanan untuk Filter
  const serviceOptions = ['Vaksin', 'Steril', 'Rawat Inap', 'UGD 24 Jam', 'Grooming', 'USG', 'Operasi', 'Adopsi'];

  useEffect(() => { fetchShelters(); }, []);

  const fetchShelters = async () => {
    try {
      const res = await api.get('/data/clinics'); 
      setShelters(res.data);
      
      const cities = new Set(['Semua']);
      res.data.forEach(c => {
        const city = getCity(c.shelterAddress);
        if (city !== 'Indonesia') cities.add(city);
      });
      setAvailableCities(Array.from(cities));
    } catch (error) {
      console.log('Error fetch shelters:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCity = (addr) => {
    if (!addr) return 'Indonesia';
    const parts = addr.split(',');
    return (parts.find(p => p.includes('Kota') || p.includes('Kab')) || parts[2] || parts[0]).trim();
  };

  const isOpenNow = (hoursStr) => {
    if (!hoursStr) return false;
    try {
      const timePart = hoursStr.split('(')[0].trim(); 
      const [start, end] = timePart.split('-').map(t => t.trim());
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const [startH, startM] = start.split(':').map(Number);
      const [endH, endM] = end.split(':').map(Number);
      return currentMinutes >= (startH * 60 + startM) && currentMinutes <= (endH * 60 + endM);
    } catch (e) { return false; }
  };

  const toggleServiceFilter = (svc) => {
    setFilter(prev => {
      const exists = prev.services.includes(svc);
      return { ...prev, services: exists ? prev.services.filter(s => s !== svc) : [...prev.services, svc] };
    });
  };

  const filteredShelters = useMemo(() => {
    return shelters.filter(c => {
      const matchSearch = c.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.shelterAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.services?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchCity = filter.city === 'Semua' || getCity(c.shelterAddress) === filter.city;
      const matchClinic = !filter.onlyClinic || c.isClinic;
      const matchOpen = !filter.openNow || isOpenNow(c.clinicOpenHours);

      // Filter Services (OR Logic: Punya salah satu service yang dipilih, atau AND logic tergantung kebutuhan)
      // Di sini kita pakai AND logic: Shelter harus punya SEMUA service yang dicentang
      const matchServices = filter.services.length === 0 || 
                            filter.services.every(s => c.services?.includes(s));

      return matchSearch && matchCity && matchClinic && matchOpen && matchServices;
    });
  }, [shelters, searchQuery, filter]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cari Shelter & Klinik</Text>
        <TouchableOpacity 
          style={[styles.filterIconBtn, (filter.city !== 'Semua' || filter.onlyClinic || filter.openNow || filter.services.length > 0) && styles.filterActive]} 
          onPress={() => setShowFilterModal(true)}
        >
          <Feather name="sliders" size={20} color={(filter.city !== 'Semua' || filter.onlyClinic || filter.openNow || filter.services.length > 0) ? '#FFF' : COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color="#999" />
          <TextInput 
            placeholder="Cari nama, lokasi, atau layanan..." 
            style={styles.input} 
            value={searchQuery} 
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop: 50}} />
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
          {filteredShelters.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="home-search-outline" size={60} color="#DDD" />
              <Text style={styles.emptyTitle}>Tidak Ditemukan</Text>
              <Text style={styles.emptyDesc}>Coba ubah filter atau kata kunci pencarian.</Text>
            </View>
          ) : (
            filteredShelters.map((item) => {
              const imgUri = item.shelterPhotos?.split(',')[0] || 'https://via.placeholder.com/400';
              const isOpen = isOpenNow(item.clinicOpenHours);
              // Ambil 3 layanan pertama buat ditampilin di card
              const displayServices = item.services ? item.services.split(',').slice(0, 3) : [];

              return (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.card} 
                  activeOpacity={0.9}
                  onPress={() => router.push({ pathname: '/shelter-detail', params: { id: item.id } })}
                >
                  <View style={styles.cardInner}>
                    <Image source={{ uri: imgUri }} style={styles.cardImg} />
                    
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{item.nickname}</Text>
                      
                      <View style={styles.locRow}>
                        <Ionicons name="location-outline" size={12} color={COLORS.textSub} />
                        <Text style={styles.locText} numberOfLines={1}>{getCity(item.shelterAddress)}</Text>
                      </View>

                      <View style={styles.badgeRow}>
                        {item.isClinic && (
                          <View style={[styles.statusChip, { backgroundColor: isOpen ? '#E8F5E9' : '#FFEBEE' }]}>
                            <Text style={[styles.statusText, { color: isOpen ? COLORS.success : COLORS.danger }]}>
                              {isOpen ? 'Buka' : 'Tutup'}
                            </Text>
                          </View>
                        )}
                        
                        {/* Tampilkan Badge Klinik / Shelter */}
                        <View style={[styles.typeBadge, { backgroundColor: item.isClinic ? COLORS.info : COLORS.secondary }]}>
                          <FontAwesome5 name={item.isClinic ? "medkit" : "home"} size={8} color="#FFF" style={{marginRight:4}} />
                          <Text style={styles.typeBadgeText}>{item.isClinic ? 'Klinik' : 'Shelter'}</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* BAGIAN BARU: SERVICE TAGS FOOTER */}
                  {displayServices.length > 0 && (
                    <View style={styles.cardFooter}>
                      <View style={styles.serviceRow}>
                        {displayServices.map((svc, i) => (
                          <View key={i} style={styles.miniServiceTag}>
                            <Text style={styles.miniServiceText}>{svc.trim()}</Text>
                          </View>
                        ))}
                        {item.services?.split(',').length > 3 && (
                          <Text style={styles.moreServiceText}>+{item.services.split(',').length - 3}</Text>
                        )}
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
          <View style={{height: 40}} />
        </ScrollView>
      )}

      {/* FILTER MODAL */}
      <Modal animationType="slide" transparent={true} visible={showFilterModal} statusBarTranslucent onRequestClose={() => setShowFilterModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Pencarian</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}><Feather name="x" size={24} color={COLORS.primary} /></TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              
              <Text style={styles.filterLabel}>Lokasi</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingBottom:10}}>
                {availableCities.map(city => (
                  <TouchableOpacity key={city} style={[styles.chip, filter.city === city && styles.chipActive]} onPress={() => setFilter({...filter, city})}>
                    <Text style={[styles.chipText, filter.city === city && styles.chipTextActive]}>{city}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.filterLabel}>Layanan Tersedia</Text>
              <View style={styles.serviceWrap}>
                {serviceOptions.map(svc => {
                  const isActive = filter.services.includes(svc);
                  return (
                    <TouchableOpacity key={svc} style={[styles.serviceChip, isActive && styles.serviceChipActive]} onPress={() => toggleServiceFilter(svc)}>
                      {isActive && <Ionicons name="checkmark" size={14} color="#FFF" style={{marginRight:4}} />}
                      <Text style={[styles.serviceChipText, isActive && styles.serviceChipTextActive]}>{svc}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.filterLabel}>Hanya yang Punya Klinik</Text>
                <Switch 
                  trackColor={{ false: "#767577", true: COLORS.secondary }}
                  thumbColor={filter.onlyClinic ? COLORS.primary : "#f4f3f4"}
                  onValueChange={() => setFilter({...filter, onlyClinic: !filter.onlyClinic})}
                  value={filter.onlyClinic}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.filterLabel}>Sedang Buka</Text>
                <Switch 
                  trackColor={{ false: "#767577", true: COLORS.secondary }}
                  thumbColor={filter.openNow ? COLORS.primary : "#f4f3f4"}
                  onValueChange={() => setFilter({...filter, openNow: !filter.openNow})}
                  value={filter.openNow}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.resetBtn} onPress={() => setFilter({city:'Semua', onlyClinic:false, openNow:false, services: []})}>
                <Text style={styles.resetText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={() => setShowFilterModal(false)}>
                <Text style={styles.applyText}>Terapkan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: 60, marginTop: 10 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
  filterIconBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 12, backgroundColor: '#FFF', elevation: 2 },
  filterActive: { backgroundColor: COLORS.primary },
  searchSection: { paddingHorizontal: 20, marginBottom: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', height: 50, borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: '#EEE' },
  input: { flex: 1, marginLeft: 12, fontSize: 14, color: COLORS.primary, fontWeight: '500' },
  listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  
  // CARD STYLES UPDATED
  card: { backgroundColor: '#FFF', borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: '#F0F0F0', elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, overflow: 'hidden' },
  cardInner: { flexDirection: 'row', padding: 12 },
  cardImg: { width: 90, height: 90, borderRadius: 16, backgroundColor: '#F0F0F0', marginRight: 14 },
  cardInfo: { flex: 1, justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textMain, marginBottom: 4 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 8 },
  locText: { fontSize: 12, color: COLORS.textSub, fontWeight: '500' },
  
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700' },
  typeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  typeBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  
  rescueStats: { fontSize: 11, color: '#999', fontWeight: '600' },

  // SERVICE FOOTER
  cardFooter: { paddingHorizontal: 12, paddingBottom: 12, paddingTop: 0 },
  serviceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  miniServiceTag: { backgroundColor: '#F5F5F5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#EEE' },
  miniServiceText: { fontSize: 10, color: '#666', fontWeight: '600' },
  moreServiceText: { fontSize: 10, color: '#999', fontWeight: '600' },

  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textMain, marginTop: 16, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: COLORS.textSub },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#FFF', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, maxHeight: height * 0.85 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  filterLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textMain, marginTop: 15, marginBottom: 10 },
  
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F5F5F5', marginRight: 8 },
  chipActive: { backgroundColor: COLORS.primary },
  chipText: { fontSize: 13, color: '#666', fontWeight: '600' },
  chipTextActive: { color: '#FFF' },
  
  serviceWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  serviceChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD' },
  serviceChipActive: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  serviceChipText: { fontSize: 12, color: '#666', fontWeight: '600' },
  serviceChipTextActive: { color: '#FFF' },

  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 10 },
  modalFooter: { flexDirection: 'row', gap: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F0F0F0', marginTop: 20 },
  resetBtn: { flex: 1, padding: 15, alignItems: 'center', borderRadius: 12, backgroundColor: '#F5F5F5' },
  resetText: { color: COLORS.danger, fontWeight: 'bold' },
  applyBtn: { flex: 2, padding: 15, alignItems: 'center', borderRadius: 12, backgroundColor: COLORS.primary },
  applyText: { color: '#FFF', fontWeight: 'bold' },
});