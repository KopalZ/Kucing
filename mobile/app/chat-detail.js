import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  FlatList, Image, KeyboardAvoidingView, Platform, StatusBar 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';

export default function ChatDetailScreen() {
  const router = useRouter();
  
  // 1. Tangkap Data (Termasuk pesan awal dari halaman depan)
  const { name, avatar, initialMessage, initialTime } = useLocalSearchParams(); 
  
  const flatListRef = useRef();
  const [message, setMessage] = useState('');

  // 2. Set Pesan Awal (Pakai initialMessage kalau ada)
  const [chatHistory, setChatHistory] = useState([
    { 
      id: '1', 
      text: initialMessage || 'Halo kak, ada yang bisa kami bantu?', 
      time: initialTime || '10:30', 
      isMe: false 
    },
  ]);

  // Fungsi Kirim Pesan
  const handleSend = () => {
    if (message.trim().length === 0) return;

    const newMsg = {
      id: Date.now().toString(),
      text: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };

    setChatHistory((prev) => [...prev, newMsg]);
    setMessage('');

    // Simulasi Balasan Bot (Auto Reply)
    setTimeout(() => {
      const replyMsg = {
        id: (Date.now() + 1).toString(),
        text: 'Baik kak, pesan sudah kami terima. Mohon ditunggu ya.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: false,
      };
      setChatHistory((prev) => [...prev, replyMsg]);
    }, 1500);
  };

  // Auto scroll ke bawah saat ada chat baru
  useEffect(() => {
    setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
    }, 200);
  }, [chatHistory]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        
        <Image source={{ uri: avatar || 'https://via.placeholder.com/50' }} style={styles.avatar} />
        
        <View style={{flex: 1, marginLeft: 10}}>
          <Text style={styles.headerName}>{name || 'Admin'}</Text>
          <Text style={styles.headerStatus}>Online</Text>
        </View>

        <TouchableOpacity>
          <Feather name="more-vertical" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* CHAT BUBBLES */}
      <FlatList
        ref={flatListRef}
        data={chatHistory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 10 }}
        renderItem={({ item }) => (
          <View style={[
            styles.bubbleWrapper, 
            item.isMe ? styles.bubbleRight : styles.bubbleLeft
          ]}>
            <View style={[
              styles.bubble, 
              item.isMe ? styles.bgRight : styles.bgLeft
            ]}>
              <Text style={[styles.msgText, item.isMe ? {color:'#FFF'} : {color:'#333'}]}>
                {item.text}
              </Text>
              <Text style={[styles.timeText, item.isMe ? {color:'rgba(255,255,255,0.7)'} : {color:'#999'}]}>
                {item.time}
              </Text>
            </View>
          </View>
        )}
      />

      {/* INPUT BAR */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachBtn}>
            <Feather name="plus" size={24} color="#999" />
          </TouchableOpacity>
          
          <TextInput 
            style={styles.input} 
            placeholder="Tulis pesan..." 
            value={message}
            onChangeText={setMessage}
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
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#DDD' },
  headerName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  headerStatus: { fontSize: 12, color: '#2E7D32', fontWeight: 'bold' },
  
  bubbleWrapper: { marginBottom: 10, width: '100%', flexDirection: 'row' },
  bubbleLeft: { justifyContent: 'flex-start' },
  bubbleRight: { justifyContent: 'flex-end' },
  
  bubble: { maxWidth: '75%', padding: 12, borderRadius: 16, elevation: 1 },
  bgLeft: { backgroundColor: '#FFF', borderTopLeftRadius: 0 },
  bgRight: { backgroundColor: '#12464C', borderTopRightRadius: 0 },
  
  msgText: { fontSize: 15, lineHeight: 20 },
  timeText: { fontSize: 10, marginTop: 5, alignSelf: 'flex-end' },

  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#FFF', paddingBottom: 20 },
  attachBtn: { padding: 10 },
  input: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10, maxHeight: 100, fontSize: 15, marginHorizontal: 5 },
  sendBtn: { width: 45, height: 45, borderRadius: 23, backgroundColor: '#12464C', justifyContent: 'center', alignItems: 'center', elevation: 2 },
});