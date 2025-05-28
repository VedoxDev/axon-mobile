import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface PasswordStrengthBoxProps {
  criteria: {
    length: boolean;
    uppercase: boolean;
    number: boolean;
    symbol: boolean;
  };
  theme: {
    card: string;
    gray: string;
    green: string;
    red: string;
    text: string;
  };
}

const PasswordStrengthBox: React.FC<PasswordStrengthBoxProps> = ({ criteria, theme }) => {
  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.gray }]}>
      <View style={styles.criterion}>
        <View style={[styles.iconDot, { backgroundColor: criteria.length ? theme.green : theme.red }]}>
          <Feather name={criteria.length ? 'check' : 'x'} size={12} color="white" />
        </View>
        <Text style={{ color: criteria.length ? theme.green : theme.text }}>Entre 8 y 64 caracteres</Text>
      </View>
      <View style={styles.criterion}>
        <View style={[styles.iconDot, { backgroundColor: criteria.uppercase ? theme.green : theme.red }]}>
          <Feather name={criteria.uppercase ? 'check' : 'x'} size={12} color="white" />
        </View>
        <Text style={{ color: criteria.uppercase ? theme.green : theme.text }}>Al menos una letra mayúscula (A–Z)</Text>
      </View>
      <View style={styles.criterion}>
        <View style={[styles.iconDot, { backgroundColor: criteria.number ? theme.green : theme.red }]}>
          <Feather name={criteria.number ? 'check' : 'x'} size={12} color="white" />
        </View>
        <Text style={{ color: criteria.number ? theme.green : theme.text }}>Al menos un número (0–9)</Text>
      </View>
      <View style={styles.criterion}>
        <View style={[styles.iconDot, { backgroundColor: criteria.symbol ? theme.green : theme.red }]}>
          <Feather name={criteria.symbol ? 'check' : 'x'} size={12} color="white" />
        </View>
        <Text style={{ color: criteria.symbol ? theme.green : theme.text }}>Al menos un símbolo (@ $ ! % * ? & .)</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60, // Adjust this value to position it below the input
    borderRadius: 5,
    borderWidth: 1,
    padding: 10,
    zIndex: 1, // Ensure it floats above other elements
  },
  criterion: {
    marginBottom: 5,
    fontSize: 14,
    flexDirection: 'row', // Align dot and text horizontally
    alignItems: 'center', // Center dot and text vertically
  },
  iconDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8, // Space between dot and text
  },
});

export default PasswordStrengthBox;
