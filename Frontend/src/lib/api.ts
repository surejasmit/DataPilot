const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

interface Project {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  dataset_name: string | null;
  dataset_path: string | null;
  dataset_size: number | null;
  dataset_rows: number | null;
  dataset_columns: number | null;
  status: string;
  favorite: boolean;
  created_at: string;
  updated_at: string;
  owner_name?: string;
  owner_email?: string;
}

interface DatasetProfile {
  id: number;
  dataset_id: number;
  total_rows: number;
  total_columns: number;
  missing_values_total: number;
  missing_percentage: number;
  duplicate_rows: number;
  duplicate_percentage: number;
  empty_columns: number;
  numeric_columns: number;
  categorical_columns: number;
  datetime_columns: number;
  boolean_columns: number;
  memory_usage_bytes: number;
  dataset_size_bytes: number;
  dataset_shape: string;
  file_encoding: string;
  processing_time_ms: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface DatasetColumn {
  id: number;
  dataset_id: number;
  column_name: string;
  data_type: string;
  position: number;
  missing_count: number;
  missing_percentage: number;
  unique_count: number;
  min_value: string | null;
  max_value: string | null;
  mean_value: number | null;
  median_value: number | null;
  mode_value: string | null;
  std_dev: number | null;
  q1: number | null;
  q3: number | null;
  is_numeric: boolean;
  is_categorical: boolean;
  is_datetime: boolean;
  is_boolean: boolean;
  created_at: string;
  updated_at: string;
}

interface DatasetPreview {
  rows: Record<string, unknown>[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ColumnStatistics {
  columnName: string;
  min: number | null;
  max: number | null;
  mean: number | null;
  median: number | null;
  mode: string | null;
  stdDev: number | null;
  q1: number | null;
  q3: number | null;
  missingCount: number;
  missingPercentage: number;
  uniqueCount: number;
}

interface DatasetStatistics {
  numericColumns: ColumnStatistics[];
}

interface ChartRecommendation {
  type: string;
  title: string;
  columns: string[];
  reason: string;
}

interface ApiError {
  error: string;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'An error occurred');
  }

  return data;
}

export const api = {
  auth: {
    async register(name: string, email: string, password: string): Promise<AuthResponse> {
      return request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
    },

    async login(email: string, password: string): Promise<AuthResponse> {
      return request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    },

    async getMe(): Promise<User> {
      return request<User>('/users/me');
    },
  },

  projects: {
    async getAll(): Promise<Project[]> {
      return request<Project[]>('/projects');
    },

    async getById(id: string): Promise<Project> {
      return request<Project>(`/projects/${id}`);
    },

    async create(data: Partial<Project>): Promise<Project> {
      return request<Project>('/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async update(id: string, data: Partial<Project>): Promise<Project> {
      return request<Project>(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    async delete(id: string): Promise<{ success: boolean; message: string }> {
      return request<{ success: boolean; message: string }>(`/projects/${id}`, {
        method: 'DELETE',
      });
    },

    async toggleFavorite(id: string): Promise<Project> {
      return request<Project>(`/projects/${id}/favorite`, {
        method: 'POST',
      });
    },
  },

  datasets: {
    async upload(file: File, projectId: number): Promise<{ success: boolean; dataset: any; message: string }> {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId.toString());
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/datasets/upload`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload dataset');
      }
      
      return data;
    },

    async getById(id: string): Promise<Project> {
      return request<Project>(`/datasets/${id}`);
    },

    async getProfile(id: string): Promise<DatasetProfile> {
      return request<DatasetProfile>(`/datasets/${id}/profile`);
    },

    async getColumns(id: string): Promise<DatasetColumn[]> {
      return request<DatasetColumn[]>(`/datasets/${id}/columns`);
    },

    async getPreview(id: string, page = 1, limit = 20, search = '', sortColumn = '', sortOrder = 'asc'): Promise<DatasetPreview> {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(sortColumn && { sortColumn }),
        ...(sortOrder && { sortOrder }),
      });
      return request<DatasetPreview>(`/datasets/${id}/preview?${params.toString()}`);
    },

    async getStatistics(id: string): Promise<DatasetStatistics> {
      return request<DatasetStatistics>(`/datasets/${id}/statistics`);
    },

    async getChartRecommendations(id: string): Promise<ChartRecommendation[]> {
      return request<ChartRecommendation[]>(`/datasets/${id}/charts`);
    },

    async getQualityReport(id: string): Promise<any> {
      return request<any>(`/datasets/${id}/quality`);
    },

    async generateQualityReport(id: string): Promise<any> {
      return request<any>(`/datasets/${id}/quality`, { method: 'POST' });
    },

    async getCleaningHistory(id: string): Promise<any[]> {
      return request<any[]>(`/datasets/${id}/cleaning`);
    },

    async confirmCleaning(id: string, operationId: number): Promise<any> {
      return request<any>(`/datasets/${id}/cleaning/confirm`, {
        method: 'POST',
        body: JSON.stringify({ operationId }),
      });
    },

    async getInsights(id: string): Promise<any[]> {
      return request<any[]>(`/datasets/${id}/insights`);
    },

    async generateInsights(id: string): Promise<any[]> {
      return request<any[]>(`/datasets/${id}/insights`, { method: 'POST' });
    },
  },

  analysis: {
    async get(projectId: string): Promise<AnalysisData> {
      return request<AnalysisData>(`/analysis/${projectId}`);
    },
    async getAllInsights(): Promise<any[]> {
      return request<any[]>('/analysis/insights/all');
    },
  },
};

export function setAuthToken(token: string) {
  localStorage.setItem('token', token);
}

export function clearAuthToken() {
  localStorage.removeItem('token');
}

export function getAuthToken(): string | null {
  return localStorage.getItem('token');
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

interface AnalysisData {
  status?: string
  message?: string
  projectId?: number
  datasetSummary?: {
    datasetName: string | null
    fileType: string
    datasetSize: number
    uploadDate: string
    totalRows: number
    totalColumns: number
    memoryUsage: number
  }
  columnAnalysis?: Array<{
    columnName: string
    dataType: string
    isNumeric: boolean
    isCategorical: boolean
    isDatetime: boolean
    isBoolean: boolean
    missingCount: number
    missingPercentage: number
    uniqueCount: number
    modeValue: string | null
  }>
  dataQuality?: {
    totalRows: number
    missingValues: number
    missingPercentage: number
    duplicateRows: number
    duplicatePercentage: number
    emptyColumns: string[]
    constantColumns: string[]
    highCardinalityColumns: string[]
    numericColumns: string[]
    categoricalColumns: string[]
    dateColumns: string[]
  } | null
  statistics?: Array<{
    columnName: string
    mean: number | null
    median: number | null
    mode: string | null
    stdDev: number | null
    min: number | null
    max: number | null
    q1: number | null
    q3: number | null
    missingCount: number
    uniqueCount: number
  }>
  distribution?: {
    uniqueValues: Array<{ column: string; count: number }>
    topCategories: Array<{ column: string; topValue: string | null }>
  }
  chartRecommendations?: Array<{
    type: string
    title: string
    columns: string | string[]
    reason: string
  }>
  aiInsights?: Array<{
    id: number
    type: string
    title: string
    description: string
    details: Record<string, string>
    severity: string
    confidence: number
  }>
  issues?: Array<{
    type: string
    column: string | null
    severity: string
    message: string
    count?: number
    suggestedAction?: string
  }>
}

export type { Project, User, AuthResponse, DatasetProfile, DatasetColumn, DatasetPreview, DatasetStatistics, ColumnStatistics, ChartRecommendation, AnalysisData };