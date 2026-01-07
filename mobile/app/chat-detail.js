import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  FlatList, Image, KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../src/services/api';

export default function ChatDetailScreen() {
  const router = useRouter();
  
  // Tangkap data lawan bicara dari halaman sebelumnya
  // partnerId = ID Admin/Shelter/User yang diajak ngobrol
  const { partnerId, partnerName, partnerRole } = useLocalSearchParams(); 
  
  const flatListRef = useRef();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState(null);

  useEffect(() => {
    getMyId();
    fetchMessages();

    // POLA "REAL-TIME" SEDERHANA:
    // Cek pesan baru setiap 3 detik (Polling)
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  // 1. Ambil ID Saya (Supaya tau mana chat kanan/kiri)
  const getMyId = async () => {
    const userData = await AsyncStorage.getItem('userData');
    if (userData) {
      setMyId(JSON.parse(userData).id);
    }
  };

  // 2. Ambil Riwayat Chat dari Server
  const fetchMessages = async () => {
    try {
      if (!partnerId) return;
      const res = await api.get(`/chat/history/${partnerId}`);
      setMessages(res.data);
      setLoading(false);
    } catch (error) {
      console.log("Error fetch chat:", error);
    }
  };

  // 3. Kirim Pesan
  const handleSend = async () => {
    if (inputText.trim().length === 0) return;

    try {
      await api.post('/chat/send', {
        receiverId: partnerId,
        content: inputText
      });
      
      setInputText(''); // Kosongkan input
      fetchMessages();  // Refresh chat
      
      // Scroll ke paling bawah
      setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);

    } catch (error) {
      console.log("Gagal kirim:", error);
      alert("Gagal mengirim pesan");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.avatarPlaceholder}>
           <Text style={styles.avatarText}>
             {partnerName ? partnerName.charAt(0).toUpperCase() : '?'}
           </Text>
        </View>
        
        <View style={{flex: 1, marginLeft: 10}}>
          <Text style={styles.headerName}>{partnerName || 'User'}</Text>
          <Text style={styles.headerStatus}>
             {partnerRole ? partnerRole : 'Online'}
          </Text>
        </View>
      </View>

      {/* CHAT BUBBLES */}
      {loading ? (
        <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
           <ActivityIndicator size="large" color="#12464C" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 20, paddingBottom: 10 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const isMe = item.senderId === myId;
            return (
              <View style={[
                styles.bubbleWrapper, 
                isMe ? styles.bubbleRight : styles.bubbleLeft
              ]}>
                <View style={[
                  styles.bubble, 
                  isMe ? styles.bgRight : styles.bgLeft
                ]}>
                  <Text style={[styles.msgText, isMe ? {color:'#FFF'} : {color:'#333'}]}>
                    {item.content}
                  </Text>
                  <Text style={[styles.timeText, isMe ? {color:'rgba(255,255,255,0.7)'} : {color:'#999'}]}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
             <Text style={{textAlign:'center', color:'#999', marginTop: 50}}>
               Mulai percakapan dengan {partnerName}...
             </Text>
          }
        />
      )}

      {/* INPUT BAR */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.inputContainer}>
          <TextInput 
            style={styles.input} 
            placeholder="Tulis pesan..." 
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            <Ionicons name="send" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E5DDD5' }, 
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE', elevation: 2 },
  backBtn: { marginRight: 10 },
  
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#12464C', justifyContent:'center', alignItems:'center' },
  avatarText: { color: '#FFF', fontWeight:'bold', fontSize: 18 },

  headerName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  headerStatus: { fontSize: 11, color: '#666' },
  
  bubbleWrapper: { marginBottom: 10, width: '100%', flexDirection: 'row' },
  bubbleLeft: { justifyContent: 'flex-start' },
  bubbleRight: { justifyContent: 'flex-end' },
  
  bubble: { maxWidth: '75%', padding: 12, borderRadius: 16, elevation: 1 },
  bgLeft: { backgroundColor: '#FFF', borderTopLeftRadius: 0 },
  bgRight: { backgroundColor: '#12464C', borderTopRightRadius: 0 },
  
  msgText: { fontSize: 15, lineHeight: 20 },
  timeText: { fontSize: 10, marginTop: 5, alignSelf: 'flex-end' },

  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#FFF', paddingBottom: 10 },
  input: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10, maxHeight: 100, fontSize: 15, marginHorizontal: 5 },
  sendBtn: { width: 45, height: 45, borderRadius: 23, backgroundColor: '#12464C', justifyContent: 'center', alignItems: 'center', elevation: 2 },
});