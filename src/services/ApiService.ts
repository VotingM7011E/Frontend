/**
 * API Service
 * Centralized API communication layer with Keycloak authentication
 */

import KeycloakService from './KeycloakService';

// Use proxy for local development to avoid CORS
// In production, this will be the actual service URL
const API_BASE_URL = '/api';

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

// --- Voting types ---
export interface Poll {
  meeting_id: string;
  pollType: 'single' | 'ranked';
  options: string[];
}

export interface SubmitVoteRequest {
  vote: string[];
}

export interface SubmitVoteResponse {
  message: string;
}

export interface HasVotedResponse {
  has_voted: boolean;
}

export interface VoteCountResponse {
  eligible_voters: number;
  votes: Record<string, number>;
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
      this.request('/meeting-service/meetings', {
        method: 'POST',
        body: JSON.stringify({ meeting_name }),
        requiresAuth: true,
      }),

    // GET /meetings/{id} - Get meeting info
    getDetails: (meetingId: string) =>
      this.request(`/meeting-service/meetings/${meetingId}/`, {
        method: 'GET',
        requiresAuth: true,
      }),

    // PATCH /meetings/{id} - Update meeting (e.g., current agenda item)
    update: (meetingId: string, updates: { current_item?: number }) =>
      this.request(`/meeting-service/meetings/${meetingId}/`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
        requiresAuth: true,
      }),

    // GET /code/{code} - Get meeting uuid from code (returns plain text UUID)
    getIdByCode: async (code: string) => {
      const meetingId = await this.requestText(`/meeting-service/code/${code}`, {
        method: 'GET',
        requiresAuth: true,
      });
      // Backend returns plain text UUID, wrap it in an object
      return { meeting_id: meetingId };
    },
  };

  /**
   * Permissions Endpoints - Permission Service
   * Note: permission-service sits under `/permission-service` on the API proxy
   */
  permissions = {
    // GET /permission-service/meetings/{meeting_id}/users/{username}/roles/
    getUserRoles: (meetingId: string, username: string) =>
      this.request(`/permission-service/meetings/${meetingId}/users/${encodeURIComponent(username)}/roles/`, {
        method: 'GET',
        requiresAuth: true,
      }),

    // POST /permission-service/meetings/{meeting_id}/users/{username}/roles/
    addUserRole: (meetingId: string, username: string, body: any) =>
      this.request(`/permission-service/meetings/${meetingId}/users/${encodeURIComponent(username)}/roles/`, {
        method: 'POST',
        body: JSON.stringify(body),
        requiresAuth: true,
      }),

    // PUT /permission-service/meetings/{meeting_id}/users/{username}/roles/
    replaceUserRoles: (meetingId: string, username: string, roles: any[]) =>
      this.request(`/permission-service/meetings/${meetingId}/users/${encodeURIComponent(username)}/roles/`, {
        method: 'PUT',
        body: JSON.stringify(roles),
        requiresAuth: true,
      }),

    // DELETE /permission-service/meetings/{meeting_id}/users/{username}/roles/{role}
    removeUserRole: (meetingId: string, username: string, role: string) =>
      this.request(`/permission-service/meetings/${meetingId}/users/${encodeURIComponent(username)}/roles/${encodeURIComponent(role)}`, {
        method: 'DELETE',
        requiresAuth: true,
      }),

    // GET /permission-service/meetings/{meeting_id}/roles/{role}/users
    getUsersByRole: (meetingId: string, role: string) =>
      this.request(`/permission-service/meetings/${meetingId}/roles/${encodeURIComponent(role)}/users`, {
        method: 'GET',
        requiresAuth: true,
      }),
  };

  /**
   * Agenda Endpoints
   */
  agenda = {
    // POST /meetings/{id}/agenda - Add agenda item
    addItem: (meetingId: string, item: any) =>
      this.request(`/meeting-service/meetings/${meetingId}/agenda`, {
        method: 'POST',
        body: JSON.stringify({ item }),
        requiresAuth: true,
      }),

    // GET /meetings/{id}/agenda - Get all agenda items
    getAll: (meetingId: string) =>
      this.request(`/meeting-service/meetings/${meetingId}/agenda`, {
        method: 'GET',
        requiresAuth: true,
      }),

    // POST /meetings/{meeting_id}/agenda/{agenda_id}/start_vote - Start voting on motions
    startVoting: (meetingId: string, agendaId: string) =>
      this.request(`/meeting-service/meetings/${meetingId}/agenda/${agendaId}/start_vote`, {
        method: 'POST',
        requiresAuth: true,
      }),
  };

  /**
   * Motion Endpoints - Motion Service
   */
  motions = {
    // GET /items/{motion_item_id}/ - Get motion item info
    getMotionItem: (motionItemId: string) =>
      this.request(`/motion-service/items/${motionItemId}/`, {
        method: 'GET',
        requiresAuth: true,
      }),

    // GET /items/{motion_item_id}/motions - Get all motions for a motion item
    getMotions: (motionItemId: string) =>
      this.request(`/motion-service/items/${motionItemId}/motions`, {
        method: 'GET',
        requiresAuth: true,
      }),

    // POST /items/{motion_item_id}/motions - Add a motion
    createMotion: (motionItemId: string, motion: string) =>
      this.request(`/motion-service/items/${motionItemId}/motions`, {
        method: 'POST',
        body: JSON.stringify({ motion }),
        requiresAuth: true,
      }),

    // PATCH /items/{motion_item_id}/motions/{motion_id} - Update a motion
    updateMotion: (motionItemId: string, motionId: string, motion: string) =>
      this.request(`/motion-service/items/${motionItemId}/motions/${motionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ motion }),
        requiresAuth: true,
      }),

    
  };

  /**
   * Voting Endpoints - Voting Service
   */
  voting = {
    // GET /polls/{poll_id} - Get poll details
    getPoll: (pollId: string): Promise<Poll> =>
      this.request<Poll>(`/voting-service/polls/${pollId}/`, {
        method: 'GET',
        requiresAuth: true,
      }),

    // POST /polls/{poll_id}/vote - Submit a vote
    submitVote: (pollId: string, vote: SubmitVoteRequest): Promise<SubmitVoteResponse> =>
      this.request<SubmitVoteResponse>(`/voting-service/polls/${pollId}/vote`, {
        method: 'POST',
        body: JSON.stringify(vote),
        requiresAuth: true,
      }),

    // GET /polls/{poll_id}/votes - Get poll vote counts (eligible_voters + votes)
    getResults: (pollId: string): Promise<VoteCountResponse> =>
      this.request<VoteCountResponse>(`/voting-service/polls/${pollId}/votes`, {
        method: 'GET',
        requiresAuth: true,
      }),

    // GET /polls/{poll_id}/vote - Check whether the authenticated user has voted
    hasVoted: (pollId: string): Promise<HasVotedResponse> =>
      this.request<HasVotedResponse>(`/voting-service/polls/${pollId}/vote`, {
        method: 'GET',
        requiresAuth: true,
      }),
  };
}

export default new ApiService();
