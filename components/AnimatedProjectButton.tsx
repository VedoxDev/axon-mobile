import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Project } from '@/services/projectService';

interface AnimatedProjectButtonProps {
  project: Project;
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  index: number;
  projectsPerRow: number;
  buttonWidth: number;
  buttonSpacing: number;
}

export default function AnimatedProjectButton({ 
  project, 
  selectedProject, 
  setSelectedProject, 
  index, 
  projectsPerRow, 
  buttonWidth, 
  buttonSpacing 
}: AnimatedProjectButtonProps) {
  const isSelected = selectedProject?.id === project.id;
  const borderRadius = useSharedValue(isSelected ? 8 : 24);
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  
  // Check if this is the last item in the row
  const isLastInRow = (index + 1) % projectsPerRow === 0;

  useEffect(() => {
    borderRadius.value = withTiming(isSelected ? 8 : 24, { duration: 300 });
  }, [isSelected]);

  const animatedStyle = useAnimatedStyle(() => ({
    borderRadius: borderRadius.value,
  }));

  const buttonStyle = {
    width: buttonWidth,
    height: buttonWidth,
    marginRight: isLastInRow ? 0 : buttonSpacing,
    marginBottom: 15,
  };

  return (
    <Animated.View style={[
      styles.projectGridButton, 
      buttonStyle,
      animatedStyle, 
      { 
        backgroundColor: project.color, 
        borderWidth: isSelected ? 2 : 0, 
        borderColor: theme.primary 
      }
    ]}>
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
    alignItems: 'center',
    justifyContent: 'center',
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