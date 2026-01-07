import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, 
  Platform, Image, Modal, StatusBar, BackHandler 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import api from '../src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

export default function AdoptionFormScreen() {
  const router = useRouter();
  const { catId, catName } = useLocalSearchParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);

  // Form States
  const [formData, setFormData] = useState({
    name: '', phone: '', ktpNumber: '', socialMedia: '', documentKtp: null,
    homeStatus: 'Rumah Milik Sendiri', isPermitted: true, stayingWith: [],
    homePhotos: [], 
    hasExperience: true, reason: '', job: '', movingPlan: '', isCommitted: true,
    // Step 4: Persetujuan
    agreements: { dataTrue: false, readyInterview: false, updateRoutine: false, shelterRight: false }
  });

  const [children, setChildren] = useState([]); 
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-fill dari Profil
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const res = await api.get('/auth/profile', { headers: { Authorization: `Bearer ${token}` } });
        const user = res.data.user;
        setFormData(prev => ({ ...prev, name: user.name, phone: user.phoneNumber }));
      } catch (error) {
        console.log('Error loading profile:', error);
      } finally {
        setFetchingProfile(false);
      }
    };
    loadUserProfile();
  }, []);

  useEffect(() => {
    const backAction = () => { handleBack(); return true; };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [step]);

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else {
      Alert.alert('Batalkan Pengajuan?', 'Data yang Anda masukkan akan hilang.', [
        { text: 'Lanjut Mengisi', style: 'cancel' },
        { text: 'Ya, Keluar', style: 'destructive', onPress: () => router.back() }
      ]);
    }
  };

  // --- LOGIC EKSKLUSIF & AUTO-CHILD ---
  const toggleStayingWith = (member) => {
    setFormData(prev => {
      let updated = [...prev.stayingWith];
      if (member === 'Sendiri') {
        updated = updated.includes('Sendiri') ? [] : ['Sendiri'];
        setChildren([]); 
      } else {
        updated = updated.filter(m => m !== 'Sendiri');
        if (updated.includes(member)) {
          updated = updated.filter(m => m !== member);
          if (member === 'Anak-anak') setChildren([]);
        } else {
          updated.push(member);
          if (member === 'Anak-anak' && children.length === 0) setChildren(['']); 
        }
      }
      return { ...prev, stayingWith: updated };
    });
  };

  const pickKtp = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.7 });
    if (!result.canceled) setFormData({ ...formData, documentKtp: result.assets[0].uri });
  };

  const pickHomePhotos = async () => {
    if (formData.homePhotos.length >= 5) { setErrorMessage('Maksimal hanya 5 foto.'); setShowErrorModal(true); return; }
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 5 - formData.homePhotos.length, quality: 0.6 });
    if (!result.canceled) {
      const newPhotos = result.assets.map(asset => asset.uri);
      setFormData({ ...formData, homePhotos: [...formData.homePhotos, ...newPhotos].slice(0, 5) });
    }
  };

  const addChild = () => { if (children.length < 5) setChildren([...children, '']); };
  const updateChildAge = (i, val) => { const up = [...children]; up[i] = val; setChildren(up); };
  const removeChild = (i) => { setChildren(children.filter((_, idx) => idx !== i)); };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name || !formData.phone || !formData.ktpNumber || !formData.documentKtp) {
        setErrorMessage('Harap lengkapi data diri dan foto KTP Anda.');
        setShowErrorModal(true); return;
      }
    }
    if (step === 2) {
      if (formData.stayingWith.length === 0) { setErrorMessage('Harap pilih dengan siapa Anda tinggal.'); setShowErrorModal(true); return; }
      if (formData.stayingWith.includes('Anak-anak') && children.some(age => !age)) {
        setErrorMessage('Harap isi usia anak di daftar anak.');
        setShowErrorModal(true); return;
      }
      if (formData.homePhotos.length < 3) { setErrorMessage('Harap unggah minimal 3 foto area rumah.'); setShowErrorModal(true); return; }
    }
    if (step === 3) {
      if (!formData.reason || !formData.job || !formData.movingPlan) {
        setErrorMessage('Harap lengkapi semua alasan dan komitmen Anda.');
        setShowErrorModal(true); return;
      }
    }
    setStep(step + 1);
  };

