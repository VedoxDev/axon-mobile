import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView } from 'react-native-gesture-handler';
import { useAuth } from '../auth/AuthProvider';
import React, { useState, useEffect, useCallback } from 'react';
import { UserService, UserProfile } from '@/services/userService';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { CustomAlert } from '@/components/CustomAlert';
import { useCustomAlert } from '@/hooks/useCustomAlert';

export default function UserScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const { logout, user } = useAuth();
  const router = useRouter();
  const { showAlert, alertConfig, hideAlert } = useCustomAlert();
  
  // Profile data state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Load profile data
  const loadProfile = async () => {
    try {
      setError(null);
      const profileData = await UserService.getMyProfile();
      setProfile(profileData);
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setError(err.message || 'Error al cargar el perfil');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load profile on focus
  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  // Refresh handler
  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  const handleEditPress = () => {
    console.log('Edit Profile button pressed');
    // Navigation to an edit screen would go here
  };

  const handleEditProfilePicturePress = () => {
    console.log('Edit Profile Picture button pressed');
    // Logic for changing profile picture/header info
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time ago helper
  const timeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };



  // Get activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task': return 'checkmark-circle';
      case 'message': return 'chatbubble';
      case 'call': return 'call';
      default: return 'ellipse';
    }
  };

  const handleLogout = async () => {
    showAlert({
      title: 'Cerrar Sesión',
      message: '¿Estás seguro de que quieres cerrar sesión?',
      type: 'warning',
      buttons: [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => hideAlert()
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            hideAlert();
            try {
              await logout();
              // Navigation will be handled automatically by AuthProvider
            } catch (error) {
              showAlert({
                title: 'Error',
                message: 'No se pudo cerrar la sesión. Inténtalo de nuevo.',
                type: 'error',
                buttons: [{ text: 'OK', onPress: () => hideAlert() }]
              });
            }
          },
        },
      ]
    });
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.safeAreaContainer, { backgroundColor: theme.background }]} edges={['left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Cargando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <SafeAreaView style={[styles.safeAreaContainer, { backgroundColor: theme.background }]} edges={['left', 'right']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={theme.gray} />
          <Text style={[styles.errorText, { color: theme.text }]}>
            {error || 'Error al cargar el perfil'}
          </Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: theme.primary }]} 
            onPress={loadProfile}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeAreaContainer, { backgroundColor: theme.background }]} edges={['left', 'right']}>
      <ScrollView 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}> 
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: theme.primary + '20' }]}>
              <Text style={[styles.avatarInitial, { color: theme.primary }]}>
                {profile.fullName.split(' ').map(name => name.charAt(0)).join('').substring(0, 2).toUpperCase()}
              </Text>
            </View>
          </View>
          
          <View style={styles.nameRoleContainer}>
            <Text style={[styles.name, { color: theme.text }]}>
              {profile.fullName}
            </Text>
            <Text style={[styles.role, { color: theme.gray }]}>
              {profile.email}
            </Text>
          </View>
          
          <View style={styles.dropdownContainer}>
            <TouchableOpacity 
              style={styles.menuButton} 
              onPress={() => setShowDropdown(!showDropdown)}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color={theme.text} />
            </TouchableOpacity>
            
            {showDropdown && (
              <>
                {/* Overlay for closing dropdown */}
                <View 
                  style={styles.dropdownOverlayLocal}
                  onTouchStart={() => setShowDropdown(false)}
                />
                
                <View style={[styles.dropdown, { backgroundColor: theme.card, borderColor: theme.gray }]}>
                  <TouchableOpacity 
                    style={styles.dropdownItem}
                    onPress={() => {
                      setShowDropdown(false);
                      router.push('/changePassword');
                    }}
                  >
                    <Ionicons name="key-outline" size={18} color={theme.text} />
                    <Text style={[styles.dropdownText, { color: theme.text }]}>Cambiar contraseña</Text>
                  </TouchableOpacity>
                  
                  <View style={[styles.dropdownSeparator, { backgroundColor: theme.gray }]} />
                  
                  <TouchableOpacity 
                    style={styles.dropdownItem}
                    onPress={() => {
                      setShowDropdown(false);
                      handleLogout();
                    }}
                  >
                    <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                    <Text style={[styles.dropdownText, { color: '#EF4444' }]}>Cerrar sesión</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Insights Section */}
        <View style={[styles.sectionContainer, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="sparkles" size={20} color="#FFD700" />
            <Text style={[styles.sectionTitle, { color: theme.text, marginLeft: 8 }]}>
              Insights
            </Text>
          </View>
          
          <View style={styles.insightsContainer}>
            <View style={styles.scoreContainer}>
              <View style={[styles.scoreCircle, { borderColor: '#10B981' }]}>
                <Text style={[styles.scoreValue, { color: '#10B981' }]}>
                  {profile.insights.collaborationScore}
                </Text>
                <Text style={[styles.scoreLabel, { color: theme.gray }]}>
                  Colaboración
                </Text>
              </View>
              
              <View style={[styles.scoreCircle, { borderColor: '#3B82F6' }]}>
                <Text style={[styles.scoreValue, { color: '#3B82F6' }]}>
                  {profile.insights.leadershipScore}
                </Text>
                <Text style={[styles.scoreLabel, { color: theme.gray }]}>
                  Liderazgo
                </Text>
              </View>
            </View>
            
            <View style={styles.insightsList}>
              <View style={styles.insightItem}>
                <Ionicons name="trending-up" size={16} color={theme.primary} />
                <Text style={[styles.insightText, { color: theme.text }]}>
                  Promedio de {profile.insights.averageTasksPerProject} tareas por proyecto
                </Text>
              </View>
              
              <View style={styles.insightItem}>
                <Ionicons 
                  name={profile.insights.peakActivityType === 'communication' ? 'chatbubbles' : 'checkmark-circle'} 
                  size={16} 
                  color={theme.primary} 
                />
                <Text style={[styles.insightText, { color: theme.text }]}>
                  Enfoque principal: {profile.insights.peakActivityType === 'communication' ? 'Comunicación' : 'Gestión de tareas'}
                </Text>
              </View>
              
              {profile.insights.mostActiveProject && (
                <View style={styles.insightItem}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={[styles.insightText, { color: theme.text }]}>
                    Más activo en: {profile.insights.mostActiveProject}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Key Stats Grid */}
        <View style={[styles.sectionContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 16 }]}>Estadísticas Clave</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="folder" size={24} color="#3B82F6" />
              <Text style={[styles.statValue, { color: theme.text }]}>
                {profile.stats.totalProjects}
              </Text>
              <Text style={[styles.statLabel, { color: theme.gray }]}>
                Proyectos
              </Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <Text style={[styles.statValue, { color: theme.text }]}>
                {profile.stats.tasksCompleted}
              </Text>
              <Text style={[styles.statLabel, { color: theme.gray }]}>
                Completadas
              </Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="trending-up" size={24} color="#F59E0B" />
              <Text style={[styles.statValue, { color: theme.text }]}>
                {profile.stats.completionRate}%
              </Text>
              <Text style={[styles.statLabel, { color: theme.gray }]}>
                Eficiencia
              </Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="chatbubbles" size={24} color="#8B5CF6" />
              <Text style={[styles.statValue, { color: theme.text }]}>
                {profile.stats.messagesSent}
              </Text>
              <Text style={[styles.statLabel, { color: theme.gray }]}>
                Mensajes
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Activity Timeline */}
        <View style={[styles.sectionContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 16 }]}>Actividad Reciente</Text>
          <View style={styles.activityTimeline}>
            {profile.recentActivity.slice(0, 5).map((activity, index) => (
              <View key={index} style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: theme.background }]}>
                  <Ionicons 
                    name={getActivityIcon(activity.type)} 
                    size={16} 
                    color={theme.primary} 
                  />
                </View>
                
                <View style={styles.activityContent}>
                  <Text style={[styles.activityTitle, { color: theme.text }]}>
                    {activity.type === 'message' ? 'Mensaje enviado' : activity.title}
                  </Text>
                  <Text style={[styles.activityDetails, { color: theme.gray }]}>
                    {activity.project && `${activity.project} • `}
                    {timeAgo(activity.timestamp)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Active Projects */}
        {profile.projects.length > 0 && (
          <View style={[styles.sectionContainer, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 16 }]}>Proyectos Activos</Text>
            <View style={styles.projectsList}>
              {profile.projects.map((project, index) => (
                <View key={project.id} style={[styles.projectItem, { borderColor: theme.gray }]}>
                  <View style={styles.projectHeader}>
                    <View style={styles.projectNameContainer}>
                      <View style={[styles.projectAvatar, { backgroundColor: '#FF8C00' + '20' }]}>
                        <Text style={[styles.projectInitial, { color: '#FF8C00' }]}>
                          {project.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={[styles.projectName, { color: theme.text }]}>
                        {project.name}
                      </Text>
                    </View>
                    <View style={[
                      styles.roleBadge, 
                      { 
                        backgroundColor: project.role === 'owner' ? '#10B981' : 
                                       project.role === 'admin' ? '#3B82F6' : '#8B5CF6' 
                      }
                    ]}>
                      <Text style={styles.roleText}>
                        {project.role === 'owner' ? 'Propietario' : 
                         project.role === 'admin' ? 'Admin' : 'Miembro'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.projectStats}>
                    <Text style={[styles.projectStatText, { color: theme.gray }]}>
                      {project.taskCount} tareas • {project.messageCount} mensajes
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Member Since */}
        <View style={[styles.sectionContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Información</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar" size={20} color={theme.primary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.gray }]}>Miembro desde</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {formatDate(profile.memberSince)}
                </Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="time" size={20} color={theme.primary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.gray }]}>Última actividad</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {timeAgo(profile.lastActive)}
                </Text>
              </View>
            </View>
          </View>
        </View>


      </ScrollView>
      
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onDismiss={hideAlert}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  // Loading & Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Profile Header
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 20,
    width: '100%',
    justifyContent: 'space-between',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  nameRoleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  role: {
    fontSize: 14,
    opacity: 0.7,
  },
  dropdownContainer: {
    position: 'relative',
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
  },
  dropdown: {
    position: 'absolute',
    top: 40,
    right: 0,
    minWidth: 180,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 10,
    zIndex: 1001,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dropdownSeparator: {
    height: 1,
    marginHorizontal: 16,
  },
  
  // Section Layouts
  sectionContainer: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  // AI Insights
  insightsContainer: {
    gap: 20,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  insightsList: {
    gap: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  insightText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Activity Timeline
  activityTimeline: {
    gap: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  activityDetails: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  
  // Projects List
  projectsList: {
    gap: 12,
  },
  projectItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectInitial: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  projectStats: {
    marginTop: 4,
  },
  projectStatText: {
    fontSize: 12,
    opacity: 0.7,
  },
  
  // Info Grid
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.7,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Dropdown Overlay Local
  dropdownOverlayLocal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
});
