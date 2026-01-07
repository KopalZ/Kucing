import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, StatusBar, Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import api from '../src/services/api';

export default function ContactListScreen() {
  const router = useRouter();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await api.get('/chat/contacts');
      setContacts(res.data);
    } catch (error) {
      console.log("Error contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderRoleBadge = (role) => {
    const color = role === 'ADMIN' ? '#E76F51' : '#2A9D8F';
    return (
      <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color }]}>
        <Text style={[styles.badgeText, { color: color }]}>{role}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
           <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Mulai Chat Baru</Text>
      </View>

      {/* LIST CONTACTS */}
      {loading ? (
        <ActivityIndicator size="large" color="#12464C" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.card}
              onPress={() => {
                // Navigasi ke Ruang Chat
                router.replace({
                  pathname: '/chat-detail',
                  params: { 
                    partnerId: item.id, 
                    partnerName: item.nickname || item.name, // Utamakan nickname (nama shelter)
                    partnerRole: item.role
                  }
                });
              }}
            >
              {/* Avatar */}
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(item.nickname || item.name).charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.info}>
                <Text style={styles.name}>{item.nickname || item.name}</Text>
                {renderRoleBadge(item.role)}
              </View>

              <Feather name="message-circle" size={24} color="#12464C" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={{textAlign:'center', color:'#999', marginTop: 50}}>
              Tidak ada kontak Admin/Shelter ditemukan.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  backBtn: { marginRight: 15 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 15, elevation: 2 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#12464C', justifyContent:'center', alignItems:'center' },
  avatarText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  
  info: { flex: 1, marginLeft: 15 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: 'bold' }
});