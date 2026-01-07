import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, 
  ActivityIndicator, Image, Dimensions, ScrollView, 
  KeyboardAvoidingView, Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons
import api from '../src/services/api';

const { width, height } = Dimensions.get('window');

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State buat mata
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Peringatan', 'Mohon lengkapi semua data pendaftaran.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/register', { name, email, password });
      Alert.alert('Berhasil', 'Akun berhasil dibuat! Silakan Login.', [
        { text: 'OK', onPress: () => router.back() } 
      ]);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Gagal mendaftar.';
      Alert.alert('Gagal', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialMock = (provider) => {
    Alert.alert('Fitur Demo', `Pendaftaran via ${provider} dinonaktifkan untuk demo.`);
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar style="dark" />
      
      <Image 
        source={require('../src/assets/images/common/auth_bg_shape.png')} 
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
            <Image 
              source={require('../src/assets/images/common/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.titleSection}>
            <Text style={styles.title}>Buat Akun Baru</Text>
            <Text style={styles.subtitle}>
              Bergabunglah dengan komunitas kami dan mulai bantu kucing jalanan.
            </Text>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nama Lengkap</Text>
              <TextInput
                style={styles.input}
                placeholder="Nama Anda"
                placeholderTextColor="#A0A0A0"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="nama@email.com"
                placeholderTextColor="#A0A0A0"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Kata Sandi</Text>
              {/* Password Container dengan Mata */}
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.inputPassword}
                  placeholder="Minimal 6 karakter"
                  placeholderTextColor="#A0A0A0"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="#A0A0A0" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Daftar Sekarang</Text>}
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Atau daftar dengan</Text>
              <View style={styles.dividerLine} />
            </View>

             <View style={styles.socialContainer}>
                <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialMock('Google')}>
                  <Image source={require('../src/assets/images/common/google.png')} style={styles.socialIconImage} />
                  <Text style={styles.socialText}>Google</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialMock('Facebook')}>
                  <Image source={require('../src/assets/images/common/facebook.png')} style={styles.socialIconImage} />
                  <Text style={styles.socialText}>Facebook</Text>
                </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Sudah punya akun? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.linkText}>Masuk</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: 'transparent' },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: width, height: height, zIndex: -1,
    transform: [{translateY: 35}]
  },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  header: { marginBottom: 30, alignItems: 'flex-start' },
  logo: { width: 140, height: 45 },
  titleSection: { marginBottom: 30 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666666', lineHeight: 22 },
  formSection: { marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  
  // Style Input biasa
  input: { height: 52, backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 16, fontSize: 14, color: '#333' },

  // Style Input Password (Sama kaya login)
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingRight: 12,
  },
  inputPassword: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#333',
  },
  eyeIcon: {
    padding: 4,
  },

  button: { height: 52, backgroundColor: '#12464C', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 24, shadowColor: '#12464C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  dividerText: { marginHorizontal: 10, color: '#888', fontSize: 12 },
  socialContainer: { gap: 12 },
  socialButton: { flexDirection: 'row', height: 50, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  socialIconImage: { width: 24, height: 24, marginRight: 12, resizeMode: 'contain' },
  socialText: { color: '#333', fontWeight: '600', fontSize: 14 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30, paddingBottom: 20 },
  footerText: { color: '#666', fontSize: 14 },
  linkText: { color: '#12464C', fontWeight: 'bold', fontSize: 14 },
});