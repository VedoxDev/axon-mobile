import { useColorScheme } from "@/hooks/useColorScheme";
import { Feather } from '@expo/vector-icons';
import { Stack, router } from "expo-router";
import { useState } from "react";
import { Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View, Platform, KeyboardAvoidingView } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import PasswordStrengthBox from './PasswordStrengthBox';

export default function RegisterScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;

  const [nombreFocused, setNombreFocused] = useState(false);
  const [apellidosFocused, setApellidosFocused] = useState(false);
  const [correoFocused, setCorreoFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    number: false,
    symbol: false,
  });

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

  const insets = useSafeAreaInsets();

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingContainer}
      >
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <Stack.Screen options={{ headerShown: false }} />
          {/* Title and Subtitle */}
          <Text style={[styles.title, { color: theme.text, textAlign: 'left', fontFamily: 'Inter-Bold' }]}>Registrate</Text>
          <Text style={[styles.subtitle, { color: theme.text, textAlign: 'left', fontFamily: 'Inter-Regular' }]}>Crea tu cuenta para continuar</Text>

          {/* Input Fields */}
          <TextInput
            style={[styles.input, { backgroundColor: colorScheme === 'dark' ? theme.inputBackground : theme.card, color: theme.text, borderColor: nombreFocused ? theme.orange : theme.gray }]}
            placeholder="Nombre"
            placeholderTextColor={theme.text + "80"}
            onFocus={() => setNombreFocused(true)}
            onBlur={() => setNombreFocused(false)}
          />

          <TextInput
            style={[styles.input, { backgroundColor: colorScheme === 'dark' ? theme.inputBackground : theme.card, color: theme.text, borderColor: apellidosFocused ? theme.orange : theme.gray }]}
            placeholder="Apellidos"
            placeholderTextColor={theme.text + "80"}
            onFocus={() => setApellidosFocused(true)}
            onBlur={() => setApellidosFocused(false)}
          />

          <View style={[styles.inputContainer, { borderColor: correoFocused ? theme.orange : theme.gray, backgroundColor: colorScheme === 'dark' ? theme.inputBackground : theme.card }]}>
            <TextInput
              style={[styles.inputInsideContainer, { color: theme.text }]}
              placeholder="Correo"
              placeholderTextColor={theme.text + "80"}
              onFocus={() => setCorreoFocused(true)}
              onBlur={() => setCorreoFocused(false)}
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
                secureTextEntry={!isPasswordVisible}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                onChangeText={validatePassword}
              />
              <TouchableOpacity
                style={styles.passwordVisibilityToggle}
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
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
              secureTextEntry={!isConfirmPasswordVisible}
              onFocus={() => setConfirmPasswordFocused(true)}
              onBlur={() => setConfirmPasswordFocused(false)}
            />
            <TouchableOpacity
              style={styles.passwordVisibilityToggle}
              onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
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
            <TouchableOpacity style={[styles.checkbox, { borderColor: termsAccepted ? theme.orange : theme.gray, backgroundColor: termsAccepted ? theme.orange : 'transparent' }]} onPress={() => setTermsAccepted(!termsAccepted)}>
              {termsAccepted && <Feather name="check" size={16} color="white" />}
            </TouchableOpacity>
            <Text style={[styles.checkboxLabel, { color: theme.text, fontFamily: 'Inter-Regular' }]}>Acepto los Términos y Condiciones y la Política de Privacidad</Text>
          </View>

          {/* Register Button */}
          <TouchableOpacity style={[styles.registerButton, { backgroundColor: theme.primary }]} onPress={() => {}}>
            <Text style={[styles.registerButtonText, { fontFamily: 'Inter-Bold' }]}>Registrarse</Text>
          </TouchableOpacity>

          {/* Login Link */}
          <View style={[{ flexDirection: 'row', justifyContent: 'center', width: '100%', marginTop: 20, alignItems: 'baseline' }]}>
            <Text style={[{ color: theme.text, fontFamily: 'Inter-Regular', fontSize: 14 }]}>
              ¿Ya tienes una cuenta?
            </Text>
            <TouchableOpacity onPress={() => router.replace('/login')} style={{ marginLeft: 4 }}>
              <Text style={{ color: theme.orange, fontFamily: 'Inter-Bold', fontSize: 14 }}>
                Inicia sesión
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    marginTop: 0, // Adjusted for register screen
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
    alignItems: 'center',
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
  },
  checkboxLabel: {
    fontSize: 14,
    flex: 1, // Allow text to wrap if needed
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