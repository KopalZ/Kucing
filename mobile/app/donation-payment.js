import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, 
  ScrollView, Alert, ActivityIndicator, Modal 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons'; // Tambah FontAwesome5 buat QRIS
import api from '../src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AMOUNTS = [10000, 20000, 50000, 100000];

export default function DonationPaymentScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // ID Campaign
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleDonate = async () => {
    // Bersihkan format Rp/Titik koma biar jadi angka murni
    const finalAmount = parseInt(amount.replace(/\D/g, ''));
    
    // 1. Validasi Input Frontend
    if (!finalAmount || finalAmount < 10000) {
      Alert.alert('Minimal Donasi', 'Mohon donasi minimal Rp 10.000');
      return;
    }
    if (!selectedMethod) {
      Alert.alert('Metode Pembayaran', 'Silakan pilih metode pembayaran (Gopay/OVO/QRIS/Bank).');
      return;
    }
    if (!id) {
        Alert.alert('Error', 'ID Campaign tidak ditemukan. Kembali ke halaman sebelumnya.');
        return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      console.log("Mengirim Data Donasi:", {
        campaignId: parseInt(id),
        amount: finalAmount,
        paymentMethod: selectedMethod
      });

      // 2. Kirim ke Backend
      await api.post('/data/donate', {
        campaignId: parseInt(id), // Pastikan jadi integer
        amount: finalAmount,
        paymentMethod: selectedMethod,
        isAnonymous: false,
        message: 'Semoga bermanfaat anabul!'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 3. Sukses
      setShowSuccess(true);
    } catch (error) {
      console.log("ERROR DONASI:", error.response?.data || error.message);
      
      // Tampilkan Pesan Error Asli dari Backend biar ketahuan salahnya
      const msg = error.response?.data?.message || error.message || 'Terjadi kesalahan jaringan.';
      Alert.alert('Gagal Donasi', `Server bilang: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Isi Nominal Donasi</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* INPUT NOMINAL */}
        <Text style={styles.label}>Mau donasi berapa?</Text>
        <View style={styles.inputWrapper}>
          <Text style={styles.currency}>Rp</Text>
          <TextInput 
            style={styles.inputAmount} 
            value={amount ? parseInt(amount).toLocaleString('id-ID') : ''}
            onChangeText={(t) => setAmount(t.replace(/\D/g, ''))}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#CCC"
          />
        </View>

        {/* PILIHAN CEPAT */}
        <View style={styles.chipContainer}>
          {AMOUNTS.map((val) => (
            <TouchableOpacity 
              key={val} 
              style={[styles.chip, parseInt(amount.replace(/\D/g, '')) === val && styles.chipActive]}
              onPress={() => setAmount(val.toString())}
            >
              <Text style={[styles.chipText, parseInt(amount.replace(/\D/g, '')) === val && {color:'#FFF'}]}>
                {val.toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* METODE PEMBAYARAN */}
        <Text style={styles.label}>Pilih Metode Pembayaran</Text>
        <View style={styles.methodCard}>
          {/* QRIS (BARU) */}
          <MethodItem 
            iconType="MaterialCommunityIcons" icon="qrcode-scan" color="#1A1A1A" name="QRIS" 
            desc="Scan cepat & mudah"
            selected={selectedMethod === 'QRIS'} 
            onPress={() => setSelectedMethod('QRIS')} 
          />
          <View style={styles.divider} />

          {/* E-Wallet */}
          <MethodItem 
            iconType="MaterialCommunityIcons" icon="wallet" color="#008CFF" name="Gopay" 
            selected={selectedMethod === 'GOPAY'} 
            onPress={() => setSelectedMethod('GOPAY')} 
          />
          <View style={styles.divider} />
          
          <MethodItem 
            iconType="MaterialCommunityIcons" icon="credit-card" color="#5E35B1" name="OVO" 
            selected={selectedMethod === 'OVO'} 
            onPress={() => setSelectedMethod('OVO')} 
          />
          <View style={styles.divider} />
          
          {/* Transfer Bank */}
          <MethodItem 
            iconType="MaterialCommunityIcons" icon="bank" color="#12464C" name="Transfer Bank (VA)" 
            selected={selectedMethod === 'BANK_TRANSFER'} 
            onPress={() => setSelectedMethod('BANK_TRANSFER')} 
          />
        </View>

        <View style={{height: 50}} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.payBtn} onPress={handleDonate} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : (
            <Text style={styles.payText}>Lanjut Pembayaran</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* MODAL SUKSES */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <MaterialCommunityIcons name="check-circle" size={60} color="#2E7D32" />
            <Text style={styles.successTitle}>Donasi Berhasil!</Text>
            <Text style={styles.successDesc}>Terima kasih orang baik. Donasi Anda telah tercatat.</Text>
            
            {selectedMethod === 'QRIS' && (
               <View style={styles.qrisInfo}>
                  <MaterialCommunityIcons name="qrcode" size={100} color="#000" />
                  <Text style={{fontSize: 10, color:'#666', marginTop:5}}>(Simulasi QR Code)</Text>
               </View>
            )}

            <TouchableOpacity 
              style={styles.closeBtn} 
              onPress={() => { setShowSuccess(false); router.replace('/history'); }}
            >
              <Text style={styles.closeText}>Lihat Riwayat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Komponen Item Metode Pembayaran yang Lebih Rapi
const MethodItem = ({ iconType, icon, color, name, desc, selected, onPress }) => (
  <TouchableOpacity style={[styles.methodRow, selected && styles.methodRowActive]} onPress={onPress} activeOpacity={0.7}>
    <View style={{flexDirection:'row', alignItems:'center', gap: 12, flex: 1}}>
      <View style={[styles.iconBox, {backgroundColor: color + '15'}]}>
        {iconType === 'FontAwesome5' ? (
           <FontAwesome5 name={icon} size={20} color={color} />
        ) : (
           <MaterialCommunityIcons name={icon} size={24} color={color} />
        )}
      </View>
      <View>
        <Text style={styles.methodName}>{name}</Text>
        {desc && <Text style={styles.methodDesc}>{desc}</Text>}
      </View>
    </View>
    
    <View style={[styles.radio, selected && styles.radioActive]}>
      {selected && <View style={styles.radioDot} />}
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#FFF', elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 15, color: '#333' },
  backBtn: { padding: 4 },
  
  content: { padding: 20 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, marginTop: 10, color: '#333' },
  
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 20, height: 60, marginBottom: 15, borderWidth: 1, borderColor: '#EEE' },
  currency: { fontSize: 20, fontWeight: 'bold', color: '#999', marginRight: 10 },
  inputAmount: { flex: 1, fontSize: 24, fontWeight: 'bold', color: '#12464C' },
  
  chipContainer: { flexDirection: 'row', gap: 8, marginBottom: 30, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD' },
  chipActive: { backgroundColor: '#12464C', borderColor: '#12464C' },
  chipText: { fontWeight: 'bold', color: '#555' },
  
  methodCard: { backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#EEE' },
  methodRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  methodRowActive: { backgroundColor: '#F0F7F7' }, // Highlight kalau dipilih
  
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  methodName: { fontSize: 15, fontWeight: '600', color: '#333' },
  methodDesc: { fontSize: 11, color: '#888', marginTop: 2 },
  
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#DDD', justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: '#12464C' },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#12464C' },
  
  divider: { height: 1, backgroundColor: '#F0F0F0', marginLeft: 70 },
  
  footer: { padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#EEE' },
  payBtn: { backgroundColor: '#F4A261', height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: '#F4A261', shadowOpacity: 0.3, shadowOffset: {width:0,height:4}, elevation: 4 },
  payText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#FFF', padding: 30, borderRadius: 24, alignItems: 'center', elevation: 5 },
  successTitle: { fontSize: 22, fontWeight: 'bold', marginTop: 15, color: '#12464C' },
  successDesc: { textAlign: 'center', color: '#666', marginTop: 8, marginBottom: 20, lineHeight: 22 },
  qrisInfo: { alignItems: 'center', marginBottom: 20, padding: 10, backgroundColor: '#F9F9F9', borderRadius: 10 },
  closeBtn: { backgroundColor: '#12464C', width: '100%', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  closeText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});