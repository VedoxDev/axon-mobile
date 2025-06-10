import { useColorScheme } from "@/hooks/useColorScheme";
import { Feather, Ionicons } from '@expo/vector-icons';
import { Stack, router } from "expo-router";
import { useState, useEffect } from "react";
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { Colors } from '../constants/Colors';
import { useAuth } from './auth/AuthProvider';
import PasswordStrengthBox from './PasswordStrengthBox';
import { CustomAlert } from '@/components/CustomAlert';
import { useCustomAlert } from '@/hooks/useCustomAlert';

export default function ChangePasswordScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;
  const { changePassword } = useAuth();
  const { alertConfig, showError, showSuccess, hideAlert } = useCustomAlert();

  // Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Focus states
  const [currentPasswordFocused, setCurrentPasswordFocused] = useState(false);
  const [newPasswordFocused, setNewPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Keyboard state for Android
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    number: false,
    symbol: false,
  });

  // Keyboard event listeners for Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
        setKeyboardVisible(true);
      });
      const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
        setKeyboardVisible(false);
      });

      return () => {
        keyboardDidShowListener?.remove();
        keyboardDidHideListener?.remove();
      };
    }
  }, []);

  // Check if form is valid
  const isFormValid = 
    currentPassword.length > 0 && 
    newPassword.length > 0 && 
    confirmPassword.length > 0 &&
    passwordCriteria.length &&
    passwordCriteria.uppercase &&
    passwordCriteria.number &&
    passwordCriteria.symbol;

  const validatePassword = (text: string) => {
    const criteria = {
      length: text.length >= 8 && text.length <= 64,
      uppercase: /[A-Z]/.test(text),
      number: /[0-9]/.test(text),
      symbol: /[@$!%*?&.]/.test(text),
    };
    setPasswordCriteria(criteria);
    setNewPassword(text);
  };

  const handleChangePassword = async () => {
    // Basic validation
    if (!currentPassword.trim()) {
      showError('Por favor ingresa tu contraseña actual', 'Error');
      return;
    }
    if (!newPassword.trim()) {
      showError('Por favor ingresa tu nueva contraseña', 'Error');
      return;
    }
    if (!confirmPassword.trim()) {
      showError('Por favor confirma tu nueva contraseña', 'Error');
      return;
    }

    // Password strength validation
    if (!passwordCriteria.length || !passwordCriteria.uppercase || !passwordCriteria.number || !passwordCriteria.symbol) {
      showError('La nueva contraseña debe cumplir con todos los requisitos de seguridad', 'Error');
      return;
    }

    // Password confirmation validation
    if (newPassword !== confirmPassword) {
      showError('Las nuevas contraseñas no coinciden', 'Error');
      return;
    }

    // Check if new password is different from current
    if (currentPassword === newPassword) {
      showError('La nueva contraseña debe ser diferente a la actual', 'Error');
      return;
    }

    setIsLoading(true);
    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      
      // Show success message and navigate back
      showSuccess('Contraseña cambiada exitosamente', 'Éxito', [
        {
          text: 'OK',
          onPress: () => {
            hideAlert();
            router.back();
          }
        }
      ]);
      
    } catch (error: any) {
      showError(error.message, 'Error al cambiar contraseña');
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <View style={[styles.fullContainer, { backgroundColor: theme.background }]}>
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
          style={[styles.keyboardAvoidingContainer, { backgroundColor: theme.background }]}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={[styles.container, { 
            backgroundColor: theme.background,
            paddingBottom: Platform.OS === 'android' && keyboardVisible ? 0 : 20,
            paddingTop: 60
          }]}>
            <Stack.Screen options={{ 
              headerShown: false
            }} />
            
            {/* Custom Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Cambiar Contraseña</Text>
              <View style={styles.headerSpacer} />
            </View>
            
            {/* Title and Subtitle */}
            <Text style={[styles.title, { color: theme.text, textAlign: 'left', fontFamily: 'Inter-Bold' }]}>Cambiar Contraseña</Text>
            <Text style={[styles.subtitle, { color: theme.text, textAlign: 'left', fontFamily: 'Inter-Regular' }]}>Ingresa tu contraseña actual y la nueva contraseña</Text>

            {/* Current Password Input */}
            <View style={[styles.inputContainer, { 
              borderColor: currentPasswordFocused ? theme.orange : theme.gray, 
              backgroundColor: colorScheme === 'dark' ? theme.inputBackground : theme.card 
            }]}>
              <TextInput
                style={[styles.inputInsideContainer, { color: theme.text }]}
                placeholder="Contraseña actual"
                placeholderTextColor={theme.text + "80"}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!isCurrentPasswordVisible}
                onFocus={() => setCurrentPasswordFocused(true)}
                onBlur={() => setCurrentPasswordFocused(false)}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.passwordVisibilityToggle}
                onPress={() => setIsCurrentPasswordVisible(!isCurrentPasswordVisible)}
                disabled={isLoading}
              >
                <Feather
                  name={isCurrentPasswordVisible ? 'eye-off' : 'eye'}
                  size={20}
                  color={theme.text + '80'}
                />
              </TouchableOpacity>
            </View>

            {/* New Password Input and Strength Box Container */}
            <View style={styles.passwordInputWrapper}>
              <View style={[styles.inputContainer, {
                borderColor: !newPasswordFocused && newPassword.length > 0 && (!passwordCriteria.length || !passwordCriteria.uppercase || !passwordCriteria.number || !passwordCriteria.symbol) ? theme.red : newPasswordFocused ? theme.orange : theme.gray,
                backgroundColor: colorScheme === 'dark' ? theme.inputBackground : theme.card
              }]}>
                <TextInput
                  style={[styles.inputInsideContainer, { color: theme.text }]}
                  placeholder="Nueva contraseña"
                  placeholderTextColor={theme.text + "80"}
                  value={newPassword}
                  secureTextEntry={!isNewPasswordVisible}
                  onFocus={() => setNewPasswordFocused(true)}
                  onBlur={() => setNewPasswordFocused(false)}
                  onChangeText={validatePassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.passwordVisibilityToggle}
                  onPress={() => setIsNewPasswordVisible(!isNewPasswordVisible)}
                  disabled={isLoading}
                >
                  <Feather
                    name={isNewPasswordVisible ? 'eye-off' : 'eye'}
                    size={20}
                    color={theme.text + '80'}
                  />
                </TouchableOpacity>
              </View>

              {newPasswordFocused && newPassword.length > 0 && (
                <PasswordStrengthBox criteria={passwordCriteria} theme={theme} />
              )}
            </View>

            {/* Confirm New Password Input */}
            <View style={[styles.inputContainer, { 
              borderColor: confirmPasswordFocused ? theme.orange : 
                           (confirmPassword.length > 0 && newPassword !== confirmPassword) ? theme.red : theme.gray, 
              backgroundColor: colorScheme === 'dark' ? theme.inputBackground : theme.card 
            }]}>
              <TextInput
                style={[styles.inputInsideContainer, { color: theme.text }]}
                placeholder="Confirmar nueva contraseña"
                placeholderTextColor={theme.text + "80"}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!isConfirmPasswordVisible}
                onFocus={() => setConfirmPasswordFocused(true)}
                onBlur={() => setConfirmPasswordFocused(false)}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.passwordVisibilityToggle}
                onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                disabled={isLoading}
              >
                <Feather
                  name={isConfirmPasswordVisible ? 'eye-off' : 'eye'}
                  size={20}
                  color={theme.text + '80'}
                />
              </TouchableOpacity>
            </View>

            {/* Change Password Button */}
            <TouchableOpacity 
              style={[styles.changePasswordButton, { 
                backgroundColor: isLoading ? theme.gray : theme.primary,
                opacity: (isFormValid && !isLoading) ? 1 : 0.4
              }]} 
              onPress={handleChangePassword}
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={[styles.changePasswordButtonText, { fontFamily: 'Inter-Bold' }]}>Cambiar Contraseña</Text>
              )}
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity 
              style={[styles.cancelButton, { borderColor: theme.gray }]} 
              onPress={() => router.back()}
              disabled={isLoading}
            >
              <Text style={[styles.cancelButtonText, { color: theme.text, fontFamily: 'Inter-Regular' }]}>Cancelar</Text>
            </TouchableOpacity>

            {/* Custom Alert */}
            <CustomAlert
              visible={alertConfig.visible}
              title={alertConfig.title}
              message={alertConfig.message}
              type={alertConfig.type}
              buttons={alertConfig.buttons}
              onDismiss={hideAlert}
            />

          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    marginTop: 0,
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
    paddingHorizontal: 0,
  },
  backButton: {
    backgroundColor: '#42A5F5',
    borderRadius: 20,
    padding: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 36, // Same width as back button to center the title
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 1,
    width: '100%',
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 30,
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
    borderRadius: 5,
    borderWidth: 1.5,
  },
  inputInsideContainer: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  passwordVisibilityToggle: {
    position: 'absolute',
    right: 10,
    padding: 10,
  },
  passwordInputWrapper: {
    width: '100%',
    position: 'relative',
  },
  changePasswordButton: {
    width: "100%",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 15,
    marginTop: 20,
  },
  changePasswordButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    width: "100%",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
}); 