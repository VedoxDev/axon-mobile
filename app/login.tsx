import { useColorScheme } from "@/hooks/useColorScheme";
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, Stack } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../constants/Colors';
import { useAuth } from './auth/AuthProvider';
import { CustomAlert } from '@/components/CustomAlert';
import { useCustomAlert } from '@/hooks/useCustomAlert';

const logo = require('@/assets/images/logo.png');

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;
  const { login, user } = useAuth();
  const { alertConfig, showError, hideAlert } = useCustomAlert();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Local loading state for login button

  const insets = useSafeAreaInsets();

  // Email validation function
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  // Check if form is valid
  const isFormValid = isValidEmail(email) && password.length > 0;

  const handleLogin = async () => {
    // Basic validation (although button should be disabled if these conditions aren't met)
    if (!email.trim()) {
      showError('Por favor ingresa tu email', 'Error');
      return;
    }
    if (!password.trim()) {
      showError('Por favor ingresa tu contraseña', 'Error');
      return;
    }
    if (!isValidEmail(email)) {
      showError('Por favor ingresa un email válido', 'Error');
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      // On successful login, the navigation will be handled automatically by the AuthProvider and _layout.tsx
    } catch (error: any) {
      // Clear password field on login error
      setPassword('');
      
      // Handle specific error cases
      if (error.message.includes('Invalid email or password')) {
        showError('Usuario o contraseña incorrectos, intenta de nuevo', 'Error de inicio de sesión');
      } else {
        showError(error.message, 'Error de inicio de sesión');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        {/* Logo Area */}
        <View style={styles.logoContainer}>
          <Image
            source={logo}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={[styles.logoText, { color: theme.orange, fontFamily: 'Inter-Regular' }]}>axon</Text>
        </View>

        <Text style={[styles.title, { color: theme.text, textAlign: 'left', fontFamily: 'Inter-Bold' }]}>Bienvenido</Text>
        <Text style={[styles.subtitle, { color: theme.text, textAlign: 'left', fontFamily: 'Inter-Regular' }]}>Inicia sesión para continuar</Text>

        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.inputBackground, 
            color: theme.text, 
            borderColor: emailFocused ? theme.orange : theme.gray 
          }]}
          placeholder="Email"
          placeholderTextColor={theme.text + "80"}
          value={email}
          onChangeText={setEmail}
          onFocus={() => setEmailFocused(true)}
          onBlur={() => setEmailFocused(false)}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
        />

        <View style={[styles.inputContainer, { borderColor: passwordFocused ? theme.orange : theme.gray, backgroundColor: theme.inputBackground }]}>
          <TextInput
            style={[styles.inputInsideContainer, { color: theme.text }]}
            placeholder="Contraseña"
            placeholderTextColor={theme.text + "80"}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!isPasswordVisible}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
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

        <View style={{ width: '100%', alignItems: 'flex-end' }}>
          <TouchableOpacity onPress={() => router.push('/forgot-password')} disabled={isLoading}>
            <Text style={[styles.forgotPasswordText, { color: theme.orange, textAlign: 'right', fontWeight: 'bold', fontFamily: 'Inter-Bold' }]}>¿Has olvidado tu contraseña?</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.loginButton, { 
            backgroundColor: isLoading ? theme.gray : (isFormValid ? theme.primary : theme.primary),
            opacity: (isFormValid && !isLoading) ? 1 : 0.4
          }]} 
          onPress={handleLogin}
          disabled={isLoading || !isFormValid}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={[styles.loginButtonText, { 
              fontFamily: 'Inter-Bold',
              color: 'white'
            }]}>Iniciar sesión</Text>
          )}
        </TouchableOpacity>



        <View style={[{ flexDirection: 'row', justifyContent: 'center', width: '100%', marginTop: 90, alignItems: 'baseline' }]}>
          <Text style={[{ color: theme.text, fontFamily: 'Inter-Regular', fontSize: 14 }]}>
            ¿No tienes una cuenta?
          </Text>
          <TouchableOpacity onPress={() => router.push('/register')} style={{ marginLeft: 4 }} disabled={isLoading}>
            <Text style={{ color: theme.orange, fontFamily: 'Inter-Bold', fontSize: 14 }}>
              Registrate ahora
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
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    marginTop: 0,
  },
  logoContainer: {
    paddingTop: 10,
    marginBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    marginRight: 10,
  },
  logoText: {
    fontSize: 34,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 40,
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
    marginBottom: 5,
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
  forgotPasswordText: {
    marginTop: 5,
    marginBottom: 15,
    width: "100%",
  },
  loginButton: {
    width: "100%",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

}); 