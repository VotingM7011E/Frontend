import { io, Socket } from 'socket.io-client';
import KeycloakService from './KeycloakService';

class ElectionSocketService {
  private socket: Socket | null = null;
  private readonly SOCKET_URL = import.meta.env.DEV 
    ? 'http://localhost:80' 
    : 'https://voting-dev.ltu-m7011e-2.se';

  /**
   * Initialize and connect to the Election Service Socket.IO server
   */
  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    const token = KeycloakService.getToken();

    this.socket = io(this.SOCKET_URL, {
      auth: {
        token: token
      },
      path: '/api/election-service/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to Election Service Socket.IO server');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from Election Service Socket.IO server:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Election Service socket connection error:', error);
    });

    return this.socket;
  }

  /**
   * Join an election room to receive updates for that specific meeting's elections
   */
  joinElection(meetingId: string): void {
    if (!this.socket?.connected) {
      this.connect();
    }

    this.socket?.emit('join_election', { meeting_id: meetingId });
    console.log(`📍 Joined election room: ${meetingId}`);
  }

  /**
   * Leave an election room
   */
  leaveElection(meetingId: string): void {
    this.socket?.emit('leave_election', { meeting_id: meetingId });
    console.log(`🚪 Left election room: ${meetingId}`);
  }

  /**
   * Listen for new position created events
   */
  onPositionCreated(callback: (data: any) => void): void {
    this.socket?.on('position_created', callback);
  }

  /**
   * Listen for nomination added events
   */
  onNominationAdded(callback: (data: any) => void): void {
    this.socket?.on('nomination_added', callback);
  }

  /**
   * Listen for nomination accepted events
   */
  onNominationAccepted(callback: (data: any) => void): void {
    this.socket?.on('nomination_accepted', callback);
  }

  /**
   * Listen for position closed events (nominations closed, voting started)
   */
  onPositionClosed(callback: (data: any) => void): void {
    this.socket?.on('position_closed', callback);
  }

  /**
   * Remove all listeners for a specific event
   */
  off(event: string): void {
    this.socket?.off(event);
  }

  /**
   * Disconnect from the server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('🔌 Disconnected from Election Service Socket.IO server');
    }
  }

  /**
   * Get the current socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

export default new ElectionSocketService();
