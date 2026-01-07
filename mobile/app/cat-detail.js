import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, 
  Dimensions, ActivityIndicator, StatusBar, Modal
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../src/services/api';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#1A3C40',
  secondary: '#417D7A',
  accent: '#F4A261',
  background: '#FBFBFB',
  card: '#FFFFFF',
  textSub: '#777777',
  divider: '#F0F0F0',
};

export default function CatDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [cat, setCat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingProfile, setCheckingProfile] = useState(false); 
  const [activeImage, setActiveImage] = useState(0);
  
  // State untuk Custom Modal
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => { fetchCatDetail(); }, [id]);

  const fetchCatDetail = async () => {
    try {
      const res = await api.get(`/data/cats/${id}`);
      setCat(res.data);
    } catch (error) {
      console.log('Error fetch detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCityFromAddress = (fullAddress) => {
    if (!fullAddress) return 'Lokasi Tidak Diketahui';
    const parts = fullAddress.split(',');
    const cityPart = parts.find(p => p.trim().includes('Kota') || p.trim().includes('Kab')) || parts[2] || parts[0];
    return cityPart.trim();
  };

  const formatAge = (totalMonths) => {
    if (totalMonths < 12) return `${totalMonths} Bulan`;
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    if (months === 0) return `${years} Tahun`;
    return `${years} Thn ${months} Bln`;
  };

  // --- LOGIC BARU: CEK PROFIL ---
  const handleAdopt = async () => {
    setCheckingProfile(true);
    try {
      const res = await api.get('/auth/profile');
      const user = res.data.user;

      // Cek Nomor Telepon
      if (!user.phoneNumber || user.phoneNumber.trim() === '') {
        setShowProfileModal(true); // Tampilkan Modal Custom
      } else {
        router.push({
          pathname: '/adoption-form',
          params: { catId: cat.id, catName: cat.name }
        });
      }
    } catch (error) {
      // Error fetch profile bisa tetap pakai alert kecil atau modal error lain, 
      // tapi untuk sekarang kita fokus ke flow validasi nomor.
      console.log('Gagal cek profil');
    } finally {
      setCheckingProfile(false);
    }
  };

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
  );

  if (!cat) return null;

  const images = cat.images?.split(',') || [];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="light-content" translucent />
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* IMAGE SLIDER */}
        <View style={styles.imageContainer}>
          <ScrollView 
            horizontal pagingEnabled 
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const slide = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveImage(slide);
            }}
          >
            {images.map((img, index) => (
              <Image key={index} source={{ uri: img }} style={styles.heroImage} />
            ))}
          </ScrollView>
          
          <View style={styles.headerOverlay}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Feather name="chevron-left" size={28} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.indicatorContainer}>
            {images.map((_, i) => (
              <View key={i} style={[styles.dot, activeImage === i && styles.dotActive]} />
            ))}
          </View>
        </View>

        <View style={styles.contentCard}>
          <View style={styles.mainInfo}>
            <View>
              <Text style={styles.catName}>{cat.name}</Text>
              <Text style={styles.catBreed}>{cat.breed}</Text>
            </View>
            <View style={[styles.genderBadge, { backgroundColor: cat.gender === 'Jantan' ? '#E3F2FD' : '#FCE4EC' }]}>
              <MaterialCommunityIcons 
                name={cat.gender === 'Jantan' ? 'gender-male' : 'gender-female'} 
                size={22} 
                color={cat.gender === 'Jantan' ? '#1976D2' : '#C2185B'} 
              />
            </View>
          </View>

          <View style={styles.statsRow}>
            <StatItem icon="time-outline" label="Umur" value={formatAge(cat.age)} />
            <StatItem icon="location-outline" label="Lokasi" value={getCityFromAddress(cat.shelter?.shelterAddress)} />
            <StatItem icon="shield-checkmark-outline" label="Kesehatan" value="Prima" />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kisah {cat.name}</Text>
            <Text style={styles.description}>{cat.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rekam Medis & Karakter</Text>
            <View style={styles.tagWrapper}>
              {cat.health?.split(',').map((tag, i) => (
                <View key={`h-${i}`} style={styles.healthTag}>
                  <Ionicons name="checkmark-done" size={14} color={COLORS.secondary} />
                  <Text style={styles.healthTagText}>{tag}</Text>
                </View>
              ))}
              {cat.personality?.split(',').map((tag, i) => (
                <View key={`p-${i}`} style={styles.personalityTag}>
                  <Text style={styles.personalityTagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>

<TouchableOpacity 
  style={styles.shelterCard} 
  activeOpacity={0.7}
  onPress={() => {
    // Navigasi ke halaman detail shelter dengan membawa ID shelter
    router.push({ 
      pathname: '/shelter-detail', 
      params: { id: cat.shelterId } 
    });
  }}
>
  <View style={styles.shelterContent}>
    {/* Menggunakan foto shelter jika ada, jika tidak pakai inisial avatar */}
    <Image 
      source={{ 
        uri: cat.shelter.shelterPhotos 
          ? cat.shelter.shelterPhotos.split(',')[0] // Ambil foto pertama
          : 'https://ui-avatars.com/api/?name=' + cat.shelter.name 
      }} 
      style={styles.shelterImg} 
    />
    <View style={{ flex: 1 }}>
      <Text style={styles.shelterName}>{cat.shelter.name}</Text>
      <Text style={styles.shelterSub}>Klik untuk lihat profil shelter</Text>
    </View>
    <Feather name="chevron-right" size={24} color={COLORS.secondary} />
  </View>
</TouchableOpacity>
        </View>
      </ScrollView>

      {/* FOOTER ACTION */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.adoptBtn, checkingProfile && { opacity: 0.8 }]}
          onPress={handleAdopt} 
          disabled={checkingProfile}
        >
          {checkingProfile ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.adoptBtnText}>Ajukan Adopsi</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* --- CUSTOM MODAL: PROFIL INCOMPLETE --- */}
      <Modal animationType="fade" transparent visible={showProfileModal} statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={[styles.iconCircle, { backgroundColor: '#FFF3E0' }]}>
                <Feather name="user-check" size={32} color="#EF6C00" />
              </View>
              <Text style={styles.modalTitle}>Lengkapi Profil</Text>
              <Text style={styles.modalDesc}>
                Shelter memerlukan nomor WhatsApp/Telepon aktif agar bisa menghubungi Anda untuk proses selanjutnya.
              </Text>
              
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.modalBtnCancel} 
                  onPress={() => setShowProfileModal(false)}
                >
                  <Text style={styles.modalBtnTextCancel}>Nanti Saja</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalBtnConfirm} 
                  onPress={() => {
                    setShowProfileModal(false);
                    router.push('/(tabs)/profile');
                  }}
                >
                  <Text style={styles.modalBtnTextConfirm}>Isi Sekarang</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const StatItem = ({ icon, label, value }) => (
  <View style={styles.statBox}>
    <Ionicons name={icon} size={22} color={COLORS.secondary} />
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imageContainer: { width: width, height: 420 },
  heroImage: { width: width, height: 420, resizeMode: 'cover' },
  headerOverlay: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'flex-start' },
  backBtn: { width: 45, height: 45, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.95)', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  indicatorContainer: { position: 'absolute', bottom: 40, width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { width: 24, backgroundColor: '#FFF' },
  contentCard: { marginTop: -30, backgroundColor: COLORS.background, borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25 },
  mainInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  catName: { fontSize: 30, fontWeight: '900', color: COLORS.primary },
  catBreed: { fontSize: 16, color: COLORS.textSub, marginTop: 2, fontWeight: '600' },
  genderBadge: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  statBox: { width: (width - 70) / 3, backgroundColor: '#FFF', paddingVertical: 18, borderRadius: 24, alignItems: 'center', elevation: 2 },
  statLabel: { fontSize: 11, color: COLORS.textSub, marginTop: 8, fontWeight: '600' },
  statValue: { fontSize: 14, fontWeight: '800', color: COLORS.primary, marginTop: 3 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: COLORS.primary, marginBottom: 12 },
  description: { fontSize: 15, color: '#444', lineHeight: 24, fontWeight: '500' },
  tagWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  healthTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EDF4F4', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
  healthTagText: { fontSize: 13, fontWeight: '800', color: COLORS.secondary },
  personalityTag: { backgroundColor: '#F4A26115', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
  personalityTagText: { fontSize: 13, fontWeight: '800', color: COLORS.accent },
  shelterCard: { backgroundColor: '#FFF', padding: 18, borderRadius: 28, elevation: 2, marginBottom: 30 },
  shelterContent: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  shelterImg: { width: 55, height: 55, borderRadius: 18 },
  shelterName: { fontSize: 17, fontWeight: '900', color: COLORS.primary },
  shelterSub: { fontSize: 12, color: COLORS.secondary, fontWeight: '700', marginTop: 2 },
  footer: { paddingHorizontal: 25, paddingVertical: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: COLORS.divider },
  adoptBtn: { height: 60, borderRadius: 20, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  adoptBtnText: { fontSize: 17, fontWeight: '900', color: '#FFF' },
  
  // MODAL STYLES (MATCHING UI REGISTER SHELTER)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '85%' },
  modalContent: { backgroundColor: '#FFF', borderRadius: 20, padding: 24, alignItems: 'center', width: '100%', elevation: 5 },
  iconCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  modalDesc: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  modalActions: { flexDirection: 'row', gap: 12, width: '100%' },
  modalBtnCancel: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F5F5F5', alignItems: 'center' },
  modalBtnTextCancel: { color: '#666', fontWeight: 'bold' },
  modalBtnConfirm: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center' },
  modalBtnTextConfirm: { color: '#FFF', fontWeight: 'bold' },
});