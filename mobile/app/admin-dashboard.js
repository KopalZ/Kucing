import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function AdminDashboard() {
  const router = useRouter();

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.roleText}>ROLE: ADMIN</Text>
      <Text style={styles.title}>🛡️ Home Admin</Text>
      <Text style={{textAlign:'center', marginTop:10, color:'#666'}}>
        (Halaman ini khusus Admin untuk approve/reject data)
      </Text>

      <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  roleText: { fontSize: 14, fontWeight: 'bold', color: 'red', marginBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold' },
  logoutBtn: { marginTop: 50, backgroundColor: '#333', padding: 10, borderRadius: 8 },
  logoutText: { color: 'white', fontWeight: 'bold' }
});