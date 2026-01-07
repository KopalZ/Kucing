import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform, TouchableOpacity, Text } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons'; 

// 1. UPDATE TIPE (Terima argument 'e' / event biar ga merah)
type CustomButtonProps = {
  children: React.ReactNode;
  onPress?: (e: any) => void; 
};

// 2. CUSTOM BUTTON 
const CustomLaporButton = ({ children, onPress }: CustomButtonProps) => (
  <TouchableOpacity
    style={styles.customButtonContainer}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={styles.customButton}>
      {children}
    </View>
    <Text style={styles.customLabel}>Lapor</Text>
  </TouchableOpacity>
);

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#12464C', 
        tabBarInactiveTintColor: '#999999',
        
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 90 : 70, 
          paddingBottom: Platform.OS === 'ios' ? 30 : 12, 
          paddingTop: 8, 
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 2,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
        }
      }}
    >
      {/* 1. HOME */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ color }) => <Feather name="home" size={24} color={color} />,
        }}
      />

      {/* 2. ADOPSI */}
      <Tabs.Screen
        name="adopsi"
        options={{
          title: 'Adopsi',
          tabBarIcon: ({ color }) => <Ionicons name="paw-outline" size={24} color={color} />,
        }}
      />

      {/* 3. LAPOR */}
      <Tabs.Screen
        name="lapor"
        options={{
          title: 'Lapor',
          tabBarButton: (props) => (
            <CustomLaporButton onPress={props.onPress}>
              <Ionicons name="megaphone-outline" size={26} color="#FFF" />
            </CustomLaporButton>
          ),
        }}
      />

      {/* 4. CHAT */}
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Pesan',
          tabBarIcon: ({ color }) => <Feather name="message-circle" size={24} color={color} />,
        }}
      />

      {/* 5. PROFIL */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Akun',
          tabBarIcon: ({ color }) => <Feather name="user" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  customButtonContainer: {
    top: -20, 
    justifyContent: 'center',
    alignItems: 'center',
    width: 70, 
  },
  customButton: {
    width: 52, 
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E76F51', 
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#E76F51',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginBottom: 4, 
  },
  customLabel: {
    color: '#E76F51', 
    fontSize: 10, 
    fontWeight: '600',
  }
});