import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Meeting } from '@/services/meetingService';

const { width } = Dimensions.get('window');

interface MeetingInfoModalProps {
  visible: boolean;
  meeting: Meeting | null;
  onClose: () => void;
  onJoinMeeting?: (meetingId: string) => void;
}

export const MeetingInfoModal: React.FC<MeetingInfoModalProps> = ({
  visible,
  meeting,
  onClose,
  onJoinMeeting
}) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  if (!meeting) return null;

  const getStatusInfo = () => {
    switch (meeting.status) {
      case 'active':
        return { text: 'En curso', color: theme.primary, icon: 'radio-button-on' as const };
      case 'ended':
        return { text: 'Finalizada', color: '#6B7280', icon: 'checkmark-circle' as const };
      case 'cancelled':
        return { text: 'Cancelada', color: theme.red, icon: 'close-circle' as const };
      default:
        return { text: 'Programada', color: theme.orange, icon: 'time' as const };
    }
  };

  const statusInfo = getStatusInfo();
  const scheduledDate = new Date(meeting.scheduledAt);
  const canJoin = meeting.status !== 'ended' && meeting.status !== 'cancelled';

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '15' }]}>
                <Ionicons name={statusInfo.icon} size={16} color={statusInfo.color} />
                <Text style={[styles.statusText, { color: statusInfo.color }]}>
                  {statusInfo.text}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.gray} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Meeting Title */}
            <Text style={[styles.title, { color: theme.text }]}>{meeting.title}</Text>

            {/* Meeting Type Icon */}
            <View style={styles.typeContainer}>
              <Ionicons 
                name={meeting.audioOnly ? "call" : "videocam"} 
                size={20} 
                color={theme.primary} 
              />
              <Text style={[styles.typeText, { color: theme.gray }]}>
                {meeting.audioOnly ? 'Llamada de audio' : 'Videollamada'}
              </Text>
            </View>

            {/* Description */}
            {meeting.description && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Descripción</Text>
                <Text style={[styles.description, { color: theme.gray }]}>
                  {meeting.description}
                </Text>
              </View>
            )}

            {/* Date and Time */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Fecha y Hora</Text>
              <View style={styles.dateTimeContainer}>
                <View style={styles.dateTimeItem}>
                  <Ionicons name="calendar" size={16} color={theme.primary} />
                  <Text style={[styles.dateTimeText, { color: theme.text }]}>
                    {formatDate(scheduledDate)}
                  </Text>
                </View>
                <View style={styles.dateTimeItem}>
                  <Ionicons name="time" size={16} color={theme.primary} />
                  <Text style={[styles.dateTimeText, { color: theme.text }]}>
                    {formatTime(scheduledDate)} ({meeting.duration} min)
                  </Text>
                </View>
              </View>
            </View>

            {/* Actual Times for Finished Meetings */}
            {meeting.status === 'ended' && meeting.startedAt && meeting.endedAt && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Tiempos Reales</Text>
                <View style={styles.dateTimeContainer}>
                  <View style={styles.dateTimeItem}>
                    <Ionicons name="play-circle" size={16} color={theme.green} />
                    <Text style={[styles.dateTimeText, { color: theme.text }]}>
                      Iniciada: {formatTime(new Date(meeting.startedAt))}
                    </Text>
                  </View>
                  <View style={styles.dateTimeItem}>
                    <Ionicons name="stop-circle" size={16} color={theme.red} />
                    <Text style={[styles.dateTimeText, { color: theme.text }]}>
                      Finalizada: {formatTime(new Date(meeting.endedAt))}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Organizer */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Organizador</Text>
              <View style={styles.participantItem}>
                <View style={[styles.participantAvatar, { backgroundColor: theme.primary + '15' }]}>
                  <Text style={[styles.participantInitials, { color: theme.primary }]}>
                    {meeting.initiator.nombre.charAt(0)}{meeting.initiator.apellidos.charAt(0)}
                  </Text>
                </View>
                <Text style={[styles.participantName, { color: theme.text }]}>
                  {meeting.initiator.nombre} {meeting.initiator.apellidos}
                </Text>
              </View>
            </View>

            {/* Participants */}
            {meeting.participants && meeting.participants.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Participantes ({meeting.participants.length})
                </Text>
                <View style={styles.participantsContainer}>
                  {meeting.participants.map((participant, index) => {
                    const name = participant.user.name || 
                                `${participant.user.nombre} ${participant.user.apellidos}`.trim();
                    const initials = participant.user.nombre ? 
                                   participant.user.nombre.charAt(0) + (participant.user.apellidos?.charAt(0) || '') :
                                   name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2);
                    
                    return (
                      <View key={index} style={styles.participantTag}>
                        <View style={[styles.participantTagAvatar, { backgroundColor: theme.gray + '20' }]}>
                          <Text style={[styles.participantTagInitials, { color: theme.text }]}>
                            {initials}
                          </Text>
                        </View>
                        <Text style={[styles.participantTagName, { color: theme.text }]}>
                          {name}
                        </Text>
                        {participant.isConnected && (
                          <View style={[styles.connectedDot, { backgroundColor: theme.green }]} />
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Meeting ID */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>ID de Reunión</Text>
              <Text style={[styles.meetingId, { color: theme.gray }]}>{meeting.id}</Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            {canJoin && onJoinMeeting && (
              <TouchableOpacity
                style={[styles.joinButton, { backgroundColor: theme.primary }]}
                onPress={() => onJoinMeeting(meeting.id)}
              >
                <Ionicons name="videocam" size={20} color="#FFFFFF" />
                <Text style={styles.joinButtonText}>
                  {meeting.status === 'active' ? 'Unirse' : 'Unirse a la Reunión'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.closeButtonFooter, { borderColor: theme.gray }]}
              onPress={onClose}
            >
              <Text style={[styles.closeButtonText, { color: theme.text }]}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    fontFamily: 'Inter-Bold',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
    maxHeight: 500,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  typeText: {
    fontSize: 16,
    marginLeft: 8,
    fontFamily: 'Inter-Regular',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Inter-Regular',
  },
  dateTimeContainer: {
    gap: 8,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTimeText: {
    fontSize: 16,
    marginLeft: 8,
    fontFamily: 'Inter-Regular',
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  participantInitials: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-Bold',
  },
  participantName: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  participantsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  participantTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  participantTagAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  participantTagInitials: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-Bold',
  },
  participantTagName: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  connectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 6,
  },
  meetingId: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  footer: {
    padding: 20,
    paddingTop: 10,
    gap: 12,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-Bold',
  },
  closeButtonFooter: {
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-Bold',
  },
}); 