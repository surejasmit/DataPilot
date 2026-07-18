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
  id: string;
  user_id: string;
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

export type { Project, User, AuthResponse };