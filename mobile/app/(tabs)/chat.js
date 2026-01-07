import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  RefreshControl, StatusBar, ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../src/services/api';

export default function ChatListScreen() {
  const router = useRouter();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInbox = async () => {
    try {
      const res = await api.get('/chat/inbox');
      setChats(res.data);
    } catch (error) {
      console.log("Error inbox:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchInbox();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchInbox();
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
       return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Pesan Masuk</Text>
        <TouchableOpacity onPress={onRefresh} style={{padding: 5}}>
           <Feather name="refresh-ccw" size={20} color="#12464C" />
        </TouchableOpacity>
      </View>

      {/* Loading State */}
      {loading ? (
        <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
          <ActivityIndicator size="large" color="#12464C" />
        </View>
      ) : (
        <FlatList 
          data={chats}
          keyExtractor={item => item.partnerId.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }} // Kasih padding bawah biar ga ketutup tombol
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.chatItem}
              onPress={() => {
                router.push({
                  pathname: '/chat-detail',
                  params: { 
                    partnerId: item.partnerId, 
                    partnerName: item.partnerName,
                    partnerRole: item.partnerRole
                  }
                });
              }}
            >
              <View style={styles.avatar}>
                 <Text style={styles.avatarText}>
                   {item.partnerName ? item.partnerName.charAt(0).toUpperCase() : '?'}
                 </Text>
              </View>

              <View style={styles.chatInfo}>
                <View style={styles.topRow}>
                  <Text style={styles.name}>{item.partnerName}</Text>
                  <Text style={styles.time}>{formatTime(item.time)}</Text>
                </View>
                <View style={styles.bottomRow}>
                  <Text style={[styles.message, !item.isRead && styles.unreadMsg]} numberOfLines={1}>
                     {item.lastMessage}
                  </Text>
                  {!item.isRead && <View style={styles.dot} />}
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="message-square" size={50} color="#DDD" />
              <Text style={{color: '#999', marginTop: 10, fontWeight:'bold'}}>
                Belum ada pesan
              </Text>
              <Text style={{color: '#CCC', fontSize: 12, textAlign:'center', marginTop: 5}}>
                Tekan tombol (+) di bawah untuk{'\n'}memulai chat dengan Admin/Shelter.
              </Text>
            </View>
          }
        />
      )}

      {/* TOMBOL PLUS (FLOATING ACTION BUTTON) */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => router.push('/contact-list')}
      >
        <MaterialCommunityIcons name="message-plus" size={28} color="#FFF" />
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A' },
  
  chatItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E0F2F1', justifyContent:'center', alignItems:'center' },
  avatarText: { fontSize: 20, fontWeight:'bold', color: '#12464C' },
  
  chatInfo: { flex: 1, marginLeft: 15 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  time: { fontSize: 12, color: '#999' },
  
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems:'center' },
  message: { fontSize: 14, color: '#666', flex: 1 },
  unreadMsg: { fontWeight: 'bold', color: '#000' },
  
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E76F51', marginLeft: 5 },
  empty: { alignItems: 'center', marginTop: 100 },

  // STYLE TOMBOL PLUS
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#12464C',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  }
});