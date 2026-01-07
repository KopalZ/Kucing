import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  TextInput, Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../src/services/api'; // Pastikan path ini benar
import { useRouter } from 'expo-router';

export default function LaporScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState(null);
  
  // Form State
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [conditionTags, setConditionTags] = useState([]); 
  const [locationCoords, setLocationCoords] = useState(null);
  const [locLoading, setLocLoading] = useState(false);

  const TAGS = ['Luka Luar', 'Sakit/Lemas', 'Hamil/Menyusui', 'Anakan', 'Butuh Pakan', 'Darurat'];

  // Toggle Tag
  const toggleTag = (tag) => {
    if (conditionTags.includes(tag)) {
      setConditionTags(conditionTags.filter(t => t !== tag));
    } else {
      setConditionTags([...conditionTags, tag]);
    }
  };

  // 1. Ambil Foto
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Ditolak', 'Mohon izinkan akses galeri untuk upload foto.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Ditolak', 'Mohon izinkan akses kamera.');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  // 2. Ambil Lokasi GPS
  const getCurrentLocation = async () => {
    setLocLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Ditolak', 'Izin lokasi diperlukan untuk fitur ini.');
        setLocLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocationCoords(location.coords);

      // Reverse Geocoding
      let addressResponse = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      if (addressResponse.length > 0) {
        const addr = addressResponse[0];
        const fullAddr = `${addr.street || ''}, ${addr.district || ''}, ${addr.city || ''}`;
        setAddress(fullAddr);
      }
    } catch (error) {
      Alert.alert('Gagal', 'Tidak bisa mengambil lokasi saat ini.');
    } finally {
      setLocLoading(false);
    }
  };

  // 3. Kirim Laporan
  const handleSubmit = async () => {
    if (!photo) {
      Alert.alert('Belum Lengkap', 'Mohon sertakan foto kucing.');
      return;
    }
    if (!address) {
      Alert.alert('Belum Lengkap', 'Mohon isi lokasi penemuan.');
      return;
    }
    if (conditionTags.length === 0) {
      Alert.alert('Belum Lengkap', 'Pilih minimal 1 kondisi kucing.');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      const formData = new FormData();
      formData.append('address', address);
      formData.append('description', description);
      // Backend minta conditionTags sebagai string, bukan array json
      formData.append('conditionTags', conditionTags.join(', '));
      
      if (locationCoords) {
        formData.append('latitude', String(locationCoords.latitude));
        formData.append('longitude', String(locationCoords.longitude));
      } else {
        // Default 0 jika user manual ketik alamat tanpa GPS (biar backend ga error)
        formData.append('latitude', '0');
        formData.append('longitude', '0');
      }

      // PERBAIKAN 1: Nama field harus 'image' sesuai backend (bukan 'reportImage')
      formData.append('image', {
        uri: photo,
        name: 'report.jpg',
        type: 'image/jpeg',
      });

      // PERBAIKAN 2: Alamat URL harus ke '/report/create' (bukan '/report')
      const response = await api.post('/report/create', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}` 
        }
      });

      Alert.alert('Terima Kasih!', 'Laporan Anda berhasil dikirim dan akan diverifikasi admin.', [
        { text: 'OK', onPress: () => {
            setPhoto(null);
            setAddress('');
            setDescription('');
            setConditionTags([]);
            router.push('/history'); 
        }}
      ]);

    } catch (error) {
      console.log("ERROR LAPOR:", error.response?.data || error.message);
      const msg = error.response?.data?.message || 'Gagal mengirim laporan.';
      Alert.alert('Gagal', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lapor Penemuan 🚨</Text>
        <Text style={styles.headerSub}>Bantu kucing liar mendapatkan pertolongan.</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex:1}}>
        <ScrollView contentContainerStyle={styles.content}>
          
          {/* FOTO UPLOAD */}
          <View style={styles.uploadSection}>
            {photo ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: photo }} style={styles.previewImage} />
                <TouchableOpacity style={styles.retakeBtn} onPress={() => setPhoto(null)}>
                  <Feather name="x" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.uploadRow}>
                <TouchableOpacity style={styles.uploadBox} onPress={takePhoto}>
                  <Feather name="camera" size={24} color="#12464C" />
                  <Text style={styles.uploadLabel}>Kamera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
                  <Feather name="image" size={24} color="#12464C" />
                  <Text style={styles.uploadLabel}>Galeri</Text>
                </TouchableOpacity>
              </View>
            )}
            <Text style={styles.helperText}>*Wajib sertakan foto kondisi terkini</Text>
          </View>

          {/* LOKASI */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Lokasi Penemuan</Text>
            <View style={styles.locationInputGroup}>
              <TextInput 
                style={styles.locationInput} 
                placeholder="Nama jalan / patokan..." 
                value={address}
                onChangeText={setAddress}
                multiline
              />
              <TouchableOpacity style={styles.gpsBtn} onPress={getCurrentLocation} disabled={locLoading}>
                {locLoading ? <ActivityIndicator color="#FFF" /> : <MaterialCommunityIcons name="crosshairs-gps" size={24} color="#FFF" />}
              </TouchableOpacity>
            </View>
          </View>

          {/* KONDISI (TAGS) */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Kondisi Kucing</Text>
            <View style={styles.tagsContainer}>
              {TAGS.map(tag => (
                <TouchableOpacity 
                  key={tag} 
                  style={[styles.tag, conditionTags.includes(tag) && styles.tagActive]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text style={[styles.tagText, conditionTags.includes(tag) && {color: '#FFF'}]}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* DESKRIPSI */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Keterangan Tambahan</Text>
            <TextInput 
              style={styles.textArea} 
              placeholder="Ceritakan detail kondisi, warna kucing, atau ciri khusus..." 
              multiline
              value={description}
              onChangeText={setDescription}
              textAlignVertical="top"
            />
          </View>

          <View style={{height: 100}} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* FOOTER BUTTON */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : (
            <>
              <Text style={styles.submitText}>Kirim Laporan</Text>
              <Feather name="send" size={20} color="#FFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFBFB' },
  header: { padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#E76F51' },
  headerSub: { fontSize: 14, color: '#777', marginTop: 4 },
  
  content: { padding: 20 },
  
  uploadSection: { marginBottom: 25 },
  uploadRow: { flexDirection: 'row', gap: 15 },
  uploadBox: { flex: 1, height: 100, borderRadius: 16, backgroundColor: '#E0F2F1', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#12464C' },
  uploadLabel: { marginTop: 8, color: '#12464C', fontWeight: 'bold' },
  previewContainer: { width: '100%', height: 200, borderRadius: 16, overflow: 'hidden', position: 'relative' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  retakeBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 20 },
  helperText: { fontSize: 12, color: '#999', marginTop: 8, fontStyle: 'italic' },

  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  
  locationInputGroup: { flexDirection: 'row', gap: 10 },
  locationInput: { flex: 1, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD', borderRadius: 12, padding: 12, fontSize: 14, minHeight: 50 },
  gpsBtn: { width: 50, borderRadius: 12, backgroundColor: '#12464C', justifyContent: 'center', alignItems: 'center' },

  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#EEE', borderWidth: 1, borderColor: '#E0E0E0' },
  tagActive: { backgroundColor: '#E76F51', borderColor: '#E76F51' },
  tagText: { fontSize: 12, color: '#555', fontWeight: '600' },
  
  textArea: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD', borderRadius: 12, padding: 12, fontSize: 14, height: 100 },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#EEE' },
  submitBtn: { backgroundColor: '#E76F51', height: 55, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, shadowColor: "#E76F51", shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});