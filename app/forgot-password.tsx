import { useColorScheme } from "@/hooks/useColorScheme";
import { Image } from 'expo-image';
import { router, Stack } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { CustomAlert } from '@/components/CustomAlert';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { API_BASE_URL } from '@/config/apiConfig';

const logo = require('@/assets/images/logo.png');

export default function ForgotPasswordScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();

  // Form state
  const [email, setEmail] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const insets = useSafeAreaInsets();

  // Email validation function
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  // Check if form is valid
  const isFormValid = isValidEmail(email);

  const handlePasswordReset = async () => {
    // Basic validation
    if (!email.trim()) {
      showAlert({
        title: 'Error',
        message: 'Por favor ingresa tu email',
        type: 'error',
        buttons: [{ text: 'Entendido', style: 'default' }]
      });
      return;
    }
    
    if (!isValidEmail(email)) {
      showAlert({
        title: 'Error',
        message: 'Por favor ingresa un email válido',
        type: 'error',
        buttons: [{ text: 'Entendido', style: 'default' }]
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/request-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await response.json();

      if (response.ok) {
        showAlert({
          title: 'Enlace enviado',
          message: 'Te hemos enviado un enlace para restablecer tu contraseña. Revisa tu correo electrónico.',
          type: 'success',
          buttons: [
            { 
              text: 'Entendido', 
              style: 'default',
              onPress: () => {
                hideAlert();
                // Clear the email field after successful submission
                setEmail('');
              }
            }
          ]
        });
      } else {
        // Even if there's an error, we show success message for security
        // This prevents email enumeration attacks
        showAlert({
          title: 'Enlace enviado',
          message: 'Si existe una cuenta con ese email, te hemos enviado un enlace para restablecer tu contraseña.',
          type: 'success',
          buttons: [
            { 
              text: 'Entendido', 
              style: 'default',
              onPress: () => {
                hideAlert();
                setEmail('');
              }
            }
          ]
        });
      }
    } catch (error: any) {
      console.error('Password reset request error:', error);
      showAlert({
        title: 'Error',
        message: 'Error de conexión. Por favor verifica tu conexión a internet e inténtalo de nuevo.',
        type: 'error',
        buttons: [{ text: 'Entendido', style: 'default' }]
      });
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

        <Text style={[styles.title, { color: theme.text, textAlign: 'left', fontFamily: 'Inter-Bold' }]}>
          ¿Olvidaste tu contraseña?
        </Text>
        <Text style={[styles.subtitle, { color: theme.text, textAlign: 'left', fontFamily: 'Inter-Regular' }]}>
          Ingresa tu email y te enviaremos un enlace para restablecerla
        </Text>

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

        <TouchableOpacity 
          style={[styles.resetButton, { 
            backgroundColor: isLoading ? theme.gray : (isFormValid ? theme.primary : theme.primary),
            opacity: (isFormValid && !isLoading) ? 1 : 0.4
          }]} 
          onPress={handlePasswordReset}
          disabled={isLoading || !isFormValid}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={[styles.resetButtonText, { 
              fontFamily: 'Inter-Bold',
              color: 'white'
            }]}>Enviar enlace</Text>
          )}
        </TouchableOpacity>

        <View style={[{ flexDirection: 'row', justifyContent: 'center', width: '100%', marginTop: 30, alignItems: 'baseline' }]}>
          <TouchableOpacity onPress={() => router.back()} disabled={isLoading}>
            <Text style={{ color: theme.orange, fontFamily: 'Inter-Bold', fontSize: 14 }}>
              ← Volver al inicio de sesión
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
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
    width: '100%',
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 30,
    width: '100%',
    lineHeight: 22,
  },
  input: {
    width: "100%",
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
    borderWidth: 1.5,
    fontSize: 16,
  },
  resetButton: {
    width: "100%",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
  },
  resetButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
}); 