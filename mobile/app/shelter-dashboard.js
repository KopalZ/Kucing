import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image, 
  Alert, ActivityIndicator, StatusBar, RefreshControl, Linking 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import api from '../src/services/api';

export default function ShelterDashboard() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [shelterName, setShelterName] = useState('Mitra Shelter');

  useEffect(() => {
    loadProfile();
    fetchRequests();
  }, []);

  const loadProfile = async () => {
    const userData = await AsyncStorage.getItem('userData');
    if (userData) setShelterName(JSON.parse(userData).name);
  }

  const fetchRequests = async () => {
    try {
      const res = await api.get('/shelter/adoptions');
      setRequests(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleUpdateStatus = (id, status, adopterName) => {
    Alert.alert(
      status === 'APPROVED' ? 'Setujui Adopsi?' : 'Tolak Adopsi?',
      `Yakin ingin ${status === 'APPROVED' ? 'menyerahkan' : 'menolak'} kucing ini ke ${adopterName}?`,
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Ya, Proses', 
          onPress: async () => {
            try {
              await api.put(`/shelter/adoption/${id}`, { status });
              Alert.alert('Sukses', 'Status adopsi diperbarui.');
              fetchRequests(); // Refresh list
            } catch (error) {
              Alert.alert('Gagal', 'Terjadi kesalahan.');
            }
          }
        }
      ]
    );
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace('/');
  };

  const handleWhatsApp = (phone) => {
    if (!phone) {
       Alert.alert("Gagal", "Nomor HP tidak tersedia");
       return;
    }
    Linking.openURL(`whatsapp://send?phone=${phone}&text=Halo, mengenai pengajuan adopsi kucing...`);
  };

  const renderBadge = (status) => {
    let color = '#999';
    let label = status;
    if (status === 'PENDING') { color = '#FF9800'; label = 'Menunggu Review'; }
    if (status === 'APPROVED') { color = '#4CAF50'; label = 'Disetujui'; }
    if (status === 'REJECTED') { color = '#F44336'; label = 'Ditolak'; }

    return (
      <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color }]}>
        <Text style={[styles.badgeText, { color: color }]}>{label}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A3C40" />
      
      {/* HEADER SHELTER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🏠 {shelterName}</Text>
          <Text style={styles.headerSub}>Kelola permintaan adopsi</Text>
        </View>
        
        {/* TOMBOL MENU KANAN */}
        <View style={{flexDirection: 'row', gap: 10}}>
          {/* Tombol Chat Inbox */}
          <TouchableOpacity 
             onPress={() => router.push('/(tabs)/chat')} 
             style={styles.iconBtn}
          >
            <Feather name="message-square" size={20} color="#FFF" />
          </TouchableOpacity>

          {/* Tombol Logout */}
          <TouchableOpacity onPress={handleLogout} style={styles.iconBtn}>
            <Feather name="log-out" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* STATS SUMMARY */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
           <Text style={styles.statNum}>{requests.filter(r => r.status === 'PENDING').length}</Text>
           <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statBox}>
           <Text style={styles.statNum}>{requests.filter(r => r.status === 'APPROVED').length}</Text>
           <Text style={styles.statLabel}>Teradopsi</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Permintaan Masuk</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#1A3C40" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRequests(); }} />}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 50 }}
          ListEmptyComponent={
             <View style={{alignItems:'center', marginTop:50}}>
                <FontAwesome5 name="cat" size={40} color="#DDD" />
                <Text style={{marginTop:10, color:'#999'}}>Belum ada permintaan adopsi.</Text>
             </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{flexDirection:'row', alignItems:'center', gap:10}}>
                   <Image source={{ uri: item.cat?.images?.split(',')[0] }} style={styles.catThumb} />
                   <View>
                      <Text style={styles.catName}>{item.cat?.name}</Text>
                      <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                   </View>
                </View>
                {renderBadge(item.status)}
              </View>

              <View style={styles.adopterInfo}>
                <Text style={styles.infoTitle}>Calon Adopter:</Text>
                <Text style={styles.infoText}>👤 {item.user?.name}</Text>
                <Text style={styles.infoText}>📧 {item.user?.email}</Text>
                
                <TouchableOpacity onPress={() => handleWhatsApp(item.user?.phoneNumber || item.phone)} style={{flexDirection:'row', alignItems:'center', marginTop:5}}>
                   <FontAwesome5 name="whatsapp" size={14} color="#25D366" />
                   <Text style={[styles.infoText, {color:'#25D366', fontWeight:'bold', marginLeft:5}]}>
                      {item.user?.phoneNumber || item.phone || '-'}
                   </Text>
                </TouchableOpacity>
                
                <Text style={[styles.infoTitle, {marginTop:10}]}>Alasan Adopsi:</Text>
                <Text style={styles.reasonText}>"{item.reason || 'Ingin merawat kucing'}"</Text>
              </View>

              {/* ACTION BUTTONS */}
              {item.status === 'PENDING' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity 
                    style={[styles.btn, styles.btnReject]}
                    onPress={() => handleUpdateStatus(item.id, 'REJECTED', item.user?.name)}
                  >
                    <Feather name="x" size={16} color="#FFF" />
                    <Text style={styles.btnText}>Tolak</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.btn, styles.btnApprove]}
                    onPress={() => handleUpdateStatus(item.id, 'APPROVED', item.user?.name)}
                  >
                    <Feather name="check" size={16} color="#FFF" />
                    <Text style={styles.btnText}>Setujui</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { backgroundColor: '#1A3C40', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  headerSub: { fontSize: 12, color: '#E0F2F1' },
  
  iconBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 10 },
  
  statsContainer: { flexDirection: 'row', padding: 15, gap: 10 },
  statBox: { flex: 1, backgroundColor: '#FFF', padding: 15, borderRadius: 12, alignItems: 'center', elevation: 2 },
  statNum: { fontSize: 24, fontWeight: 'bold', color: '#1A3C40' },
  statLabel: { fontSize: 12, color: '#666' },

  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginLeft: 20, marginBottom: 10, color: '#333' },

  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2, marginHorizontal: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: '#EEE', paddingBottom: 10 },
  catThumb: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#EEE' },
  catName: { fontSize: 16, fontWeight: 'bold', color: '#1A3C40' },
  date: { fontSize: 11, color: '#999' },
  
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },

  adopterInfo: { marginTop: 10 },
  infoTitle: { fontSize: 12, color: '#999', fontWeight: 'bold', marginBottom: 4 },
  infoText: { fontSize: 13, color: '#333', marginBottom: 2 },
  reasonText: { fontSize: 13, color: '#555', fontStyle: 'italic', backgroundColor: '#F9F9F9', padding: 8, borderRadius: 6 },

  actionRow: { flexDirection: 'row', gap: 10, marginTop: 15 },
  btn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, borderRadius: 8, gap: 5 },
  btnReject: { backgroundColor: '#E57373' },
  btnApprove: { backgroundColor: '#81C784' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 }
});