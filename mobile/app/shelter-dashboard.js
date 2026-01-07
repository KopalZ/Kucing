import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function ShelterDashboard() {
  const router = useRouter();

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.roleText}>ROLE: SHELTER</Text>
      <Text style={styles.title}>⛺ Home Shelter</Text>
      <Text style={{textAlign:'center', marginTop:10, color:'#666'}}>
        (Halaman ini khusus untuk Mitra Shelter mengelola kucing)
      </Text>

      <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  roleText: { fontSize: 14, fontWeight: 'bold', color: '#F4A261', marginBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold' },
  logoutBtn: { marginTop: 50, backgroundColor: '#E76F51', padding: 10, borderRadius: 8 },
  logoutText: { color: 'white', fontWeight: 'bold' }
});