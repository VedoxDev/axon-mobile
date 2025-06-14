import { useColorScheme } from "@/hooks/useColorScheme";
import { Feather } from '@expo/vector-icons';
import { Stack, router } from "expo-router";
import { useState, useEffect } from "react";
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View, Linking } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { useAuth } from './auth/AuthProvider';
import PasswordStrengthBox from './PasswordStrengthBox';
import { CustomAlert } from '@/components/CustomAlert';
import { useCustomAlert } from '@/hooks/useCustomAlert';

export default function RegisterScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;
  const { register, isLoading } = useAuth();
  const { alertConfig, showError, hideAlert } = useCustomAlert();

  // Form state
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Focus states
  const [nombreFocused, setNombreFocused] = useState(false);
  const [apellidosFocused, setApellidosFocused] = useState(false);
  const [correoFocused, setCorreoFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

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

  // Function to filter numbers and special characters from name fields
  const filterNumbers = (text: string) => {
    // Remove numbers and special characters, only allow letters, spaces, hyphens, and accented characters
    return text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-']/g, '');
  };

  // Email validation function
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  // Check if form is valid
  const isFormValid = 
    nombre.trim().length > 0 && 
    apellidos.trim().length > 0 && 
    isValidEmail(email) && 
    password.length > 0 && 
    confirmPassword.length > 0 && 
    termsAccepted;

  const validatePassword = (text: string) => {
    const criteria = {
      length: text.length >= 8 && text.length <= 64,
      uppercase: /[A-Z]/.test(text),
      number: /[0-9]/.test(text),
      symbol: /[@$!%*?&.]/.test(text),
    };
    setPasswordCriteria(criteria);
    setPassword(text);
  };

  // Function to open the website
  const openWebsite = async () => {
    try {
      const url = 'https://axon-landing.vercel.app/';
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.log('Cannot open URL:', url);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

  const handleRegister = async () => {
    // Basic validation
    if (!nombre.trim()) {
      showError('Por favor ingresa tu nombre', 'Error');
      return;
    }
    if (!apellidos.trim()) {
      showError('Por favor ingresa tus apellidos', 'Error');
      return;
    }
    if (!email.trim()) {
      showError('Por favor ingresa tu email', 'Error');
      return;
    }
    if (!password.trim()) {
      showError('Por favor ingresa tu contraseña', 'Error');
      return;
    }
    if (!confirmPassword.trim()) {
      showError('Por favor confirma tu contraseña', 'Error');
      return;
    }

    // Email validation
    if (!isValidEmail(email.trim())) {
      showError('Por favor ingresa un email válido', 'Error');
      return;
    }

    // Password strength validation
    if (!passwordCriteria.length || !passwordCriteria.uppercase || !passwordCriteria.number || !passwordCriteria.symbol) {
      showError('La contraseña debe cumplir con todos los requisitos de seguridad', 'Error');
      return;
    }

    // Password confirmation validation
    if (password !== confirmPassword) {
      showError('Las contraseñas no coinciden', 'Error');
      return;
    }

    // Terms validation
    if (!termsAccepted) {
      showError('Debes aceptar los términos y condiciones', 'Error');
      return;
    }

    try {
      await register(email.trim(), nombre.trim(), apellidos.trim(), password);
      // On successful registration, show welcome toast
      // The navigation will be handled automatically by the AuthProvider and _layout.tsx
    } catch (error: any) {
      showError(error.message, 'Error de registro');
    }
  };

  const insets = useSafeAreaInsets();

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
            paddingBottom: Platform.OS === 'android' && keyboardVisible ? 0 : 20 
          }]}>
            <Stack.Screen options={{ headerShown: false }} />
            {/* Title and Subtitle */}
            <Text style={[styles.title, { color: theme.text, textAlign: 'left', fontFamily: 'Inter-Bold' }]}>Registrate</Text>
            <Text style={[styles.subtitle, { color: theme.text, textAlign: 'left', fontFamily: 'Inter-Regular' }]}>Crea tu cuenta para continuar</Text>

            {/* Input Fields */}
            <TextInput
              style={[styles.input, { backgroundColor: colorScheme === 'dark' ? theme.inputBackground : theme.card, color: theme.text, borderColor: nombreFocused ? theme.orange : theme.gray }]}
              placeholder="Nombre"
              placeholderTextColor={theme.text + "80"}
              value={nombre}
              onChangeText={(text) => setNombre(filterNumbers(text))}
              onFocus={() => setNombreFocused(true)}
              onBlur={() => setNombreFocused(false)}
              autoCapitalize="words"
              editable={!isLoading}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colorScheme === 'dark' ? theme.inputBackground : theme.card, color: theme.text, borderColor: apellidosFocused ? theme.orange : theme.gray }]}
              placeholder="Apellidos"
              placeholderTextColor={theme.text + "80"}
              value={apellidos}
              onChangeText={(text) => setApellidos(filterNumbers(text))}
              onFocus={() => setApellidosFocused(true)}
              onBlur={() => setApellidosFocused(false)}
              autoCapitalize="words"
              editable={!isLoading}
            />

            <View style={[styles.inputContainer, { borderColor: correoFocused ? theme.orange : theme.gray, backgroundColor: colorScheme === 'dark' ? theme.inputBackground : theme.card }]}>
              <TextInput
                style={[styles.inputInsideContainer, { color: theme.text }]}
                placeholder="Correo"
                placeholderTextColor={theme.text + "80"}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setCorreoFocused(true)}
                onBlur={() => setCorreoFocused(false)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            {/* Password Input and Strength Box Container */}
            <View style={styles.passwordInputWrapper}>
              <View style={[styles.inputContainer, {
                borderColor: !passwordFocused && password.length > 0 && (!passwordCriteria.length || !passwordCriteria.uppercase || !passwordCriteria.number || !passwordCriteria.symbol) ? theme.red : passwordFocused ? theme.orange : theme.gray,
                backgroundColor: colorScheme === 'dark' ? theme.inputBackground : theme.card
              }]}>
                <TextInput
                  style={[styles.inputInsideContainer, { color: theme.text }]}
                  placeholder="Contraseña"
                  placeholderTextColor={theme.text + "80"}
                  value={password}
                  secureTextEntry={!isPasswordVisible}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  onChangeText={validatePassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.passwordVisibilityToggle}
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                  disabled={isLoading}
                >
                  <Feather
                    name={isPasswordVisible ? 'eye-off' : 'eye'}
                    size={20}
                    color={theme.text + '80'}
                  />
                </TouchableOpacity>
              </View>

              {passwordFocused && password.length > 0 && (
                <PasswordStrengthBox criteria={passwordCriteria} theme={theme} />
              )}
            </View>

            <View style={[styles.inputContainer, { borderColor: confirmPasswordFocused ? theme.orange : theme.gray, backgroundColor: colorScheme === 'dark' ? theme.inputBackground : theme.card }]}>
              <TextInput
                style={[styles.inputInsideContainer, { color: theme.text }]}
                placeholder="Confirmar contraseña"
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

            {/* Checkbox */}
            <View style={styles.checkboxContainer}>
              <TouchableOpacity 
                style={[styles.checkbox, { borderColor: termsAccepted ? theme.orange : theme.gray, backgroundColor: termsAccepted ? theme.orange : 'transparent' }]} 
                onPress={() => setTermsAccepted(!termsAccepted)}
                disabled={isLoading}
              >
                {termsAccepted && <Feather name="check" size={16} color="white" />}
              </TouchableOpacity>
              <View style={styles.checkboxTextContainer}>
                <Text style={[styles.checkboxLabel, { color: theme.text, fontFamily: 'Inter-Regular' }]}>
                  Acepto los{' '}
                  <Text 
                    style={[styles.linkText, { color: theme.orange }]}
                    onPress={openWebsite}
                  >
                    Términos y Condiciones
                  </Text>
                  {' '}y la{' '}
                  <Text 
                    style={[styles.linkText, { color: theme.orange }]}
                    onPress={openWebsite}
                  >
                    Política de Privacidad
                  </Text>
                </Text>
              </View>
            </View>

            {/* Register Button */}
            <TouchableOpacity 
              style={[styles.registerButton, { 
                backgroundColor: isLoading ? theme.gray : theme.primary,
                opacity: (isFormValid && !isLoading) ? 1 : 0.4
              }]} 
              onPress={handleRegister}
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={[styles.registerButtonText, { fontFamily: 'Inter-Bold' }]}>Registrarse</Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={[{ flexDirection: 'row', justifyContent: 'center', width: '100%', marginTop: 20, alignItems: 'baseline' }]}>
              <Text style={[{ color: theme.text, fontFamily: 'Inter-Regular', fontSize: 14 }]}>
                ¿Ya tienes una cuenta?
              </Text>
              <TouchableOpacity onPress={() => router.push('/login')} style={{ marginLeft: 4 }} disabled={isLoading}>
                <Text style={{ color: theme.orange, fontFamily: 'Inter-Bold', fontSize: 14 }}>
                  Inicia sesión
                </Text>
              </TouchableOpacity>
            </View>

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
  title: {
    fontSize: 40, // Reduced from login screen
    fontWeight: "bold",
    marginBottom: 1,
    width: '100%',
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 10,
    width: '100%',
  },
  input: {
    width: "100%",
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 1.5,
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
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
    position: 'relative', // Container for absolute positioning
  },
  passwordCriteriaContainer: {
    marginBottom: 10,
  },
  passwordCriterion: {
    marginBottom: 5,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 15,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2, // Align with first line of text
  },
  checkboxLabel: {
    fontSize: 14,
    lineHeight: 20,
    flexWrap: 'wrap',
  },
  checkboxTextContainer: {
    flex: 1,
    flexShrink: 1,
  },
  linkText: {
    textDecorationLine: 'underline',
    fontFamily: 'Inter-Bold',
  },
  registerButton: {
    width: "100%",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
  },
  registerButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
}); 