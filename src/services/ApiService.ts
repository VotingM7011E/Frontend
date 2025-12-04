/**
 * API Service
 * Centralized API communication layer with Keycloak authentication
 */

import KeycloakService from './KeycloakService';

// Use proxy for local development to avoid CORS
// In production, this will be the actual service URL
const API_BASE_URL = import.meta.env.DEV 
  ? '/api'  // Use Vite proxy in development (proxies to localhost:80)
  : 'https://meeting-service.ltu-m7011e-2.se';  // Direct URL in production (uses staging cert)

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get authorization token from Keycloak
   */
  private async getAuthToken(): Promise<string | null> {
    // Ensure token is fresh before each request
    await KeycloakService.updateToken(5);
    return KeycloakService.getToken() || null;
  }

  /**
   * Prepare headers with optional authorization
   */
  private async getHeaders(requiresAuth: boolean = false): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (requiresAuth) {
      const token = await this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Generic fetch wrapper with error handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { requiresAuth = false, ...fetchOptions } = options;
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const headers = await this.getHeaders(requiresAuth);
      
      console.log('API Request:', options.method || 'GET', url);
      if (options.body) {
        console.log('Request body:', options.body);
      }
      
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', response.status, errorText);
        let errorMessage = `HTTP Error: ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.detail || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const responseText = await response.text();
      console.log('API Response text:', responseText);
      
      try {
        return JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', responseText);
        throw new Error(`Invalid JSON response from server: ${responseText.substring(0, 100)}`);
      }
    } catch (error) {
      console.error(`API Request Failed: ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * Request that expects plain text response (not JSON)
   */
  private async requestText(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<string> {
    const { requiresAuth = false, ...fetchOptions } = options;
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const headers = await this.getHeaders(requiresAuth);
      
      console.log('API Request (text):', options.method || 'GET', url);
      
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', response.status, errorText);
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const responseText = await response.text();
      console.log('API Response text:', responseText);
      return responseText;
    } catch (error) {
      console.error(`API Request Failed: ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * Meeting Endpoints - Based on MeetingService API
   */
  meetings = {
    // POST /meetings - Create a new meeting
    create: (meeting_name: string) =>
      this.request('/meetings', {
        method: 'POST',
        body: JSON.stringify({ meeting_name }),
        requiresAuth: true,
      }),

    // GET /meetings/{id} - Get meeting info
    getDetails: (meetingId: string) =>
      this.request(`/meetings/${meetingId}/`, {
        method: 'GET',
        requiresAuth: true,
      }),

    // PATCH /meetings/{id} - Update meeting (e.g., current agenda item)
    update: (meetingId: string, updates: { current_item?: number }) =>
      this.request(`/meetings/${meetingId}/`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
        requiresAuth: true,
      }),

    // GET /code/{code} - Get meeting uuid from code (returns plain text UUID)
    getIdByCode: async (code: string) => {
      const meetingId = await this.requestText(`/code/${code}`, {
        method: 'GET',
        requiresAuth: true,
      });
      // Backend returns plain text UUID, wrap it in an object
      return { meeting_id: meetingId };
    },
  };

  /**
   * Agenda Endpoints
   */
  agenda = {
    // POST /meetings/{id}/agenda - Add agenda item
    addItem: (meetingId: string, item: any) =>
      this.request(`/meetings/${meetingId}/agenda`, {
        method: 'POST',
        body: JSON.stringify({ item }),
        requiresAuth: true,
      }),

    // GET /meetings/{id}/agenda - Get all agenda items
    getAll: (meetingId: string) =>
      this.request(`/meetings/${meetingId}/agenda`, {
        method: 'GET',
        requiresAuth: true,
      }),
  };
}

export default new ApiService();
