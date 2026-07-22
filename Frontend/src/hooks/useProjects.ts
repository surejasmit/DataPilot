import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Project, DatasetProfile, DatasetColumn, DatasetPreview, DatasetStatistics, ChartRecommendation } from '@/lib/api'

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

export function useProjectDetail(projectId: string | undefined) {
  const [project, setProject] = useState<Project | null>(null)
  const [profile, setProfile] = useState<DatasetProfile | null>(null)
  const [statistics, setStatistics] = useState<DatasetStatistics | null>(null)
  const [columns, setColumns] = useState<DatasetColumn[]>([])
  const [preview, setPreview] = useState<DatasetPreview | null>(null)
  const [chartRecommendations, setChartRecommendations] = useState<ChartRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjectDetail = async () => {
    if (!projectId) return
    
    try {
      setLoading(true)
      setError(null)
      
      // Fetch project details
      const projectData = await api.projects.getById(projectId)
      setProject(projectData)

      // If project has a dataset, fetch analysis data
      if (projectData.dataset_name) {
        // Use project ID as dataset ID (assuming they're linked)
        const datasetId = projectData.id.toString()
        
        const [profileData, statsData, columnsData, previewData, chartsData] = await Promise.allSettled([
          api.datasets.getProfile(datasetId),
          api.datasets.getStatistics(datasetId),
          api.datasets.getColumns(datasetId),
          api.datasets.getPreview(datasetId),
          api.datasets.getChartRecommendations(datasetId),
        ])

        if (profileData.status === 'fulfilled') setProfile(profileData.value)
        if (statsData.status === 'fulfilled') setStatistics(statsData.value)
        if (columnsData.status === 'fulfilled') setColumns(columnsData.value)
        if (previewData.status === 'fulfilled') setPreview(previewData.value)
        if (chartsData.status === 'fulfilled') setChartRecommendations(chartsData.value)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjectDetail()
  }, [projectId])

  return { project, profile, statistics, columns, preview, chartRecommendations, loading, error, refetch: fetchProjectDetail }
}