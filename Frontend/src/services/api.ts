import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User,
  Product,
  Location,
  Document,
  StockLedgerEntry,
  DashboardMetrics,
  ProductStockSummary,
} from '../types';

// Default backend endpoint (FastAPI)
const DEFAULT_API_BASE_URL = 'http://10.0.2.2:8000/api/v1'; // 10.0.2.2 for Android emulator, localhost for iOS
const TOKEN_KEY = 'stocksense_jwt_token';
const API_URL_KEY = 'stocksense_api_url';

export const ApiClient = {
  async getBaseUrl(): Promise<string> {
    const saved = await AsyncStorage.getItem(API_URL_KEY);
    return saved || DEFAULT_API_BASE_URL;
  },

  async setBaseUrl(url: string): Promise<void> {
    await AsyncStorage.setItem(API_URL_KEY, url);
  },

  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_KEY);
  },

  async setToken(token: string): Promise<void> {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  },

  async clearToken(): Promise<void> {
    await AsyncStorage.removeItem(TOKEN_KEY);
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const baseUrl = await this.getBaseUrl();
    const token = await this.getToken();

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
      throw new Error(errorData.detail || `Request failed with status ${response.status}`);
    }

    return response.json();
  },
};
