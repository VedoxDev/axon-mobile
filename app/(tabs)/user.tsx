import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView } from 'react-native-gesture-handler';
import { useAuth } from '../auth/AuthProvider';

export default function UserScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const { logout, user } = useAuth();

  const handleEditPress = () => {
    console.log('Edit Profile button pressed');
    // Navigation to an edit screen would go here
  };

  const handleEditProfilePicturePress = () => {
    console.log('Edit Profile Picture button pressed');
    // Logic for changing profile picture/header info
  };

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // Navigation will be handled automatically by AuthProvider
            } catch (error) {
              Alert.alert('Error', 'No se pudo cerrar la sesión. Inténtalo de nuevo.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeAreaContainer, { backgroundColor: theme.background }]}>
      <ScrollView>
      {/* Profile Header */}
      <View style={styles.profileHeader}> 
        <Image
          source={{ uri: 'https://i.pravatar.cc/150?u=user' }}
          style={styles.avatar}
        />
        {/* Container for name and role */}
        <View style={styles.nameRoleContainer}>
          <Text style={[styles.name, { color: theme.text }]}>
            {user ? `${user.nombre} ${user.apellidos}` : 'Juan Código'}
          </Text>
          <Text style={[styles.role, { color: theme.gray }]}>
            {user ? user.email : 'Desarrollador AliExpress'}
          </Text>
        </View>
        
        {/* Edit Profile Picture/Header Button (Restored) */}
        <TouchableOpacity style={styles.editHeaderButton} onPress={handleEditProfilePicturePress}>
             <Ionicons name="pencil" size={20} color={theme.tint} />
        </TouchableOpacity>

      </View>

      {/* Edit Profile Button (Pencil Icon) */}
      {/* Removed the main edit button as requested */}

      {/* About Me Section */}
      <View style={[styles.sectionContainer, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Sobre Mí</Text>
        <Text style={[styles.aboutText, { color: theme.gray }]}>
          Apasionado por el desarrollo móvil y web, siempre buscando aprender nuevas tecnologías 
          y mejorar mis habilidades. Disfruto resolviendo problemas complejos y creando experiencias de usuario intuitivas.
        </Text>
      </View>

      {/* Stats Section */}
      <View style={[styles.sectionContainer, { backgroundColor: theme.card }]}>
         <Text style={[styles.sectionTitle, { color: theme.text }]}>Estadísticas</Text>
         <View style={styles.statsContainer}> 
           <View style={styles.statItem}>
             <Text style={[styles.statValue, { color: theme.text }]}>25</Text>
             <Text style={[styles.statLabel, { color: theme.gray }]}>Proyectos Completados</Text>
           </View>
           <View style={styles.statItem}>
             <Text style={[styles.statValue, { color: theme.text }]}>180</Text>
             <Text style={[styles.statLabel, { color: theme.gray }]}>Tareas Realizadas</Text>
           </View>
           <View style={styles.statItem}>
             <Text style={[styles.statValue, { color: theme.text }]}>5/5</Text>
             <Text style={[styles.statLabel, { color: theme.gray }]}>Rating</Text>
           </View>
         </View>
       </View>

      {/* Activity Overview (Charts Placeholder) */}
      <View style={[styles.sectionContainer, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Resumen de Actividad</Text>
        {/* Placeholder for charts - use simple Views to simulate visual elements */}
        <View style={styles.chartPlaceholderContainer}>
          <View style={[styles.chartBar, { backgroundColor: theme.tint, height: 50 }]} />
          <View style={[styles.chartBar, { backgroundColor: theme.orange, height: 70 }]} />
          <View style={[styles.chartBar, { backgroundColor: theme.primary, height: 60 }]} />
          <View style={[styles.chartBar, { backgroundColor: theme.gray, height: 40 }]} />
        </View>
      </View>

      {/* Contact Info Section (Moved lower) */}
       <View style={[styles.sectionContainer, { backgroundColor: theme.card }]}>
         <Text style={[styles.sectionTitle, { color: theme.text }]}>Información de Contacto</Text>
         <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.gray }]}>Correo</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {user ? user.email : 'juan@example.com'}
            </Text>
         </View>
         <View style={[styles.infoRow, { marginTop: 10 }]}> 
            <Text style={[styles.infoLabel, { color: theme.gray }]}>Miembro desde</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {user ? new Date(user.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' }) : 'Febrero 2024'}
            </Text>
         </View>
       </View>

       {/* Logout Button */}
       <View style={[styles.sectionContainer, { backgroundColor: 'transparent' }]}>
         <TouchableOpacity 
           style={[styles.logoutButton, { backgroundColor: theme.red || '#FF4444' }]} 
           onPress={handleLogout}
         >
           <Ionicons name="log-out-outline" size={20} color="white" style={{ marginRight: 10 }} />
           <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
         </TouchableOpacity>
       </View>
       </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
    justifyContent: 'space-between',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
  },
  nameRoleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  role: {
    fontSize: 14,
    color: 'gray',
  },
  sectionContainer: {
    width: '100%',
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: 'gray',
    marginTop: 4,
  },
  chartPlaceholderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 100,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  chartBar: {
    width: 20,
    borderRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: 'gray',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  editHeaderButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 5,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 20,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
