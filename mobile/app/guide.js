import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

const GUIDES = [
  { id: 1, title: 'Cara Merawat Kitten Tanpa Induk', desc: 'Tips memberikan susu, menjaga suhu tubuh, dan stimulasi.', color: '#FFF3E0', icon: 'https://cdn-icons-png.flaticon.com/512/3460/3460335.png' },
  { id: 2, title: 'Pentingnya Sterilisasi Kucing', desc: 'Mencegah overpopulasi dan menjaga kesehatan jangka panjang.', color: '#E3F2FD', icon: 'https://cdn-icons-png.flaticon.com/512/2313/2313948.png' },
  { id: 3, title: 'Pertolongan Pertama Keracunan', desc: 'Langkah darurat jika kucing memakan benda berbahaya.', color: '#FFEBEE', icon: 'https://cdn-icons-png.flaticon.com/512/3063/3063823.png' },
  { id: 4, title: 'Makanan yang Dilarang', desc: 'Daftar makanan manusia yang beracun bagi kucing.', color: '#F3E5F5', icon: 'https://cdn-icons-png.flaticon.com/512/1046/1046857.png' },
];

export default function GuideScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Panduan & Edukasi</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Jadi Pemilik yang Lebih Baik</Text>
          <Text style={styles.heroDesc}>Pelajari cara merawat anabul kesayanganmu dengan benar.</Text>
        </View>

        {GUIDES.map((item) => (
          <TouchableOpacity key={item.id} style={[styles.card, { backgroundColor: item.color }]} activeOpacity={0.9}>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc}>{item.desc}</Text>
              <Text style={styles.readMore}>Baca Selengkapnya →</Text>
            </View>
            <Image source={{ uri: item.icon }} style={styles.cardIcon} />
          </TouchableOpacity>
        ))}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Sumber: Dokter Hewan Terpercaya</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#12464C' },
  content: { padding: 20 },
  hero: { marginBottom: 25 },
  heroTitle: { fontSize: 24, fontWeight: '900', color: '#12464C', marginBottom: 5 },
  heroDesc: { color: '#666', fontSize: 14 },
  card: { flexDirection: 'row', padding: 20, borderRadius: 20, marginBottom: 15, alignItems: 'center' },
  cardText: { flex: 1, marginRight: 10 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  cardDesc: { fontSize: 12, color: '#555', lineHeight: 18, marginBottom: 10 },
  readMore: { fontSize: 12, fontWeight: 'bold', color: '#12464C' },
  cardIcon: { width: 60, height: 60 },
  footer: { marginTop: 20, alignItems: 'center' },
  footerText: { color: '#999', fontSize: 12, fontStyle: 'italic' }
});