import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import api from '../src/services/api';

export default function HistoryDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const item = JSON.parse(params.data); 
  const type = params.type;

  // --- LOGIC GAMBAR CERDAS (Sama dengan history.js) ---
  const resolveImageUrl = (rawPath) => {
    if (!rawPath) return null;
    if (rawPath.startsWith('http')) return rawPath;
    const baseUrl = api.defaults.baseURL.replace(/\/api\/?$/, ''); 
    const cleanPath = rawPath.trim().replace(/\\/g, '/');
    return `${baseUrl}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'PENDING': return { bg: '#FFF3E0', text: '#EF6C00', label: 'Menunggu' };
      case 'ON_PROCESS': return { bg: '#E3F2FD', text: '#1976D2', label: 'Diproses' };
      case 'RESCUED': return { bg: '#E8F5E9', text: '#2E7D32', label: 'Selesai' };
      case 'APPROVED': return { bg: '#E8F5E9', text: '#2E7D32', label: 'Disetujui' };
      case 'SUCCESS': return { bg: '#E8F5E9', text: '#2E7D32', label: 'Berhasil' };
      default: return { bg: '#F5F5F5', text: '#666', label: status };
    }
  };

  const status = getStatusStyle(item.status);

  // --- PAKAI RESOLVER DISINI ---
  let displayImg = null;
  if (type === 'laporan') {
    displayImg = resolveImageUrl(item.imageUrl);
  } else if (type === 'adopsi' && item.cat?.images) {
    displayImg = resolveImageUrl(item.cat.images.split(',')[0]);
  } else if (type === 'donasi' && item.campaign?.imageUrl) {
    displayImg = resolveImageUrl(item.campaign.imageUrl);
  }

  const imageSource = displayImg ? { uri: displayImg } : { uri: 'https://via.placeholder.com/400' };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Feather name="chevron-left" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Riwayat</Text>
        <TouchableOpacity style={styles.iconBtn}><Feather name="share-2" size={22} color="#333" /></TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <Image source={imageSource} style={styles.mainImage} />

        <View style={styles.content}>
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
            </View>
            <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
          </View>

          {type === 'adopsi' && (
            <View>
              <Text style={styles.mainTitle}>Pengajuan Adopsi: {item.cat?.name}</Text>
              
              <View style={styles.catInfoGrid}>
                <View style={styles.infoCard}><Text style={styles.infoVal}>{item.cat?.gender}</Text><Text style={styles.infoLabel}>Gender</Text></View>
                <View style={styles.infoCard}><Text style={styles.infoVal}>{item.cat?.age} Bln</Text><Text style={styles.infoLabel}>Usia</Text></View>
                <View style={styles.infoCard}><Text style={styles.infoVal}>{item.cat?.breed}</Text><Text style={styles.infoLabel}>Ras</Text></View>
              </View>

              <Text style={styles.sectionTitle}>Detail Shelter</Text>
              <View style={styles.shelterBox}>
                <View style={styles.shelterIcon}><FontAwesome5 name="home" size={16} color="#12464C" /></View>
                <View style={{flex:1}}>
                  <Text style={styles.shelterName}>{item.cat?.shelter?.name}</Text>
                  <Text style={styles.shelterAddr}>{item.cat?.shelter?.shelterAddress || 'Alamat tidak tersedia'}</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Data Pengajuan Anda</Text>
              <View style={styles.dataCard}>
                <View style={styles.dataRow}><Feather name="briefcase" size={16} color="#999" /><Text style={styles.dataText}>Pekerjaan: {item.job}</Text></View>
                <View style={styles.dataRow}><Feather name="home" size={16} color="#999" /><Text style={styles.dataText}>Status Rumah: {item.homeStatus}</Text></View>
                <View style={styles.dataRow}><Feather name="users" size={16} color="#999" /><Text style={styles.dataText}>Tinggal Bersama: {item.stayingWith}</Text></View>
              </View>

              <Text style={styles.sectionTitle}>Alasan Anda</Text>
              <View style={styles.quoteCard}><Text style={styles.quoteText}>"{item.reason}"</Text></View>

              <Text style={styles.sectionTitle}>Rencana Jika Pindah</Text>
              <Text style={styles.description}>{item.movingPlan}</Text>

              <Text style={styles.sectionTitle}>Proses Selanjutnya</Text>
              <View style={styles.progressBox}>
                <View style={styles.stepRow}><View style={styles.stepNumBox}><Text style={styles.stepNumTxt}>1</Text></View><View style={styles.stepContent}><Text style={styles.stepTitle}>Review Pengajuan</Text><Text style={styles.stepDesc}>Tim shelter meninjau profil Anda.</Text></View></View>
                <View style={styles.stepRow}><View style={styles.stepNumBox}><Text style={styles.stepNumTxt}>2</Text></View><View style={styles.stepContent}><Text style={styles.stepTitle}>Wawancara</Text><Text style={styles.stepDesc}>Sesi tanya jawab via video call.</Text></View></View>
              </View>
            </View>
          )}

          {type === 'laporan' && (
            <View>
              <Text style={styles.mainTitle}>{item.conditionTags}</Text>
              <View style={styles.infoBox}><Feather name="map-pin" size={16} color="#12464C" /><Text style={styles.infoText}>{item.address}</Text></View>
              <Text style={styles.sectionTitle}>Deskripsi Kondisi</Text>
              <Text style={styles.description}>{item.description || 'Tidak ada deskripsi tambahan.'}</Text>
            </View>
          )}

          {type === 'donasi' && (
            <View>
              <Text style={styles.title}>Donasi Berhasil</Text>
              <View style={styles.donationAmountBox}>
                <Text style={styles.amountLabel}>Jumlah Donasi</Text>
                <Text style={styles.amountValue}>Rp {parseInt(item.amount).toLocaleString('id-ID')}</Text>
              </View>
              <Text style={styles.sectionTitle}>Campaign</Text>
              <Text style={styles.description}>{item.campaign?.title}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.contactBtn} onPress={() => Linking.openURL(`tel:${item.phone || item.cat?.shelter?.phoneNumber || '112'}`)}>
          <Feather name="phone" size={20} color="#FFF" />
          <Text style={styles.contactBtnText}>Hubungi Pihak Terkait</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFBFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, height: 60, backgroundColor: '#FFF' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  iconBtn: { width: 45, height: 45, justifyContent: 'center', alignItems: 'center' },
  mainImage: { width: '100%', height: 300, resizeMode: 'cover' },
  content: { padding: 25, marginTop: -30, backgroundColor: '#FBFBFB', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  dateText: { fontSize: 12, color: '#999' },
  mainTitle: { fontSize: 24, fontWeight: '800', color: '#12464C', marginBottom: 15 },
  catInfoGrid: { flexDirection: 'row', gap: 10, marginBottom: 25 },
  infoCard: { flex: 1, backgroundColor: '#FFF', padding: 15, borderRadius: 16, alignItems: 'center', elevation: 2 },
  infoVal: { fontSize: 14, fontWeight: 'bold', color: '#12464C' },
  infoLabel: { fontSize: 10, color: '#999', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 25, marginBottom: 12 },
  shelterBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 16, elevation: 2 },
  shelterIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0F7F7', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  shelterName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  shelterAddr: { fontSize: 12, color: '#777', marginTop: 2 },
  dataCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 20, elevation: 2 },
  dataRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  dataText: { fontSize: 14, color: '#555' },
  quoteCard: { backgroundColor: '#F0F7F7', padding: 20, borderRadius: 16, borderLeftWidth: 5, borderLeftColor: '#12464C' },
  quoteText: { fontStyle: 'italic', color: '#12464C', lineHeight: 22 },
  description: { fontSize: 14, color: '#666', lineHeight: 22 },
  progressBox: { backgroundColor: '#E0F2F1', padding: 20, borderRadius: 20 },
  stepRow: { flexDirection: 'row', gap: 15, marginBottom: 15 },
  stepNumBox: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#12464C', justifyContent: 'center', alignItems: 'center' },
  stepNumTxt: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  stepTitle: { fontSize: 14, fontWeight: 'bold', color: '#12464C' },
  stepDesc: { fontSize: 12, color: '#417D7A', marginTop: 2 },
  footer: { padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  contactBtn: { backgroundColor: '#12464C', height: 55, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  contactBtnText: { color: '#FFF', fontWeight: 'bold' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#12464C', marginBottom: 10 },
  donationAmountBox: { backgroundColor: '#12464C', padding: 20, borderRadius: 15, alignItems: 'center', marginVertical: 10 },
  amountLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 4 },
  amountValue: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  infoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F7F7', padding: 12, borderRadius: 10, marginBottom: 20 },
  infoText: { marginLeft: 8, color: '#12464C', fontSize: 14, flex: 1 },
});