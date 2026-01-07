import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, 
  ActivityIndicator, Image, Dimensions, ScrollView, 
  KeyboardAvoidingView, Platform 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons buat Mata
import api from '../src/services/api';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State buat mata
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Peringatan', 'Mohon isi email dan kata sandi Anda.');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(user));
      
      Alert.alert('Login Berhasil', `Selamat datang, ${user.name}!`);

      // --- LOGIC ROUTING BERDASARKAN ROLE ---
      setTimeout(() => { 
        if (user.role === 'ADMIN') {
          router.replace('/admin-dashboard');
        } else if (user.role === 'SHELTER') {
          router.replace('/shelter-dashboard');
        } else {
          // Default: USER biasa masuk ke Tabs Home
          router.replace('/(tabs)/home'); 
        }
      }, 500);
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Terjadi kesalahan saat login.';
      Alert.alert('Gagal Masuk', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialMock = (provider) => {
    Alert.alert(
      'Fitur Demo', 
      `Login dengan ${provider} belum tersedia di versi demo ini. Silakan gunakan email & password manual.`,
      [{ text: 'Siap', style: 'cancel' }]
    );
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
            <Text style={styles.title}>Selamat Datang 👋</Text>
            <Text style={styles.subtitle}>
              Hari ini adalah hari yang baru! Mari lanjutkan misi penyelamatan kucing.
            </Text>
          </View>

          <View style={styles.formSection}>
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
              {/* Container Password Baru dengan Icon Mata */}
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.inputPassword}
                  placeholder="Masukkan kata sandi Anda"
                  placeholderTextColor="#A0A0A0"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword} // Toggle secure
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="#A0A0A0" />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity style={styles.forgotPass} onPress={() => router.push('/forgot-password')}>
                <Text style={styles.forgotPassText}>Lupa Kata Sandi?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Masuk</Text>}
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Atau masuk dengan</Text>
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
            <Text style={styles.footerText}>Belum punya akun? </Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={styles.linkText}>Daftar sekarang</Text>
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
  
  // Input Biasa (Email)
  input: { height: 52, backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 16, fontSize: 14, color: '#333' },

  // Input Password (Wrapper)
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingRight: 12, // Space buat icon
  },
  inputPassword: {
    flex: 1, // Penuhin sisa ruang
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#333',
  },
  eyeIcon: {
    padding: 4,
  },

  forgotPass: { alignSelf: 'flex-end', marginTop: 10 },
  forgotPassText: { color: '#12464C', fontSize: 13, fontWeight: '600' },
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