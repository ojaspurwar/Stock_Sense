import {
  User,
  Product,
  Location,
  Document,
  StockLedgerEntry,
  DashboardMetrics,
  ProductStockSummary,
} from '../types';

// Web backend endpoint proxied via Vite to http://localhost:3001
const DEFAULT_API_BASE_URL = '/api';
const TOKEN_KEY = 'stocksense_jwt_token';
const API_URL_KEY = 'stocksense_api_url';

export const ApiClient = {
  getBaseUrl(): string {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(API_URL_KEY) || DEFAULT_API_BASE_URL;
    }
    return DEFAULT_API_BASE_URL;
  },

  setBaseUrl(url: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(API_URL_KEY, url);
    }
  },

  getToken(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(TOKEN_KEY);
    }
    return null;
  },

  setToken(token: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(TOKEN_KEY, token);
    }
  },

  clearToken(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(TOKEN_KEY);
    }
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const baseUrl = this.getBaseUrl();
    const token = this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.detail || `Request failed with status ${response.status}`);
    }

    return response.json();
  },

  // API Methods
  async getProducts(params?: { category?: string; searchSku?: string }): Promise<any[]> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'all') query.set('category', params.category);
    if (params?.searchSku) query.set('searchSku', params.searchSku);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<any[]>(`/products${qs}`);
  },

  async createProduct(data: { name: string; sku: string; category: string; unitOfMeasure: string }): Promise<any> {
    return this.request<any>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getKPIs(): Promise<any> {
    return this.request<any>('/kpis');
  },

  async getLocations(): Promise<Location[]> {
    return this.request<Location[]>('/locations');
  },

  async getDocuments(params?: { type?: string; status?: string; locationId?: string }): Promise<any[]> {
    const query = new URLSearchParams();
    if (params?.type && params.type !== 'all') query.set('type', params.type);
    if (params?.status && params.status !== 'all') query.set('status', params.status);
    if (params?.locationId && params.locationId !== 'all') query.set('locationId', params.locationId);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<any[]>(`/documents${qs}`);
  },

  async validateDocument(id: string): Promise<any> {
    return this.request<any>(`/documents/${id}/validate`, {
      method: 'POST',
    });
  },
};
