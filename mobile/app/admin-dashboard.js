import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image, 
  Alert, ActivityIndicator, StatusBar, RefreshControl 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../src/services/api';

export default function AdminDashboard() {
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  // 1. Ambil Semua Laporan
  const fetchReports = async () => {
    try {
      const res = await api.get('/report/all');
      setReports(res.data);
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Gagal memuat data admin.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 2. Fungsi Ubah Status
  const handleUpdateStatus = (id, newStatus) => {
    Alert.alert(
      'Konfirmasi',
      `Ubah status laporan ini menjadi ${newStatus}?`,
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Ya, Ubah', 
          onPress: async () => {
            try {
              await api.put(`/report/status/${id}`, { status: newStatus });
              Alert.alert('Sukses', 'Status laporan diperbarui!');
              fetchReports(); // Refresh data
            } catch (error) {
              Alert.alert('Gagal', 'Gagal mengubah status.');
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

  const renderStatusBadge = (status) => {
    let color = '#999';
    let label = status;
    if (status === 'PENDING') { color = '#FF9800'; label = 'Menunggu'; }
    if (status === 'ON_PROCESS') { color = '#2196F3'; label = 'Diproses'; }
    if (status === 'RESCUED') { color = '#4CAF50'; label = 'Selesai'; }
    if (status === 'REJECTED') { color = '#F44336'; label = 'Ditolak'; }

    return (
      <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color }]}>
        <Text style={[styles.badgeText, { color: color }]}>{label}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#12464C" />
      
      {/* HEADER ADMIN */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🛡️ Admin Panel</Text>
          <Text style={styles.headerSub}>Kelola laporan masuk</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Feather name="log-out" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#12464C" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReports(); }} />}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={<Text style={{textAlign:'center', marginTop:50, color:'#999'}}>Belum ada laporan masuk.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                {renderStatusBadge(item.status)}
              </View>
              
              <View style={{flexDirection:'row', gap: 15, marginVertical: 10}}>
                <Image source={{ uri: api.defaults.baseURL.replace('/api','') + item.imageUrl }} style={styles.thumb} />
                <View style={{flex:1}}>
                  <Text style={styles.loc} numberOfLines={2}>📍 {item.address}</Text>
                  <Text style={styles.desc} numberOfLines={2}>"{item.description}"</Text>
                  <Text style={styles.reporter}>👤 {item.reporterName || 'User App'}</Text>
                </View>
              </View>

              {/* ACTION BUTTONS */}
              <View style={styles.actionRow}>
                {item.status === 'PENDING' && (
                  <TouchableOpacity 
                    style={[styles.btn, {backgroundColor: '#2196F3'}]}
                    onPress={() => handleUpdateStatus(item.id, 'ON_PROCESS')}
                  >
                    <Feather name="loader" size={16} color="#FFF" />
                    <Text style={styles.btnText}>Proses</Text>
                  </TouchableOpacity>
                )}

                {item.status === 'ON_PROCESS' && (
                  <TouchableOpacity 
                    style={[styles.btn, {backgroundColor: '#4CAF50'}]}
                    onPress={() => handleUpdateStatus(item.id, 'RESCUED')}
                  >
                    <Feather name="check-circle" size={16} color="#FFF" />
                    <Text style={styles.btnText}>Selesai</Text>
                  </TouchableOpacity>
                )}

                {(item.status === 'PENDING' || item.status === 'ON_PROCESS') && (
                  <TouchableOpacity 
                    style={[styles.btn, {backgroundColor: '#F44336'}]}
                    onPress={() => handleUpdateStatus(item.id, 'REJECTED')}
                  >
                    <Feather name="x-circle" size={16} color="#FFF" />
                    <Text style={styles.btnText}>Tolak</Text>
                  </TouchableOpacity>
                )}
                
                {item.status === 'RESCUED' && (
                  <Text style={{color:'#4CAF50', fontWeight:'bold', fontStyle:'italic'}}>Laporan Selesai ✅</Text>
                )}
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { backgroundColor: '#12464C', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  headerSub: { fontSize: 12, color: '#E0F2F1' },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 10 },
  
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 12, color: '#999' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  
  thumb: { width: 70, height: 70, borderRadius: 8, backgroundColor: '#EEE' },
  loc: { fontSize: 12, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  desc: { fontSize: 12, color: '#666', marginBottom: 4 },
  reporter: { fontSize: 11, color: '#12464C', fontWeight: '600' },

  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10, borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 10 },
  btn: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignItems: 'center', gap: 6 },
  btnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' }
});