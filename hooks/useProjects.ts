import { useState, useEffect } from 'react';
import { ProjectService, ProjectResponse, Project, generateProjectColor } from '../services/projectService';
import { useAuth } from '../app/auth/AuthProvider';

interface UseProjectsReturn {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  refreshProjects: () => Promise<void>;
}

export const useProjects = (): UseProjectsReturn => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Start as false, only load when authenticated
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    if (!user) {
      // If no user is authenticated, reset state and return
      setProjects([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const projectsData = await ProjectService.getMyProjects();
      
      // Transform API response to include generated colors for UI
      const projectsWithColors: Project[] = projectsData.map((project: ProjectResponse) => ({
        ...project,
        color: generateProjectColor(project.id),
      }));
      
      setProjects(projectsWithColors);
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      setError(err.message || 'Failed to fetch projects');
      setProjects([]); // Clear projects on error
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch projects when user authentication status changes
  useEffect(() => {
    fetchProjects();
  }, [user]);

  const refetch = async () => {
    await fetchProjects();
  };

  const refreshProjects = async () => {
    await fetchProjects();
  };

  return {
    projects,
    isLoading,
    error,
    refetch,
    refreshProjects,
  };
}; 