import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface Project {
  id: string;
  name: string;
  color: string;
}

interface AnimatedProjectButtonProps {
  project: Project;
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
}

export default function AnimatedProjectButton({ project, selectedProject, setSelectedProject }: AnimatedProjectButtonProps) {
  const isSelected = selectedProject?.id === project.id;
  const borderRadius = useSharedValue(isSelected ? 8 : 24);
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  useEffect(() => {
    borderRadius.value = withTiming(isSelected ? 8 : 24, { duration: 300 });
  }, [isSelected]);

  const animatedStyle = useAnimatedStyle(() => ({
    borderRadius: borderRadius.value,
  }));

  return (
    <Animated.View style={[styles.projectGridButton, animatedStyle, { backgroundColor: project.color, borderWidth: isSelected ? 2 : 0, borderColor: theme.primary }]}>
      <TouchableOpacity
        style={[styles.projectInnerButton]}
        onPress={() => setSelectedProject(project)}
      >
        <Text style={styles.projectButtonText}>{project.name.charAt(0)}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  projectGridButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
  },
  projectInnerButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectButtonText: {
    color: '#1a1a1a',
    fontSize: 20,
    fontWeight: 'bold',
  },
}); 