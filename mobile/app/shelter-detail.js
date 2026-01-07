import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, 
  Dimensions, ActivityIndicator, StatusBar, Linking, Platform
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
  textMain: '#1A1A1A',
  textSub: '#666',
  divider: '#F0F0F0',
  success: '#2E7D32',
  danger: '#D32F2F',
  info: '#1976D2'
};

export default function ShelterDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [shelter, setShelter] = useState(null);
  const [shelterCats, setShelterCats] = useState([]);
  const [shelterCampaigns, setShelterCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tab Default
  const [activeTab, setActiveTab] = useState('info'); 

  useEffect(() => { fetchDetail(); }, [id]);

  const fetchDetail = async () => {
    try {
      const resShelter = await api.get('/data/clinics'); 
      const found = resShelter.data.find(c => c.id === parseInt(id));
      setShelter(found);

      const resCats = await api.get('/data/cats');
      const myCats = resCats.data.filter(c => c.shelterId === parseInt(id));
      setShelterCats(myCats);

      const resCampaigns = await api.get('/data/campaigns');
      const myCampaigns = resCampaigns.data.filter(c => c.shelterId === parseInt(id));
      setShelterCampaigns(myCampaigns);

    } catch (error) {
      console.log('Error fetch details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMaps = () => {
    const query = encodeURIComponent(shelter?.shelterAddress || shelter?.nickname);
    const url = Platform.select({ ios: `maps:0,0?q=${query}`, android: `geo:0,0?q=${query}` });
    Linking.openURL(url);
  };

  const handleChat = () => router.push('/(tabs)/chat');

  // Helper Umur
  const formatAge = (totalMonths) => {
    if (totalMonths < 12) return `${totalMonths} Bln`;
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    return months === 0 ? `${years} Thn` : `${years}th ${months}bln`;
  };

  // Helper Jam Buka
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

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (!shelter) return <View style={styles.center}><Text>Shelter tidak ditemukan</Text></View>;

  const images = shelter.shelterPhotos ? shelter.shelterPhotos.split(',') : ['https://via.placeholder.com/400'];
  const services = shelter.services ? shelter.services.split(',') : [];
  const isOpen = isOpenNow(shelter.clinicOpenHours);

  // Labels Tab (Dinamis Count)
  const TABS = [
    { id: 'info', label: 'Info' },
    { id: 'cats', label: `Anabul (${shelterCats.length})` },
    { id: 'donation', label: `Donasi (${shelterCampaigns.length})` },
    { id: 'gallery', label: 'Galeri' }
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />
      
      {/* HEADER HERO */}
      <View style={styles.headerContainer}>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.heroScroll}>
          {images.map((img, i) => (
            <Image key={i} source={{ uri: img }} style={styles.heroImage} />
          ))}
        </ScrollView>
        <View style={styles.headerOverlay} />
        
        <SafeAreaView style={styles.safeTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
        </SafeAreaView>

        <View style={styles.heroContent}>
          <View style={styles.badgeRow}>
            {shelter.isClinic ? (
              <View style={styles.badgeClinic}>
                <Text style={styles.badgeText}>Klinik & Shelter</Text>
              </View>
            ) : (
              // REVISI: Warna Badge Shelter jadi Teal/Secondary
              <View style={styles.badgeShelter}>
                <Text style={styles.badgeText}>Shelter Resmi</Text>
              </View>
            )}
          </View>
          <Text style={styles.heroTitle}>{shelter.nickname}</Text>
          <View style={styles.locRow}>
            <Ionicons name="location" size={14} color="#FFF" style={{marginTop: 2}} />
            <Text style={styles.locText} numberOfLines={2}>{shelter.shelterAddress}</Text>
          </View>
        </View>
      </View>

      {/* TABS NAVIGATION - FIXED EQUAL WIDTH */}
      <View style={styles.tabContainer}>
        {TABS.map(tab => (
          <TouchableOpacity 
            key={tab.id} 
            style={[styles.tabItem, activeTab === tab.id && styles.tabActive]} 
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]} numberOfLines={1}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
        
        {/* TAB 1: INFO & LAYANAN */}
        {activeTab === 'info' && (
          <View>
            <TouchableOpacity style={styles.mapBtn} onPress={handleMaps}>
              <View style={styles.mapIconBox}>
                <Feather name="map-pin" size={18} color={COLORS.secondary} />
              </View>
              <Text style={styles.mapBtnText}>Lihat Lokasi di Peta</Text>
              <Feather name="chevron-right" size={18} color="#999" />
            </TouchableOpacity>

            <View style={styles.highlightBar}>
              {shelter.isClinic ? (
                <View style={styles.highlightItem}>
                  <View style={[styles.statusDot, { backgroundColor: isOpen ? COLORS.success : COLORS.danger }]} />
                  <Text style={[styles.highlightText, { color: isOpen ? COLORS.success : COLORS.danger }]}>
                    {isOpen ? 'Buka Sekarang' : 'Tutup'}
                  </Text>
                  <Text style={styles.highlightSub}>{shelter.clinicOpenHours?.split('(')[0]}</Text>
                </View>
              ) : (
                <View style={styles.highlightItem}>
                  <Text style={styles.highlightVal}>{shelter.operatingYear || '2020'}</Text>
                  <Text style={styles.highlightSub}>Tahun Berdiri</Text>
                </View>
              )}
              
              <View style={styles.highlightDivider} />
              
              <View style={styles.highlightItem}>
                <Text style={styles.highlightVal}>{shelter.catsRescued}+</Text>
                <Text style={styles.highlightSub}>Anabul Diselamatkan</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tentang Kami</Text>
              <Text style={styles.descText}>{shelter.description || 'Belum ada deskripsi.'}</Text>
            </View>

            {shelter.isClinic && (
              <>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Jam Operasional Klinik</Text>
                  <View style={styles.timeCard}>
                    <Feather name="clock" size={18} color={COLORS.secondary} />
                    <Text style={styles.timeText}>{shelter.clinicOpenHours || '-'}</Text>
                  </View>
                </View>

                {/* REVISI: Layanan tanpa icon, simple tags */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Layanan Medis</Text>
                  <View style={styles.serviceTagWrap}>
                    {services.map((svc, i) => (
                      <View key={i} style={styles.serviceTag}>
                        <Text style={styles.serviceTagText}>{svc.trim()}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            )}
          </View>
        )}

        {/* TAB 2: LIST KUCING (Style Adoption Gallery) */}
        {activeTab === 'cats' && (
          <View style={styles.gridContainer}>
            {shelterCats.length === 0 ? (
              <View style={styles.emptyBox}>
                <MaterialCommunityIcons name="cat" size={40} color="#DDD" />
                <Text style={styles.emptyText}>Belum ada kucing siap adopsi.</Text>
              </View>
            ) : (
              shelterCats.map(cat => (
                <TouchableOpacity 
                  key={cat.id} 
                  style={styles.card} 
                  onPress={() => router.push({ pathname: '/cat-detail', params: { id: cat.id } })}
                >
                  <Image source={{ uri: cat.images?.split(',')[0] }} style={styles.cardImg} />
                  
                  <View style={styles.cardInfo}>
                    <Text style={styles.catName} numberOfLines={1}>{cat.name}</Text>
                    
                    {/* Mini Tags */}
                    <View style={styles.miniTagWrapper}>
                      {cat.personality?.split(',').slice(0, 2).map((p, i) => (
                        <View key={i} style={styles.miniTagPerso}><Text style={styles.miniTagText}>{p}</Text></View>
                      ))}
                    </View>

                    <View style={styles.cardFooter}>
                      <Text style={styles.ageLabel}>{formatAge(cat.age)}</Text>
                    </View>
                  </View>

                  <View style={[styles.miniGender, { backgroundColor: cat.gender === 'Jantan' ? '#E3F2FD' : '#FCE4EC' }]}>
                    <MaterialCommunityIcons name={cat.gender === 'Jantan' ? 'gender-male' : 'gender-female'} size={12} color={cat.gender === 'Jantan' ? '#1976D2' : '#C2185B'} />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* TAB 3: CAMPAIGNS (Placeholder dulu) */}
        {activeTab === 'donation' && (
          <View>
            {shelterCampaigns.length === 0 ? (
              <View style={styles.emptyBox}>
                <MaterialCommunityIcons name="charity" size={40} color="#DDD" />
                <Text style={styles.emptyText}>Belum ada campaign donasi aktif.</Text>
              </View>
            ) : (
              shelterCampaigns.map(camp => (
                <TouchableOpacity key={camp.id} style={styles.campCard} activeOpacity={0.9}>
                  <Image source={{ uri: camp.imageUrl }} style={styles.campImg} />
                  <View style={styles.campInfo}>
                    <Text style={styles.campTitle} numberOfLines={2}>{camp.title}</Text>
                    <View style={styles.progressBg}>
                      <View style={[styles.progressFill, { width: `${Math.min(100, (camp.currentAmount/camp.targetAmount)*100)}%` }]} />
                    </View>
                    <View style={styles.campRow}>
                      <Text style={styles.campStats}>Rp {parseInt(camp.currentAmount).toLocaleString()}</Text>
                      <Text style={styles.campPercent}>{Math.round((camp.currentAmount/camp.targetAmount)*100)}%</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* TAB 4: GALERI (NEW) */}
        {activeTab === 'gallery' && (
          <View style={styles.galleryGrid}>
            {images.map((img, i) => (
              <TouchableOpacity key={i} style={styles.galleryItem} activeOpacity={0.9}>
                <Image source={{ uri: img }} style={styles.galleryImg} />
              </TouchableOpacity>
            ))}
          </View>
        )}

      </ScrollView>

      {/* FIXED FOOTER */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleChat}>
          <Text style={styles.primaryBtnText}>Chat Shelter</Text>
          <Feather name="message-circle" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  headerContainer: { height: 280, width: '100%', position: 'relative' },
  heroScroll: { width: width, height: 280 },
  heroImage: { width: width, height: 280, resizeMode: 'cover' },
  headerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  
  safeTop: { position: 'absolute', top: 0, left: 20, right: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  
  heroContent: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  badgeClinic: { backgroundColor: COLORS.secondary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeShelter: { backgroundColor: COLORS.secondary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }, // Sama-sama Teal
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  
  heroTitle: { fontSize: 26, fontWeight: '900', color: '#FFF', marginBottom: 6, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 5 },
  locRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  locText: { color: '#EEE', fontSize: 13, fontWeight: '500', flex: 1 },

  // TAB STYLE: Equal Width
  tabContainer: { flexDirection: 'row', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  tabItem: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { fontSize: 13, color: COLORS.textSub, fontWeight: '600' },
  tabTextActive: { color: COLORS.primary, fontWeight: '800' },

  contentContainer: { padding: 20, paddingBottom: 100 },
  
  // COMPONENTS INFO
  mapBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 12, marginBottom: 20, elevation: 1, borderWidth: 1, borderColor: '#EEE' },
  mapIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#E0F2F1', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  mapBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.textMain, flex: 1 },
  
  highlightBar: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#EEE', alignItems: 'center', justifyContent: 'space-around' },
  highlightItem: { alignItems: 'center' },
  highlightVal: { fontSize: 18, fontWeight: '800', color: COLORS.textMain },
  highlightText: { fontSize: 14, fontWeight: '700' },
  highlightSub: { fontSize: 11, color: COLORS.textSub, marginTop: 2 },
  highlightDivider: { width: 1, height: 40, backgroundColor: '#EEE' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 4 },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textMain, marginBottom: 12 },
  descText: { fontSize: 14, color: COLORS.textSub, lineHeight: 22 },
  
  timeCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#E0F2F1', padding: 12, borderRadius: 10 },
  timeText: { fontSize: 14, fontWeight: '600', color: COLORS.secondary },

  // SERVICE TAGS (CLEANER)
  serviceTagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  serviceTag: { backgroundColor: '#F5F5F5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#EEE' },
  serviceTagText: { fontSize: 13, color: '#555', fontWeight: '600' },

  // CAT GRID (STYLE MATCHING GALLERY)
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: (width - 50) / 2, backgroundColor: '#FFF', borderRadius: 16, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  cardImg: { width: '100%', height: 160, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  cardInfo: { padding: 12 },
  catName: { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  miniTagWrapper: { flexDirection: 'row', gap: 4, marginTop: 6, marginBottom: 10 },
  miniTagPerso: { backgroundColor: '#F4A26120', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  miniTagText: { fontSize: 9, fontWeight: '800', color: COLORS.secondary },
  cardFooter: { borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: 8 },
  ageLabel: { fontSize: 10, color: COLORS.textMain, fontWeight: '700' },
  miniGender: { position: 'absolute', top: 10, right: 10, width: 26, height: 26, borderRadius: 9, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)' },

  // CAMPAIGN CARD
  campCard: { backgroundColor: '#FFF', borderRadius: 16, marginBottom: 15, elevation: 2, padding: 12, flexDirection: 'row', gap: 12 },
  campImg: { width: 80, height: 80, borderRadius: 10 },
  campInfo: { flex: 1, justifyContent: 'center' },
  campTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8, color: COLORS.textMain },
  progressBg: { height: 6, backgroundColor: '#EEE', borderRadius: 3, marginBottom: 6 },
  progressFill: { height: 6, backgroundColor: COLORS.accent, borderRadius: 3 },
  campRow: { flexDirection: 'row', justifyContent: 'space-between' },
  campStats: { fontSize: 11, color: COLORS.secondary, fontWeight: '700' },
  campPercent: { fontSize: 11, color: COLORS.accent, fontWeight: '700' },

  // GALLERY GRID
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  galleryItem: { width: (width - 50) / 3, height: (width - 50) / 3, borderRadius: 12, overflow: 'hidden' },
  galleryImg: { width: '100%', height: '100%' },

  emptyBox: { alignItems: 'center', marginTop: 40 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 10, fontStyle: 'italic' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', padding: 20, borderTopWidth: 1, borderTopColor: COLORS.divider },
  primaryBtn: { backgroundColor: COLORS.primary, height: 50, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  primaryBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' }
});