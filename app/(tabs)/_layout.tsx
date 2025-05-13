import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

export default function TabLayout() {
  const [showSidebar, setShowSidebar] = useState(true);
  const [showProjectOverview, setShowProjectOverview] = useState(false);

  const handleMessagesPress = () => {
    setShowSidebar(false);
    setShowProjectOverview(true);
  };

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      {showSidebar && (
        <View style={styles.sidebar}>
          <TouchableOpacity 
            style={[styles.sidebarButton, styles.messagesButton]}
            onPress={handleMessagesPress}
          >
            <Ionicons name="chatbubble" size={24} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.sidebarButton}>
            <Ionicons name="code" size={24} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.sidebarButton}>
            <Ionicons name="cart" size={24} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.sidebarButton}>
            <Ionicons name="trash" size={24} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.sidebarButton}>
            <Ionicons name="add-circle" size={24} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.sidebarButton, styles.settingsButton]}>
            <Ionicons name="settings" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Main Content */}
      <View style={styles.content}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: 'none' },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Dashboard',
            }}
          />
          <Tabs.Screen
            name="project-overview"
            options={{
              title: 'Project Overview',
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
  },
  sidebar: {
    width: 70,
    backgroundColor: '#2a2a2a',
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sidebarButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3a3a3a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  messagesButton: {
    backgroundColor: '#0066cc',
  },
  settingsButton: {
    marginTop: 'auto',
  },
  content: {
    flex: 1,
  },
});
