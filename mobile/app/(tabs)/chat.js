import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Data Mockup Chat
const CHATS = [
  { 
    id: 1, 
    name: 'Admin PeduliKucing', 
    message: 'Halo, laporan Anda sedang kami verifikasi.', 
    time: '10:30', 
    unread: 2, 
    avatar: 'https://ui-avatars.com/api/?name=Admin&background=12464C&color=fff' 
  },
  { 
    id: 2, 
    name: 'Shelter Miau Depok', 
    message: 'Boleh kak, silahkan datang jam 2 siang.', 
    time: 'Kemarin', 
    unread: 0, 
    avatar: 'https://ui-avatars.com/api/?name=Shelter+Miau&background=F4A261&color=fff' 
  },
  { 
    id: 3, 
    name: 'Klinik Sehat', 
    message: 'Terima kasih donasinya kak!', 
    time: 'Senin', 
    unread: 0, 
    avatar: 'https://ui-avatars.com/api/?name=Klinik+Sehat&background=E76F51&color=fff' 
  },
];

export default function ChatListScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Pesan Masuk</Text>
        <TouchableOpacity>
          <Feather name="edit" size={20} color="#12464C" />
        </TouchableOpacity>
      </View>

      {/* List Chat */}
      <FlatList 
        data={CHATS}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.chatItem}
            onPress={() => router.push({
              pathname: '/chat-detail',
              params: { 
                name: item.name, 
                avatar: item.avatar,
                // INI YANG BARU: Kirim pesan & waktu ke dalam detail
                initialMessage: item.message, 
                initialTime: item.time
              }
            })}
          >
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
            <View style={styles.chatInfo}>
              <View style={styles.topRow}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
              <View style={styles.bottomRow}>
                <Text style={styles.message} numberOfLines={1}>{item.message}</Text>
                {item.unread > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.unread}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="message-square" size={50} color="#DDD" />
            <Text style={{color: '#999', marginTop: 10}}>Belum ada pesan</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A' },
  chatItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#EEE' },
  chatInfo: { flex: 1, marginLeft: 15 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  time: { fontSize: 12, color: '#999' },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between' },
  message: { fontSize: 14, color: '#666', flex: 1 },
  badge: { backgroundColor: '#F4A261', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  empty: { alignItems: 'center', marginTop: 100 }
});