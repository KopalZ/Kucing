import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router'; // Import router buat navigasi

// GANTI IP SESUAI CONFIG LO
const API_URL = 'http://192.168.1.2:5000/api'; 

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// 1. Request Interceptor (Tempel Token) - SUDAH ADA
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor (HANDLE ERROR GLOBAL) - BARU
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Kalau server bilang 401 (Unauthorized) atau 404 (User Hilang saat cek profile)
    if (error.response && (error.response.status === 401 || error.response.status === 404)) {
      
      // Cek apakah errornya dari endpoint auth (login/profile) biar ga loop
      const isAuthError = error.config.url.includes('/auth/profile') || error.config.url.includes('/data/adopt');

      if (isAuthError) {
        console.log('Sesi habis atau user tidak valid. Logout paksa.');
        await AsyncStorage.multiRemove(['userToken', 'userData']);
        // Paksa pindah ke login (Ganti path sesuai struktur routing lo)
        router.replace('/index'); 
      }
    }
    return Promise.reject(error);
  }
);

export default api;