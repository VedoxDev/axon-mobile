import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SelectedMember {
  id: string;
  name: string;
  email: string;
}

interface SelectedMembersModalProps {
  visible: boolean;
  selectedMembers: SelectedMember[];
  onClose: () => void;
  onRemoveMember: (id: string) => void;
  theme: any;
}

export default function SelectedMembersModal({ 
  visible, 
  selectedMembers, 
  onClose, 
  onRemoveMember, 
  theme 
}: SelectedMembersModalProps) {
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: theme.separator }]}>
          <TouchableOpacity onPress={onClose} style={[styles.modalCloseButton, { backgroundColor: theme.inputBackground }]}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: theme.text }]}>
            Personas Invitadas ({selectedMembers.length})
          </Text>
          <View style={{ width: 40 }} />
        </View>
        
        <ScrollView style={styles.modalContent}>
          {selectedMembers.length > 0 ? (
            <View style={styles.membersList}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Se enviarán invitaciones a:
              </Text>
              
              {selectedMembers.map((member, index) => (
                <View 
                  key={member.id} 
                  style={[
                    styles.memberItem, 
                    { 
                      backgroundColor: theme.card,
                      borderBottomColor: theme.separator,
                      borderBottomWidth: index < selectedMembers.length - 1 ? 1 : 0
                    }
                  ]}
                >
                  <View style={styles.memberAvatar}>
                    <Ionicons name="person" size={24} color={theme.primary} />
                  </View>
                  
                  <View style={styles.memberInfo}>
                    <Text style={[styles.memberName, { color: theme.text }]}>
                      {member.name}
                    </Text>
                    <Text style={[styles.memberEmail, { color: theme.icon }]}>
                      {member.email}
                    </Text>
                  </View>
                  
                  <TouchableOpacity 
                    onPress={() => onRemoveMember(member.id)}
                    style={[styles.removeButton, { backgroundColor: theme.red + '15' }]}
                  >
                    <Ionicons name="close" size={20} color={theme.red} />
                  </TouchableOpacity>
                </View>
              ))}
              
              <View style={[styles.infoBox, { backgroundColor: theme.inputBackground, borderColor: theme.separator }]}>
                <Ionicons name="information-circle" size={20} color={theme.primary} />
                <Text style={[styles.infoText, { color: theme.text }]}>
                  Toca el ícono rojo para quitar a alguien de la lista de invitaciones.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={80} color={theme.icon} />
              <Text style={[styles.emptyStateText, { color: theme.icon }]}>
                No hay personas seleccionadas
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: theme.icon }]}>
                Usa el buscador para añadir personas al proyecto
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  modalCloseButton: {
    borderRadius: 20,
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  membersList: {
    flex: 1,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 1,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 14,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
}); 