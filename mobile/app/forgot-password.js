import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ActivityIndicator, Modal, KeyboardAvoidingView, Platform, StatusBar 
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import api from '../src/services/api';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // States Modal
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleRequestReset = () => {
    if (!email.includes('@')) {
      setErrorMessage('Masukkan alamat email yang valid.');
      setShowErrorModal(true);
      return;
    }
    setShowOtpModal(true); // Simulasi kirim OTP
  };

  const handleVerifyOtp = () => {
    if (otpCode === 'ABC123') {
      setShowOtpModal(false);
      setOtpCode('');
      setShowPassModal(true); // Lanjut input pass baru
    } else {
      setErrorMessage('Kode verifikasi salah! (Gunakan: ABC123)');
      setShowErrorModal(true);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter.');
      setShowErrorModal(true);
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, newPassword });
      setShowPassModal(false);
      alert('Sukses! Kata sandi telah diperbarui.');
      router.replace('/');
    } catch (error) {
      setErrorMessage('Gagal memperbarui kata sandi. Email mungkin tidak terdaftar.');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Lupa Kata Sandi?</Text>
        <Text style={styles.subtitle}>Masukkan email terdaftar untuk mengatur ulang kata sandi Anda.</Text>

        <View style={styles.inputContainer}>
          <Feather name="mail" size={20} color="#999" style={styles.inputIcon} />
          <TextInput 
            style={styles.input}
            placeholder="Alamat Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity style={styles.mainBtn} onPress={handleRequestReset}>
          <Text style={styles.mainBtnText}>Kirim Kode Verifikasi</Text>
        </TouchableOpacity>
      </View>

      {/* --- MODAL OTP --- */}
      <Modal animationType="fade" transparent={true} visible={showOtpModal} statusBarTranslucent={true}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior="padding" style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.iconCircle}><Feather name="shield" size={32} color="#12464C" /></View>
              <Text style={styles.modalTitle}>Verifikasi Email</Text>
              <Text style={styles.modalDesc}>Kode dikirim ke {email}. (Demo: ABC123)</Text>
              <TextInput style={styles.modalInput} placeholder="Kode OTP" value={otpCode} onChangeText={setOtpCode} autoCapitalize="characters" textAlign="center" />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowOtpModal(false)}><Text style={styles.modalBtnTextCancel}>Batal</Text></TouchableOpacity>
                <TouchableOpacity style={styles.modalBtnConfirm} onPress={handleVerifyOtp}><Text style={styles.modalBtnTextConfirm}>Verifikasi</Text></TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* --- MODAL INPUT PASSWORD BARU --- */}
{/* --- MODAL INPUT PASSWORD BARU (FIXED UX: BISA KEMBALI) --- */}
<Modal 
  animationType="fade" 
  transparent={true} 
  visible={showPassModal} 
  statusBarTranslucent={true}
  // Aktifkan kembali fungsi back di Android agar user bisa keluar
  onRequestClose={() => setShowPassModal(false)} 
>
  <View style={styles.modalOverlay}>
    <KeyboardAvoidingView behavior="padding" style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <View style={styles.iconCircle}>
          <Feather name="lock" size={32} color="#12464C" />
        </View>
        
        <Text style={styles.modalTitle}>Kata Sandi Baru</Text>
        <Text style={styles.modalDesc}>Buat kata sandi baru yang kuat untuk akun Anda.</Text>
        
        {/* Input Password dengan Icon Mata */}
        <View style={{ 
          width: '100%', 
          flexDirection: 'row', 
          alignItems: 'center', 
          backgroundColor: '#FAFAFA',
          borderWidth: 1,
          borderColor: '#DDD',
          borderRadius: 12,
          paddingHorizontal: 16,
          marginBottom: 20
        }}>
          <TextInput 
            style={{ flex: 1, height: 50, fontSize: 16 }} 
            placeholder="Minimal 6 karakter" 
            value={newPassword} 
            onChangeText={setNewPassword} 
            secureTextEntry={!isPasswordVisible} 
          />
          <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
            <Feather 
              name={isPasswordVisible ? "eye" : "eye-off"} 
              size={20} 
              color="#666" 
            />
          </TouchableOpacity>
        </View>

        {/* Tombol Aksi: Sekarang ada Batal dan Simpan (Sejajar) */}
        <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
          <TouchableOpacity 
            style={{
              flex: 1,
              height: 52,
              borderRadius: 12,
              backgroundColor: '#F5F5F5',
              justifyContent: 'center',
              alignItems: 'center',
            }} 
            onPress={() => {
              setShowPassModal(false);
              setNewPassword(''); // Bersihkan input saat batal
            }}
          >
            <Text style={{ color: '#666', fontWeight: 'bold' }}>Batal</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={{
              flex: 2, // Tombol simpan lebih lebar sebagai primary action
              height: 52,
              borderRadius: 12,
              backgroundColor: '#12464C',
              justifyContent: 'center',
              alignItems: 'center',
            }} 
            onPress={handleUpdatePassword} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Simpan</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  </View>
</Modal>

      {/* --- MODAL ERROR --- */}
      <Modal animationType="fade" transparent={true} visible={showErrorModal} statusBarTranslucent={true}>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <View style={[styles.iconCircle, { backgroundColor: '#FFEBEE' }]}><Feather name="alert-triangle" size={32} color="#FF3B30" /></View>
                <Text style={styles.modalTitle}>Terjadi Kesalahan</Text>
                <Text style={styles.modalDesc}>{errorMessage}</Text>
                <TouchableOpacity style={styles.modalBtnSingle} onPress={() => setShowErrorModal(false)}>
                  <Text style={styles.modalBtnTextCancel}>Kembali</Text>
                </TouchableOpacity>
              </View>
            </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { padding: 20 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  content: { paddingHorizontal: 30, paddingTop: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#12464C', marginBottom: 10 },
  subtitle: { fontSize: 15, color: '#666', lineHeight: 22, marginBottom: 30 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 15, height: 55, marginBottom: 20 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#333' },
  mainBtn: { backgroundColor: '#12464C', height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  mainBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  
  // MODAL STYLES (Konsisten dengan Profile)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '85%' },
  modalContent: { backgroundColor: '#FFF', borderRadius: 20, padding: 24, alignItems: 'center' },
  iconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#E0F2F1', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  modalDesc: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  modalInput: { width: '100%', height: 50, borderWidth: 1, borderColor: '#DDD', borderRadius: 12, paddingHorizontal: 16, fontSize: 16, marginBottom: 20, backgroundColor: '#FAFAFA' },
  modalActions: { flexDirection: 'row', gap: 12, width: '100%' },
  modalBtnCancel: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#F5F5F5', alignItems: 'center' },
  modalBtnTextCancel: { color: '#666', fontWeight: 'bold' },
  modalBtnConfirm: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#12464C', alignItems: 'center' },
  modalBtnTextConfirm: { color: '#FFF', fontWeight: 'bold' },
  modalBtnSingle: { width: '100%', paddingVertical: 14, borderRadius: 10, backgroundColor: '#EEE', alignItems: 'center', marginTop: 10 },
});