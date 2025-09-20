import type {
  RegisterUser,
  LoginUser,
  CreateSweet,
  UpdateSweet,
  Purchase,
  Restock,
  SearchSweets,
  AuthResponse,
  SweetResponse,
  SweetsListResponse,
  PurchaseResponse,
  ErrorResponse,
} from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(
  /\/+$/,
  ''
);

class ApiClient {
  private baseURL: string;

  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;

    this.token = localStorage.getItem('auth_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',

        ...(this.token && { Authorization: `Bearer ${this.token}` }),

        ...options.headers,
      },

      ...options,
    };

    try {
      const response = await fetch(url, config);

      const data = await response.json();

      if (!response.ok) {
        const error = data as ErrorResponse;

        throw new Error(error.message || 'API request failed');
      }

      return data as T;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }

      throw new Error('Network error occurred');
    }
  }

  // Auth methods

  async register(userData: RegisterUser): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',

      body: JSON.stringify(userData),
    });

    this.setToken(response.token);

    return response;
  }

  async login(credentials: LoginUser): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',

      body: JSON.stringify(credentials),
    });

    this.setToken(response.token);

    return response;
  }

  logout(): void {
    this.token = null;

    localStorage.removeItem('auth_token');
  }

  private setToken(token: string): void {
    this.token = token;

    localStorage.setItem('auth_token', token);
  }

  // Sweets methods

  async getSweets(): Promise<SweetsListResponse> {
    return this.request<SweetsListResponse>('/sweets');
  }

  async searchSweets(params: SearchSweets): Promise<SweetsListResponse> {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });

    return this.request<SweetsListResponse>(`/sweets/search?${searchParams}`);
  }

  async createSweet(sweetData: CreateSweet): Promise<SweetResponse> {
    return this.request<SweetResponse>('/sweets', {
      method: 'POST',

      body: JSON.stringify(sweetData),
    });
  }

  async updateSweet(id: string, sweetData: UpdateSweet): Promise<SweetResponse> {
    return this.request<SweetResponse>(`/sweets/${id}`, {
      method: 'PUT',

      body: JSON.stringify(sweetData),
    });
  }

  async deleteSweet(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/sweets/${id}`, {
      method: 'DELETE',
    });
  }

  async purchaseSweet(id: string, purchaseData: Purchase): Promise<PurchaseResponse> {
    return this.request<PurchaseResponse>(`/sweets/${id}/purchase`, {
      method: 'POST',

      body: JSON.stringify(purchaseData),
    });
  }

  async restockSweet(id: string, restockData: Restock): Promise<SweetResponse> {
    return this.request<SweetResponse>(`/sweets/${id}/restock`, {
      method: 'POST',

      body: JSON.stringify(restockData),
    });
  }

  // Utility methods

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }
}

// Export singleton instance

export const api = new ApiClient(API_BASE_URL);

export default api;

export { ApiClient };