const handleFinalSubmit = async () => {
    // 1. Validasi Centang Semua Persetujuan
    const { dataTrue, readyInterview, updateRoutine, shelterRight } = formData.agreements;
    if (!dataTrue || !readyInterview || !updateRoutine || !shelterRight) {
      setErrorMessage('Anda wajib menyetujui seluruh poin persetujuan.');
      setShowErrorModal(true);
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      // 2. Siapkan FormData (Multi-part)
      const data = new FormData();
      data.append('catId', String(catId));
      data.append('catName', catName); // Digunakan backend untuk nama folder
      
      // Step 1: Data Diri
      data.append('fullName', formData.name); 
      data.append('phone', formData.phone);
      data.append('ktpNumber', formData.ktpNumber);
      data.append('socialMedia', formData.socialMedia || '');

      // Step 2: Lingkungan
      data.append('homeStatus', formData.homeStatus);
      data.append('isPermitted', String(formData.isPermitted));
      data.append('stayingWith', formData.stayingWith.join(', '));
      data.append('childAges', children.join(', '));

      // Step 3: Komitmen
      data.append('hasExperience', String(formData.hasExperience));
      data.append('reason', formData.reason);
      data.append('job', formData.job);
      data.append('movingPlan', formData.movingPlan);
      data.append('isCommitted', String(formData.isCommitted));

      // 3. Append File KTP
      if (formData.documentKtp) {
        data.append('documentKtp', {
          uri: formData.documentKtp,
          name: 'ktp.jpg',
          type: 'image/jpeg',
        });
      }

      // 4. Append Multiple House Photos
      formData.homePhotos.forEach((uri, index) => {
        data.append('homePhotos', {
          uri: uri,
          name: `house${index + 1}.jpg`,
          type: 'image/jpeg',
        });
      });

      // 5. Kirim ke API
      await api.post('/data/adopt', data, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}` 
        }
      });

      setShowSuccessModal(true);
    } catch (error) {
      console.error('Submit Adoption Error:', error.response?.data || error.message);
      setErrorMessage(error.response?.data?.message || 'Gagal mengirim pengajuan. Coba lagi nanti.');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.iconBtn}><Feather name="chevron-left" size={28} color="#333" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Form Adopsi</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.stepperWrapper}>
        {[1, 2, 3, 4].map((s) => (
          <View key={s} style={styles.stepIndicator}>
            <View style={[styles.stepDot, step >= s ? styles.dotActive : styles.dotInactive]}>
              {step > s ? <Feather name="check" size={14} color="#FFF" /> : <Text style={[styles.stepNum, step >= s && {color:'#FFF'}]}>{s}</Text>}
            </View>
            {s < 4 && <View style={[styles.stepLine, step > s ? styles.lineActive : styles.lineInactive]} />}
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {step === 1 && (
          <View>
            <Text style={styles.vibeTitle}>Bagian 1: Data Diri</Text>
            <Text style={styles.vibeDesc}>Lengkapi informasi identitas untuk verifikasi adopter.</Text>
            {fetchingProfile ? (
              <View style={[styles.inputCard, { paddingVertical: 40 }]}><ActivityIndicator color="#12464C" /></View>
            ) : (
              <View style={styles.inputCard}>
                <View style={styles.field}><Feather name="user" size={18} color="#999" style={styles.fieldIcon} /><TextInput style={styles.textInput} placeholder="Nama Lengkap" value={formData.name} onChangeText={t => setFormData({...formData, name: t})} /></View>
                <View style={styles.field}><Feather name="phone" size={18} color="#999" style={styles.fieldIcon} /><TextInput style={styles.textInput} placeholder="Nomor Telepon" keyboardType="phone-pad" value={formData.phone} onChangeText={t => setFormData({...formData, phone: t})} /></View>
                <View style={styles.field}><Feather name="hash" size={18} color="#999" style={styles.fieldIcon} /><TextInput style={styles.textInput} placeholder="Nomor KTP" keyboardType="numeric" value={formData.ktpNumber} onChangeText={t => setFormData({...formData, ktpNumber: t})} /></View>
                <View style={styles.field}><Feather name="instagram" size={18} color="#999" style={styles.fieldIcon} /><TextInput style={styles.textInput} placeholder="Instagram/Facebook" value={formData.socialMedia} onChangeText={t => setFormData({...formData, socialMedia: t})} /></View>
              </View>
            )}
            <Text style={styles.cardLabel}>UNGGAH FOTO KTP</Text>
            <TouchableOpacity style={styles.glassUpload} onPress={() => pickKtp()}>
              {formData.documentKtp ? <Image source={{uri: formData.documentKtp}} style={styles.fullImg} /> : (
                <View style={{alignItems: 'center'}}><View style={styles.uploadCircle}><Feather name="credit-card" size={24} color="#12464C" /></View><Text style={styles.uploadMain}>Ambil Foto KTP</Text></View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.vibeTitle}>Bagian 2: Lingkungan</Text>
            <Text style={styles.vibeDesc}>Informasi tempat tinggal membantu shelter menilai kenyamanan anabul.</Text>
            <Text style={styles.cardLabel}>TIPE TEMPAT TINGGAL</Text>
            <View style={styles.inputCard}>
              {['Rumah Milik Sendiri', 'Rumah Sewa', 'Kos', 'Apartemen'].map(type => (
                <TouchableOpacity key={type} style={styles.optionRow} onPress={() => setFormData({...formData, homeStatus: type})}>
                  <Text style={[styles.optionLabel, formData.homeStatus === type && {color: '#12464C', fontWeight: 'bold'}]}>{type}</Text>
                  <Ionicons name={formData.homeStatus === type ? "radio-button-on" : "radio-button-off"} size={20} color="#12464C" />
                </TouchableOpacity>
              ))}
            </View>

            {formData.homeStatus !== 'Rumah Milik Sendiri' && (
              <View style={styles.alertCard}>
                <Text style={styles.alertText}>Apakah pemilik mengizinkan memelihara hewan?</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity style={styles.radioItem} onPress={() => setFormData({...formData, isPermitted: true})}><Ionicons name={formData.isPermitted ? "checkmark-circle" : "ellipse-outline"} size={20} color="#12464C" /><Text style={styles.radioLabel}>Ya, Izinkan</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.radioItem} onPress={() => setFormData({...formData, isPermitted: false})}><Ionicons name={!formData.isPermitted ? "checkmark-circle" : "ellipse-outline"} size={20} color="#12464C" /><Text style={styles.radioLabel}>Tidak</Text></TouchableOpacity>
                </View>
              </View>
            )}

            <Text style={styles.cardLabel}>TINGGAL BERSAMA SIAPA?</Text>
            <View style={styles.daysGrid}>
              {['Sendiri', 'Pasangan', 'Orang Tua', 'Anak-anak'].map(member => (
                <TouchableOpacity key={member} onPress={() => toggleStayingWith(member)} style={[styles.dayChip, formData.stayingWith.includes(member) && styles.dayChipActive]}><Text style={[styles.dayText, formData.stayingWith.includes(member) && {color:'#FFF'}]}>{member}</Text></TouchableOpacity>
              ))}
            </View>

            {formData.stayingWith.includes('Anak-anak') && (
              <View style={styles.inputCard}>
                <View style={styles.childHeader}><Text style={styles.childHeaderTitle}>DAFTAR USIA ANAK (WAJIB DIISI)</Text><TouchableOpacity onPress={addChild}><Text style={styles.addChildTxt}>+ Tambah Anak</Text></TouchableOpacity></View>
                {children.map((age, i) => (
                  <View key={i} style={styles.childItem}><View style={styles.childField}>
                    <Ionicons name="happy-outline" size={18} color="#999" style={{marginLeft: 15}} />
                    <TextInput style={styles.childInput} placeholder={`Usia Anak ke-${i+1}`} keyboardType="numeric" value={age} onChangeText={t => updateChildAge(i, t)} />
                    {i > 0 && <TouchableOpacity onPress={() => removeChild(i)} style={styles.childRemove}><Feather name="x" size={18} color="#FF3B30" /></TouchableOpacity>}
                  </View></View>
                ))}
              </View>
            )}

            <Text style={styles.cardLabel}>FOTO AREA RUMAH ({formData.homePhotos.length}/5)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexDirection:'row'}}>
              {formData.homePhotos.map((uri, i) => (
                <View key={i} style={styles.previewBox}><Image source={{uri}} style={styles.fullImg} /><TouchableOpacity style={styles.deleteBtn} onPress={() => setFormData({...formData, homePhotos: formData.homePhotos.filter((_, idx)=>idx!==i)})}><Feather name="x" size={12} color="#FFF" /></TouchableOpacity></View>
              ))}
              {formData.homePhotos.length < 5 && <TouchableOpacity style={styles.addMoreBtn} onPress={pickHomePhotos}><Feather name="plus" size={24} color="#12464C" /><Text style={{fontSize: 10, color: '#12464C'}}>Tambah</Text></TouchableOpacity>}
            </ScrollView>
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={styles.vibeTitle}>Bagian 3: Komitmen</Text>
            <Text style={styles.vibeDesc}>Shelter ingin memastikan anabul berada di tangan yang tepat.</Text>
            <Text style={styles.cardLabel}>PERNAH MEMELIHARA KUCING?</Text>
            <View style={styles.inputCard}>
              <View style={styles.radioGroup}>
                <TouchableOpacity style={styles.radioItem} onPress={() => setFormData({...formData, hasExperience: true})}><Ionicons name={formData.hasExperience ? "checkmark-circle" : "ellipse-outline"} size={22} color="#12464C" /><Text style={styles.radioLabel}>Ya, Pernah</Text></TouchableOpacity>
                <TouchableOpacity style={styles.radioItem} onPress={() => setFormData({...formData, hasExperience: false})}><Ionicons name={!formData.hasExperience ? "checkmark-circle" : "ellipse-outline"} size={22} color="#12464C" /><Text style={styles.radioLabel}>Belum Pernah</Text></TouchableOpacity>
              </View>
            </View>
            <Text style={styles.cardLabel}>ALASAN UTAMA MENGADOPSI</Text>
            <View style={styles.inputCard}><TextInput style={[styles.textInput, { height: 100, textAlignVertical: 'top' }]} multiline placeholder="Apa alasan Anda?" value={formData.reason} onChangeText={t => setFormData({...formData, reason: t})} /></View>
            <Text style={styles.cardLabel}>PEKERJAAN / SUMBER PENDAPATAN</Text>
            <View style={styles.inputCard}><View style={styles.field}><Feather name="briefcase" size={18} color="#999" style={styles.fieldIcon} /><TextInput style={styles.textInput} placeholder="Sebutkan pekerjaan Anda..." value={formData.job} onChangeText={t => setFormData({...formData, job: t})} /></View></View>
            <Text style={styles.cardLabel}>RENCANA JIKA PINDAH KOTA</Text>
            <View style={styles.inputCard}><TextInput style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]} multiline placeholder="Nasib kucing jika Anda pindah?" value={formData.movingPlan} onChangeText={t => setFormData({...formData, movingPlan: t})} /></View>

            <TouchableOpacity activeOpacity={0.8} style={[styles.clinicToggle, formData.isCommitted ? styles.commitActive : styles.commitInactive]} onPress={() => setFormData({...formData, isCommitted: !formData.isCommitted})}>
              <View style={styles.clinicLeft}><View style={[styles.commitIconBox, { backgroundColor: formData.isCommitted ? '#FFF' : '#E0F2F1' }]}><Feather name="heart" size={20} color={formData.isCommitted ? "#417D7A" : "#12464C"} /></View>
              <View style={{marginLeft:12}}><Text style={[styles.toggleTitle, formData.isCommitted && {color:'#FFF'}]}>Komitmen Biaya Rutin</Text><Text style={[styles.toggleSub, formData.isCommitted && {color:'rgba(255,255,255,0.8)'}]}>Sanggup biaya pakan, vaksin & medis.</Text></View></View>
              <Feather name={formData.isCommitted ? "check-circle" : "circle"} size={22} color={formData.isCommitted ? "#FFF" : "#DDD"} />
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 4: PERSETUJUAN & KONFIRMASI */}
        {step === 4 && (
          <View>
            <Text style={styles.vibeTitle}>Persetujuan Akhir</Text>
            <Text style={styles.vibeDesc}>Mohon pahami dan setujui poin-poin berikut sebelum mengirim aplikasi.</Text>
            <View style={styles.agreementList}>
              {[
                { id: 'dataTrue', txt: 'Saya menyatakan seluruh informasi yang saya berikan adalah benar.' },
                { id: 'readyInterview', txt: 'Bersedia dihubungi & dijadwalkan sesi wawancara/survei oleh pihak rescuer.' },
                { id: 'updateRoutine', txt: 'Bersedia memberikan update kondisi kucing secara berkala pasca-adopsi.' },
                { id: 'shelterRight', txt: 'Saya mengerti shelter memiliki hak penuh untuk menolak aplikasi adopsi saya.' }
              ].map(item => (
                <TouchableOpacity key={item.id} style={styles.agreeRow} onPress={() => setFormData({ ...formData, agreements: { ...formData.agreements, [item.id]: !formData.agreements[item.id] } })}>
                  <Ionicons name={formData.agreements[item.id] ? "checkbox" : "square-outline"} size={24} color="#12464C" />
                  <Text style={styles.agreeTxt}>{item.txt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={step < 4 ? handleNext : handleFinalSubmit}>
          {loading ? <ActivityIndicator color="#FFF" /> : <><Text style={styles.primaryBtnText}>{step < 4 ? 'Lanjutkan' : 'Kirim Pengajuan'}</Text><Feather name="arrow-right" size={20} color="#FFF" /></>}
        </TouchableOpacity>
      </View>

      <Modal animationType="fade" transparent visible={showSuccessModal} statusBarTranslucent>
        <View style={styles.modalOverlay}><View style={styles.modalContainer}><View style={styles.modalContent}>
          <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}><Feather name="check-circle" size={40} color="#2E7D32" /></View>
          <Text style={styles.modalTitle}>Pengajuan Terkirim!</Text>
          <Text style={styles.modalDesc}>Shelter akan meninjau profil Anda segera.</Text>
          <TouchableOpacity style={styles.modalBtnPrimary} onPress={() => { setShowSuccessModal(false); router.replace('/home'); }}><Text style={{ color: '#FFF', fontWeight: 'bold' }}>Selesai</Text></TouchableOpacity>
        </View></View></View>
      </Modal>

      <Modal animationType="fade" transparent visible={showErrorModal} statusBarTranslucent>
        <View style={styles.modalOverlay}><View style={styles.modalContainer}><View style={styles.modalContent}>
          <View style={[styles.iconCircle, { backgroundColor: '#FFEBEE' }]}><Feather name="alert-triangle" size={32} color="#FF3B30" /></View>
          <Text style={styles.modalTitle}>Oops!</Text><Text style={styles.modalDesc}>{errorMessage}</Text>
          <TouchableOpacity style={styles.modalBtnSingle} onPress={() => setShowErrorModal(false)}><Text style={styles.modalBtnTextCancel}>Tutup</Text></TouchableOpacity>
        </View></View></View>
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
  inputCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 24, elevation: 6, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, marginBottom: 20 },
  cardLabel: { fontSize: 11, fontWeight: 'bold', color: '#999', marginVertical: 12, letterSpacing: 1 },
  field: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9F9', borderRadius: 14, paddingHorizontal: 15, marginBottom: 12, borderWidth: 1, borderColor: '#F0F0F0' },
  fieldIcon: { marginRight: 12 },
  textInput: { flex: 1, height: 50, fontSize: 15 },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  optionLabel: { fontSize: 15, color: '#666' },
  alertCard: { backgroundColor: '#E0F2F1', padding: 15, borderRadius: 15, marginBottom: 20 },
  alertText: { fontSize: 13, color: '#12464C', fontWeight: 'bold', marginBottom: 10 },
  radioGroup: { flexDirection: 'row', gap: 20 },
  radioItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  radioLabel: { fontSize: 14, color: '#12464C' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 25 },
  dayChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: '#F5F5F5' },
  dayChipActive: { backgroundColor: '#12464C' },
  dayText: { fontSize: 12, color: '#666', fontWeight: '700' },
  childHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  childHeaderTitle: { fontSize: 11, fontWeight: 'bold', color: '#999' },
  addChildTxt: { fontSize: 13, color: '#12464C', fontWeight: 'bold' },
  childItem: { marginBottom: 10 },
  childField: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9F9', borderRadius: 14, height: 54, borderWidth: 1, borderColor: '#EEE' },
  childInput: { flex: 1, paddingHorizontal: 12, fontSize: 14 },
  childRemove: { padding: 15 },
  glassUpload: { height: 160, backgroundColor: '#FFF', borderRadius: 20, borderStyle: 'dashed', borderWidth: 2, borderColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 20 },
  uploadCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F0F7F7', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  uploadMain: { fontSize: 14, fontWeight: 'bold', color: '#12464C' },
  fullImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  previewBox: { width: 100, height: 100, borderRadius: 16, marginRight: 12, overflow: 'hidden', backgroundColor: '#EEE' },
  deleteBtn: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.5)', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  addMoreBtn: { width: 100, height: 100, borderRadius: 16, backgroundColor: '#F0F7F7', borderStyle: 'dashed', borderWidth: 1, borderColor: '#12464C', justifyContent: 'center', alignItems: 'center' },
  footer: { padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  primaryBtn: { backgroundColor: '#12464C', height: 60, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '85%' },
  modalContent: { backgroundColor: '#FFF', borderRadius: 20, padding: 24, alignItems: 'center', width: '100%' },
  iconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#E0F2F1', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  modalDesc: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  modalBtnPrimary: { width: '100%', height: 50, borderRadius: 12, backgroundColor: '#12464C', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  modalBtnSingle: { width: '100%', paddingVertical: 14, borderRadius: 10, backgroundColor: '#EEE', alignItems: 'center', marginTop: 10 },
  modalBtnTextCancel: { color: '#666', fontWeight: 'bold' },
  clinicToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', padding: 18, borderRadius: 20, borderWidth: 1.5, borderColor: '#F0F0F0', marginBottom: 20 },
  clinicLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  toggleTitle: { fontSize: 16, fontWeight: 'bold', color: '#12464C' },
  toggleSub: { fontSize: 11, color: '#888', marginTop: 2 },
  commitActive: { backgroundColor: '#417D7A', borderColor: '#417D7A', elevation: 4 },
  commitInactive: { backgroundColor: '#FFF', borderColor: '#F0F0F0' },
  commitIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  // Step 4 Styles
  agreementList: { marginTop: 10 },
  agreeRow: { flexDirection: 'row', gap: 12, marginBottom: 20, alignItems: 'flex-start' },
  agreeTxt: { flex: 1, fontSize: 14, color: '#444', lineHeight: 20, fontWeight: '500' }
});