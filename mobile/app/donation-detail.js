import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, 
  Dimensions, ActivityIndicator, StatusBar, Share 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../src/services/api';

const COLORS = {
  primary: '#1A3C40',
  secondary: '#417D7A',
  accent: '#F4A261',
  background: '#FBFBFB',
  card: '#FFFFFF',
  textMain: '#1A1A1A',
  textSub: '#666',
  divider: '#F0F0F0',
  progressBg: '#E0E0E0'
};

export default function DonationDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('cerita'); 

  useEffect(() => { 
    if (id) {
      fetchDetail(); 
    } else {
      setLoading(false);
      setErrorMsg('ID Campaign tidak valid');
    }
  }, [id]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      console.log('Fetching detail for ID:', id);

      // STEP 1: Coba ambil detail langsung (Best Practice)
      try {
        const res = await api.get(`/data/campaigns/${id}`);
        console.log('Data found via direct endpoint');
        setCampaign(res.data);
        setLoading(false);
        return; // Success! Keluar dari function
      } catch (err) {
        console.log('Direct fetch failed (404/500). Trying fallback list...');
      }

      // STEP 2: Fallback - Ambil semua list lalu cari manual
      // Ini berguna kalau endpoint detail belum ready atau bermasalah
      const resAll = await api.get('/data/campaigns');
      if (Array.isArray(resAll.data)) {
        const targetId = parseInt(id, 10);
        const found = resAll.data.find(c => c.id === targetId);
        
        if (found) {
          console.log('Campaign found in list fallback');
          setCampaign(found);
        } else {
          console.log('Campaign ID not found in full list.');
          setErrorMsg('Campaign tidak ditemukan. Mungkin sudah dihapus.');
        }
      } else {
        setErrorMsg('Gagal mengambil data campaign.');
      }

    } catch (error) {
      console.error('Error final catch:', error);
      setErrorMsg('Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  };

  const handleDonate = () => {
    // Navigate to payment
    router.push({ pathname: '/donation-payment', params: { id: campaign.id } });
    console.log('Navigate to payment for:', campaign?.title);
  };

  const formatRupiah = (num) => {
      if (!num) return 'Rp 0';
      return 'Rp ' + parseInt(num).toLocaleString('id-ID');
  };
  
  const getPercent = (current, target) => {
    if (!target) return 0;
    return Math.round((parseInt(current) / parseInt(target)) * 100);
  };

  const getDaysLeft = (deadline) => {
    if (!deadline) return '∞ hari lagi';
    const diff = new Date(deadline) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} hari lagi` : 'Berakhir';
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );

  if (errorMsg || !campaign) return (
    <View style={styles.center}>
      <MaterialCommunityIcons name="alert-circle-outline" size={50} color={COLORS.textSub} />
      <Text style={{marginTop: 10, color: COLORS.textSub}}>{errorMsg || 'Data tidak tersedia'}</Text>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backButtonText}>Kembali</Text>
      </TouchableOpacity>
    </View>
  );

  const percent = getPercent(campaign.currentAmount, campaign.targetAmount);
  const visualPercent = percent > 100 ? 100 : percent;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* HERO IMAGE */}
        <View style={styles.heroContainer}>
          <Image 
            source={{ uri: campaign.imageUrl || 'https://via.placeholder.com/400' }} 
            style={styles.heroImage} 
          />
          <View style={styles.overlay} />
          <SafeAreaView style={styles.headerActions}>
            <TouchableOpacity onPress={() => router.back()} style={styles.roundBtn}>
              <Feather name="arrow-left" size={24} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.roundBtn}>
              <Feather name="share-2" size={20} color="#FFF" />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{campaign.title}</Text>
          
          {/* PROGRESS SECTION */}
          <View style={styles.progressSection}>
            <View style={styles.progressRow}>
              <Text style={styles.moneyCurrent}>{formatRupiah(campaign.currentAmount)}</Text>
              <Text style={styles.moneyTarget}>dari {formatRupiah(campaign.targetAmount)}</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${visualPercent}%` }]} />
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statText}>
                <Text style={{fontWeight:'bold', color: COLORS.accent}}>{percent}%</Text> tercapai
              </Text>
              <Text style={styles.statText}>{getDaysLeft(campaign.deadline)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* ORGANIZER */}
          <Text style={styles.label}>Penggalang Dana</Text>
          <TouchableOpacity 
            style={styles.organizerCard}
            onPress={() => {
              if (campaign.shelter?.id) {
                router.push({ pathname: '/shelter-detail', params: { id: campaign.shelter.id } });
              }
            }} 
          >
            <Image 
              source={{ uri: campaign.shelter?.shelterPhotos?.split(',')[0] || 'https://via.placeholder.com/50' }} 
              style={styles.organizerImg} 
            />
            <View style={styles.organizerInfo}>
              <Text style={styles.organizerName}>{campaign.shelter?.nickname || 'Shelter'}</Text>
              <View style={styles.locRow}>
                <Ionicons name="location-outline" size={12} color={COLORS.textSub} />
                <Text style={styles.organizerSub} numberOfLines={1}>
                  {campaign.shelter?.shelterAddress || 'Lokasi tidak tersedia'}
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color="#CCC" />
          </TouchableOpacity>

          {/* TABS */}
          <View style={styles.tabContainer}>
            {['cerita', 'donatur', 'kabar'].map(tab => (
              <TouchableOpacity 
                key={tab} 
                style={[styles.tabBtn, activeTab === tab && styles.tabActive]} 
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* TAB CONTENT */}
          {activeTab === 'cerita' && (
            <View style={styles.storyContainer}>
              <Text style={styles.storyText}>{campaign.description}</Text>
              <View style={styles.disclaimerBox}>
                <Feather name="info" size={16} color={COLORS.secondary} style={{marginTop: 2}} />
                <Text style={styles.disclaimerText}>Donasi disalurkan langsung ke rekening shelter. Transparan & Aman.</Text>
              </View>
            </View>
          )}

          {activeTab === 'donatur' && (
            <View style={styles.donorContainer}>
              {campaign.donations && campaign.donations.length > 0 ? (
                campaign.donations.map((d, i) => (
                  <View key={i} style={styles.donorItem}>
                    <Image 
                      source={{ uri: d.user?.photoProfile || 'https://via.placeholder.com/40' }} 
                      style={styles.donorImg} 
                    />
                    <View style={styles.donorInfo}>
                      <Text style={styles.donorName}>{d.isAnonymous ? 'Hamba Allah' : (d.user?.name || 'Donatur')}</Text>
                      <Text style={styles.donorAmount}>
                        Berdonasi <Text style={{fontWeight:'bold'}}>{formatRupiah(d.amount)}</Text>
                      </Text>
                      {d.message ? <Text style={styles.donorMsg}>"{d.message}"</Text> : null}
                    </View>
                    <Text style={styles.donorTime}>Baru saja</Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyDonor}>
                  <FontAwesome5 name="hand-holding-heart" size={40} color="#DDD" />
                  <Text style={styles.emptyDonorText}>Belum ada donatur. Jadilah yang pertama!</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'kabar' && (
            <View style={styles.newsContainer}>
              {campaign.updates && campaign.updates.length > 0 ? (
                campaign.updates.slice() 
                  .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map((news, i) => (
                  <View key={i} style={styles.newsItem}>
                    <View style={styles.newsLine} />
                    <View style={styles.newsDot} />
                    <Text style={styles.newsDate}>
                      {new Date(news.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
                    </Text>
                    <Text style={styles.newsTitle}>{news.title}</Text>
                    <Text style={styles.newsContent}>{news.description}</Text>
                  </View>
                ))
              ) : (
                <Text style={{color:'#999', fontStyle:'italic', marginTop: 10}}>Belum ada kabar terbaru.</Text>
              )}
            </View>
          )}

        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.donateBtn} onPress={handleDonate}>
          <Text style={styles.donateBtnText}>Donasi Sekarang</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  heroContainer: { height: 300, width: '100%', position: 'relative' },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)' },
  
  headerActions: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10 },
  roundBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)' },

  body: { backgroundColor: COLORS.background, marginTop: -30, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, minHeight: 500 },
  
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 20, lineHeight: 30 },
  
  progressSection: { marginBottom: 20 },
  progressRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8, flexWrap: 'wrap' },
  moneyCurrent: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary, marginRight: 6 },
  moneyTarget: { fontSize: 14, color: COLORS.textSub, marginBottom: 2 },
  
  progressBarBg: { height: 10, backgroundColor: COLORS.progressBg, borderRadius: 5, marginBottom: 8, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: COLORS.accent, borderRadius: 5 },
  
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statText: { fontSize: 13, color: COLORS.textSub },

  divider: { height: 1, backgroundColor: COLORS.divider, marginVertical: 20 },

  label: { fontSize: 16, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 12 },
  
  organizerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#EEE', marginBottom: 24 },
  organizerImg: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EEE', marginRight: 12 },
  organizerInfo: { flex: 1 },
  organizerName: { fontSize: 14, fontWeight: 'bold', color: COLORS.textMain },
  organizerSub: { fontSize: 12, color: COLORS.textSub, marginLeft: 4, flex: 1 },
  locRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },

  // TABS
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#EEE', marginBottom: 20 },
  tabBtn: { marginRight: 25, paddingBottom: 10 },
  tabActive: { borderBottomWidth: 3, borderBottomColor: COLORS.primary },
  tabText: { fontSize: 15, color: COLORS.textSub, fontWeight: '600' },
  tabTextActive: { color: COLORS.primary, fontWeight: 'bold' },

  storyText: { fontSize: 15, lineHeight: 24, color: '#444' },
  disclaimerBox: { flexDirection: 'row', backgroundColor: '#E0F2F1', padding: 16, borderRadius: 12, marginTop: 24, gap: 10 },
  disclaimerText: { fontSize: 12, color: COLORS.secondary, flex: 1, lineHeight: 18 },

  // DONATUR LIST
  donorContainer: { marginTop: 5 },
  donorItem: { flexDirection: 'row', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F9F9F9', paddingBottom: 15 },
  donorImg: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEE', marginRight: 12 },
  donorInfo: { flex: 1 },
  donorName: { fontSize: 14, fontWeight: 'bold', color: COLORS.textMain },
  donorAmount: { fontSize: 12, color: '#666', marginTop: 2 },
  donorMsg: { fontSize: 12, color: '#888', fontStyle: 'italic', marginTop: 4 },
  donorTime: { fontSize: 10, color: '#CCC' },

  emptyDonor: { alignItems: 'center', paddingVertical: 40 },
  emptyDonorText: { color: '#999', marginTop: 10, fontStyle: 'italic' },

  // KABAR UPDATE
  newsContainer: { paddingLeft: 10 },
  newsItem: { borderLeftWidth: 2, borderLeftColor: '#EEE', paddingLeft: 20, paddingBottom: 20, position: 'relative' },
  newsLine: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, backgroundColor: '#EEE' },
  newsDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary, position: 'absolute', left: -6, top: 0 },
  newsDate: { fontSize: 12, color: '#999', marginBottom: 4 },
  newsTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 4 },
  newsContent: { fontSize: 13, color: '#666' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', padding: 20, borderTopWidth: 1, borderTopColor: '#F0F0F0', elevation: 10 },
  donateBtn: { backgroundColor: COLORS.accent, height: 55, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.accent, shadowOpacity: 0.3, shadowOffset: {width:0, height:4}, elevation: 4 },
  donateBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  
  backButton: { marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: COLORS.primary },
  backButtonText: { color: COLORS.primary, fontWeight: 'bold' }
});