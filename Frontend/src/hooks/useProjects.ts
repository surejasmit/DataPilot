import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Project } from '@/lib/api'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.projects.getAll()
      setProjects(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  return { projects, loading, error, refetch: fetchProjects }
}

export function useRecentProjects(limit = 4) {
  const { projects, loading, error, refetch } = useProjects()
  
  const recentProjects = projects
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, limit)

  return { recentProjects, loading, error, refetch }
}

export function useProjectStats() {
  const { projects } = useProjects()
  
  const stats = {
    totalProjects: projects.length,
    totalDatasets: projects.filter(p => p.dataset_name).length,
    completedProjects: projects.filter(p => p.status === 'completed').length,
    draftProjects: projects.filter(p => p.status === 'draft').length,
  }
  
  return { stats, projects }
}