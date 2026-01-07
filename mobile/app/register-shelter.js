import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, 
  Platform, Image, Modal, StatusBar, BackHandler 
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import api from '../src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export default function RegisterShelterScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Form States
  const [formData, setFormData] = useState({
    shelterName: '',
    shelterPhone: '',
    // shelterAddress akan kita generate dari addressComponents pas submit
    isClinic: false,
    selectedDays: [],
    openTime: '08:00',
    closeTime: '20:00',
    documentKtp: null,
    photoShelter: [] 
  });

  // State Khusus Alamat (Biar Terstruktur)
  const [addressData, setAddressData] = useState({
    province: '',
    city: '',
    district: '', // Kecamatan/Kelurahan
    street: ''    // Jalan, No Rumah, RT/RW
  });

  // UI States
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);
  const [pickingType, setPickingType] = useState('open'); 
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false); 
  const [otpCode, setOtpCode] = useState('');
  
  // Custom Error Modal States
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. DETECTOR: Cek status registrasi pas masuk
  useEffect(() => {
    const checkRegistrationStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const res = await api.get('/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Kalau data pendaftaran udah ada di DB, tendang balik
        if (res.data.user.shelterAddress || res.data.user.documentKtp) {
          Alert.alert(
            'Permintaan Terkirim',
            'Anda sudah mengirimkan permintaan pendaftaran. Silakan hubungi admin untuk info lebih lanjut.',
            [{ text: 'Oke', onPress: () => router.back() }]
          );
        }
      } catch (error) {
        console.log('Error status check:', error);
      } finally {
        setCheckingStatus(false);
      }
    };
    checkRegistrationStatus();
  }, []);

  useEffect(() => {
    const backAction = () => { handleBack(); return true; };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [step]);

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      Alert.alert(
        'Batalkan Registrasi?',
        'Data yang Anda masukkan akan hilang.',
        [
          { text: 'Lanjut Mengisi', style: 'cancel' },
          { text: 'Ya, Keluar', style: 'destructive', onPress: () => router.back() }
        ]
      );
    }
  };

  const handleNext = () => {
    if (step === 1 && (!formData.shelterName || !formData.shelterPhone)) {
      setErrorMessage('Harap lengkapi nama dan nomor telepon shelter.');
      setShowErrorModal(true);
      return;
    }
    // Validasi Step 2 (Alamat Terstruktur)
    if (step === 2) {
      const { province, city, district, street } = addressData;
      if (!province || !city || !district || !street) {
        setErrorMessage('Harap lengkapi seluruh kolom alamat (Provinsi hingga Jalan).');
        setShowErrorModal(true);
        return;
      }
      if (formData.isClinic && formData.selectedDays.length === 0) {
        setErrorMessage('Harap pilih jadwal operasional klinik.');
        setShowErrorModal(true);
        return;
      }
    }
    setStep(step + 1);
  };

  const pickKtp = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });
      if (!result.canceled) {
        setFormData({ ...formData, documentKtp: result.assets[0].uri });
      }
    } catch (error) {
      setErrorMessage('Gagal membuka galeri.');
      setShowErrorModal(true);
    }
  };

  const pickShelterPhotos = async () => {
    if (formData.photoShelter.length >= 5) {
      setErrorMessage('Maksimal hanya 5 foto shelter.');
      setShowErrorModal(true);
      return;
    }
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 5 - formData.photoShelter.length,
        quality: 0.6,
      });

      if (!result.canceled) {
        const newPhotos = result.assets.map(asset => asset.uri);
        setFormData({ ...formData, photoShelter: [...formData.photoShelter, ...newPhotos].slice(0, 5) });
      }
    } catch (error) {
      setErrorMessage('Gagal mengambil foto.');
      setShowErrorModal(true);
    }
  };

  const removePhoto = (index) => {
    const updated = formData.photoShelter.filter((_, i) => i !== index);
    setFormData({ ...formData, photoShelter: updated });
  };

  const handleConfirmTime = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    setFormData({ ...formData, [pickingType === 'open' ? 'openTime' : 'closeTime']: `${hours}:${minutes}` });
    setTimePickerVisibility(false);
  };

  const toggleDay = (day) => {
    const updated = formData.selectedDays.includes(day)
      ? formData.selectedDays.filter(d => d !== day)
      : [...formData.selectedDays, day];
    setFormData({ ...formData, selectedDays: updated });
  };

  const handleTriggerOtp = () => {
    if (!formData.documentKtp) {
      setErrorMessage('Anda wajib mengunggah foto KTP pengelola.');
      setShowErrorModal(true);
      return;
    }
    if (formData.photoShelter.length < 3) {
      setErrorMessage('Harap unggah minimal 3 foto kondisi shelter.');
      setShowErrorModal(true);
      return;
    }
    setShowOtpModal(true);
  };

  const handleFinalSubmit = async () => {
    if (otpCode !== 'ABC123') { 
      setErrorMessage('Kode OTP salah! Gunakan: ABC123');
      setShowErrorModal(true);
      return; 
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      // Gabungkan Alamat jadi 1 String Format Standar
      const fullAddress = `${addressData.street}, ${addressData.district}, ${addressData.city}, ${addressData.province}`;
      
      const opHours = `${formData.openTime}-${formData.closeTime} (${formData.selectedDays.join(',')})`;
      
      const data = new FormData();
      data.append('nickname', formData.shelterName);
      data.append('phoneNumber', formData.shelterPhone);
      data.append('shelterAddress', fullAddress); // Kirim yang sudah digabung
      data.append('isClinic', String(formData.isClinic));
      data.append('clinicOpenHours', formData.isClinic ? opHours : '');

      if (formData.documentKtp) {
        data.append('documentKtp', {
          uri: formData.documentKtp,
          name: 'ktp.jpg',
          type: 'image/jpeg',
        });
      }

      formData.photoShelter.forEach((uri, index) => {
        data.append('shelterPhotos', {
          uri: uri,
          name: `shelter_${index + 1}.jpg`,
          type: 'image/jpeg',
        });
      });

      await api.put('/auth/update-profile', data, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}` 
        }
      });

      setShowOtpModal(false);
      setShowSuccessModal(true); 
    } catch (e) { 
      setErrorMessage('Gagal terhubung ke server. Coba lagi nanti.');
      setShowErrorModal(true);
    } finally { 
      setLoading(false); 
    }
  };

  if (checkingStatus) {
    return <View style={{flex:1, justifyContent:'center'}}><ActivityIndicator size="large" color="#12464C" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.iconBtn}>
          <Feather name="chevron-left" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registrasi Shelter</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.stepperWrapper}>
        {[1, 2, 3].map((s) => (
          <View key={s} style={styles.stepIndicator}>
            <View style={[styles.stepDot, step >= s ? styles.dotActive : styles.dotInactive]}>
              {step > s ? <Feather name="check" size={14} color="#FFF" /> : <Text style={[styles.stepNum, step >= s && {color:'#FFF'}]}>{s}</Text>}
            </View>
            {s < 3 && <View style={[styles.stepLine, step > s ? styles.lineActive : styles.lineInactive]} />}
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {step === 1 && (
          <View>
            <Text style={styles.vibeTitle}>Data Diri Shelter</Text>
            <Text style={styles.vibeDesc}>Lengkapi informasi resmi pengelola shelter.</Text>
            <View style={styles.inputCard}>
              <View style={styles.field}>
                <Feather name="home" size={18} color="#999" style={styles.fieldIcon} />
                <TextInput style={styles.textInput} placeholder="Nama Shelter" value={formData.shelterName} onChangeText={t => setFormData({...formData, shelterName: t})} />
              </View>
              <View style={styles.field}>
                <Feather name="phone" size={18} color="#999" style={styles.fieldIcon} />
                <TextInput style={styles.textInput} placeholder="Nomor Telepon" keyboardType="phone-pad" value={formData.shelterPhone} onChangeText={t => setFormData({...formData, shelterPhone: t})} />
              </View>
            </View>
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.vibeTitle}>Lokasi & Operasional</Text>
            <Text style={styles.vibeDesc}>Detail alamat membantu calon adopter menemukan Anda.</Text>
            
            {/* INPUT ALAMAT TERSTRUKTUR */}
            <View style={styles.inputCard}>
              <Text style={styles.cardLabel}>DETAIL LOKASI</Text>
              
              <View style={styles.field}>
                <MaterialCommunityIcons name="map-marker-radius" size={18} color="#999" style={styles.fieldIcon} />
                <TextInput 
                  style={styles.textInput} 
                  placeholder="Provinsi (Contoh: Jawa Barat)" 
                  value={addressData.province} 
                  onChangeText={t => setAddressData({...addressData, province: t})} 
                />
              </View>

              <View style={styles.field}>
                <MaterialCommunityIcons name="city" size={18} color="#999" style={styles.fieldIcon} />
                <TextInput 
                  style={styles.textInput} 
                  placeholder="Kota/Kabupaten" 
                  value={addressData.city} 
                  onChangeText={t => setAddressData({...addressData, city: t})} 
                />
              </View>

              <View style={styles.field}>
                <MaterialCommunityIcons name="home-group" size={18} color="#999" style={styles.fieldIcon} />
                <TextInput 
                  style={styles.textInput} 
                  placeholder="Kecamatan/Kelurahan" 
                  value={addressData.district} 
                  onChangeText={t => setAddressData({...addressData, district: t})} 
                />
              </View>

              <View style={styles.addressContainer}>
                <View style={styles.pinWrapper}><Feather name="map-pin" size={18} color="#999" /></View>
                <TextInput 
                  style={styles.addressInput} 
                  multiline 
                  placeholder="Jalan, No. Rumah, RT/RW, Patokan..." 
                  value={addressData.street} 
                  onChangeText={t => setAddressData({...addressData, street: t})} 
                  placeholderTextColor="#999" 
                />
              </View>
            </View>

            <TouchableOpacity 
              activeOpacity={0.8}
              style={[styles.clinicToggle, formData.isClinic && styles.clinicToggleActive]} 
              onPress={() => setFormData({...formData, isClinic: !formData.isClinic})}
            >
              <View style={styles.clinicLeft}>
                <FontAwesome5 name="medkit" size={20} color={formData.isClinic ? "#FFF" : "#12464C"} />
                <View style={{marginLeft:12}}>
                  <Text style={[styles.toggleTitle, formData.isClinic && {color:'#FFF'}]}>Fasilitas Klinik</Text>
                  <Text style={[styles.toggleSub, formData.isClinic && {color:'rgba(255,255,255,0.7)'}]}>Tersedia bantuan medis darurat</Text>
                </View>
              </View>
              <Feather name={formData.isClinic ? "check-circle" : "circle"} size={22} color={formData.isClinic ? "#FFF" : "#DDD"} />
            </TouchableOpacity>

            {formData.isClinic && (
              <View style={styles.clinicDetail}>
                <Text style={styles.cardLabel}>HARI & JAM OPERASIONAL</Text>
                <View style={styles.daysGrid}>
                  {DAYS.map(day => (
                    <TouchableOpacity key={day} onPress={() => toggleDay(day)} style={[styles.dayChip, formData.selectedDays.includes(day) && styles.dayChipActive]}>
                      <Text style={[styles.dayText, formData.selectedDays.includes(day) && {color:'#FFF'}]}>{day}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.timePickerContainer}>
                  <TouchableOpacity style={styles.timeBtn} onPress={() => { setPickingType('open'); setTimePickerVisibility(true); }}>
                    <Text style={styles.timeLabel}>BUKA</Text>
                    <Text style={styles.timeVal}>{formData.openTime}</Text>
                  </TouchableOpacity>
                  <View style={styles.timeDivider} />
                  <TouchableOpacity style={styles.timeBtn} onPress={() => { setPickingType('close'); setTimePickerVisibility(true); }}>
                    <Text style={styles.timeLabel}>TUTUP</Text>
                    <Text style={styles.timeVal}>{formData.closeTime}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={styles.vibeTitle}>Verifikasi Dokumen</Text>
            <Text style={styles.vibeDesc}>Unggah bukti identitas (KTP) dan minimal 3 foto kondisi shelter.</Text>
            
            <TouchableOpacity style={styles.glassUpload} onPress={pickKtp}>
              {formData.documentKtp ? <Image source={{uri: formData.documentKtp}} style={styles.fullImg} /> : (
                <View style={{alignItems: 'center'}}>
                  <View style={styles.uploadCircle}><Feather name="credit-card" size={24} color="#12464C" /></View>
                  <Text style={styles.uploadMain}>Foto KTP Pengelola</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.cardLabel}>FOTO KONDISI SHELTER ({formData.photoShelter.length}/5)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoList}>
              {formData.photoShelter.map((uri, index) => (
                <View key={index} style={styles.previewBox}>
                  <Image source={{uri}} style={styles.miniImg} />
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => removePhoto(index)}>
                    <Feather name="x" size={12} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ))}
              {formData.photoShelter.length < 5 && (
                <TouchableOpacity style={styles.addMoreBtn} onPress={pickShelterPhotos}>
                  <Feather name="plus" size={24} color="#12464C" />
                  <Text style={{fontSize: 10, color: '#12464C', marginTop: 4}}>Tambah</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => step < 3 ? handleNext() : handleTriggerOtp()}>
          <Text style={styles.primaryBtnText}>{step < 3 ? 'Lanjutkan' : 'Verifikasi & Kirim'}</Text>
          <Feather name="arrow-right" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <DateTimePickerModal isVisible={isTimePickerVisible} mode="time" onConfirm={handleConfirmTime} onCancel={() => setTimePickerVisibility(false)} is24Hour />

      {/* MODAL OTP */}
      <Modal animationType="fade" transparent={true} visible={showOtpModal} statusBarTranslucent={true}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior="padding" style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.iconCircle}><Feather name="shield" size={32} color="#12464C" /></View>
              <Text style={styles.modalTitle}>Verifikasi Pendaftaran</Text>
              <Text style={styles.modalDesc}>Masukkan kode OTP: ABC123</Text>
              <TextInput style={styles.modalInput} placeholder="Kode OTP" value={otpCode} onChangeText={setOtpCode} autoCapitalize="characters" textAlign="center" />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalBtnCancel} onPress={() => { setShowOtpModal(false); setOtpCode(''); }}>
                  <Text style={styles.modalBtnTextCancel}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalBtnConfirm} onPress={handleFinalSubmit} disabled={loading}>
                  {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalBtnTextConfirm}>Verifikasi</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* MODAL SUCCESS */}
      <Modal animationType="fade" transparent visible={showSuccessModal} statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}><Feather name="check-circle" size={40} color="#2E7D32" /></View>
              <Text style={styles.modalTitle}>Pendaftaran Terkirim!</Text>
              <Text style={styles.modalDesc}>Data Anda sedang ditinjau. Kami akan memberi notifikasi jika akun Anda sudah diverifikasi.</Text>
              <TouchableOpacity style={styles.modalBtnPrimary} onPress={() => { setShowSuccessModal(false); router.back(); }}>
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Selesai</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL ERROR */}
      <Modal animationType="fade" transparent={true} visible={showErrorModal} statusBarTranslucent={true}>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <View style={[styles.iconCircle, { backgroundColor: '#FFEBEE' }]}><Feather name="alert-triangle" size={32} color="#FF3B30" /></View>
                <Text style={styles.modalTitle}>Oops!</Text>
                <Text style={styles.modalDesc}>{errorMessage}</Text>
                <TouchableOpacity style={styles.modalBtnSingle} onPress={() => setShowErrorModal(false)}>
                  <Text style={styles.modalBtnTextCancel}>Tutup</Text>
                </TouchableOpacity>
              </View>
            </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFBFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, height: 60 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  iconBtn: { width: 45, height: 45, justifyContent: 'center', alignItems: 'center' },
  stepperWrapper: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10 },
  stepIndicator: { flexDirection: 'row', alignItems: 'center' },
  stepDot: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#EEE', backgroundColor: '#FFF' },
  dotActive: { backgroundColor: '#12464C', borderColor: '#12464C' },
  dotInactive: { backgroundColor: '#FFF' },
  stepNum: { fontSize: 12, fontWeight: 'bold', color: '#12464C' },
  stepLine: { width: 40, height: 2, marginHorizontal: 5 },
  lineActive: { backgroundColor: '#12464C' },
  lineInactive: { backgroundColor: '#EEE' },
  scrollContent: { padding: 25 },
  vibeTitle: { fontSize: 24, fontWeight: '800', color: '#12464C', marginBottom: 5 },
  vibeDesc: { fontSize: 14, color: '#777', marginBottom: 30, lineHeight: 20 },
  inputCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, marginBottom: 20 },
  cardLabel: { fontSize: 11, fontWeight: 'bold', color: '#999', marginVertical: 12, letterSpacing: 1 },
  field: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9F9', borderRadius: 12, paddingHorizontal: 15, marginBottom: 12, borderWidth: 1, borderColor: '#F0F0F0' },
  fieldIcon: { marginRight: 12 },
  textInput: { flex: 1, height: 50, fontSize: 15 },
  addressContainer: { flexDirection: 'row', backgroundColor: '#F9F9F9', borderRadius: 12, borderWidth: 1, borderColor: '#F0F0F0', paddingHorizontal: 15, minHeight: 110, alignItems: 'flex-start' },
  pinWrapper: { height: 50, justifyContent: 'center', marginRight: 12 },
  addressInput: { flex: 1, paddingTop: 15, fontSize: 15, color: '#333', textAlignVertical: 'top' },
  clinicToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', padding: 18, borderRadius: 20, borderWidth: 1.5, borderColor: '#F0F0F0', marginBottom: 20 },
  clinicToggleActive: { backgroundColor: '#12464C', borderColor: '#12464C' },
  clinicLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  toggleTitle: { fontSize: 16, fontWeight: 'bold', color: '#12464C' },
  toggleSub: { fontSize: 11, color: '#888', marginTop: 2 },
  clinicDetail: { backgroundColor: '#FFF', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#E0F2F1', marginBottom: 20 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 25 },
  dayChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F5F5F5' },
  dayChipActive: { backgroundColor: '#12464C' },
  dayText: { fontSize: 12, color: '#666', fontWeight: '600' },
  timePickerContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9F9', borderRadius: 15, padding: 15 },
  timeBtn: { flex: 1, alignItems: 'center' },
  timeLabel: { fontSize: 10, color: '#999', marginBottom: 4 },
  timeVal: { fontSize: 18, fontWeight: 'bold', color: '#12464C' },
  timeDivider: { width: 1, height: 30, backgroundColor: '#DDD' },
  glassUpload: { height: 160, backgroundColor: '#FFF', borderRadius: 20, borderStyle: 'dashed', borderWidth: 2, borderColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 20 },
  uploadCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F0F7F7', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  uploadMain: { fontSize: 14, fontWeight: 'bold', color: '#12464C' },
  fullImg: { width: '100%', height: '100%' },
  photoList: { flexDirection: 'row', marginBottom: 20 },
  previewBox: { width: 100, height: 100, borderRadius: 12, marginRight: 12, overflow: 'hidden', position: 'relative' },
  miniImg: { width: '100%', height: '100%' },
  deleteBtn: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(255,0,0,0.7)', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  addMoreBtn: { width: 100, height: 100, borderRadius: 12, backgroundColor: '#F0F7F7', borderStyle: 'dashed', borderWidth: 1, borderColor: '#12464C', justifyContent: 'center', alignItems: 'center' },
  footer: { padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  primaryBtn: { backgroundColor: '#12464C', height: 60, borderRadius: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '85%' },
  modalContent: { backgroundColor: '#FFF', borderRadius: 20, padding: 24, alignItems: 'center', width: '100%' },
  iconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#E0F2F1', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  modalDesc: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  modalInput: { width: '100%', height: 50, borderWidth: 1, borderColor: '#DDD', borderRadius: 12, paddingHorizontal: 16, fontSize: 18, marginBottom: 20, backgroundColor: '#FAFAFA' },
  modalActions: { flexDirection: 'row', gap: 12, width: '100%' },
  modalBtnCancel: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#F5F5F5', alignItems: 'center' },
  modalBtnTextCancel: { color: '#666', fontWeight: 'bold' },
  modalBtnConfirm: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#12464C', alignItems: 'center' },
  modalBtnTextConfirm: { color: '#FFF', fontWeight: 'bold' },
  modalBtnSingle: { width: '100%', paddingVertical: 14, borderRadius: 10, backgroundColor: '#EEE', alignItems: 'center', marginTop: 10 },
  modalBtnPrimary: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    backgroundColor: '#12464C',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    },
});