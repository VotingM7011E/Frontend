import { io, Socket } from 'socket.io-client';
import KeycloakService from './KeycloakService';

class SocketService {
  private socket: Socket | null = null;
  private readonly SOCKET_URL = import.meta.env.DEV 
    ? 'http://localhost:80' 
    : 'https://voting-dev.ltu-m7011e-2.se';

  /**
   * Initialize and connect to the Socket.IO server
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
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to Socket.IO server');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from Socket.IO server:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  /**
   * Join a meeting room to receive updates for that specific meeting
   */
  joinMeeting(meetingId: string): void {
    if (!this.socket?.connected) {
      this.connect();
    }

    this.socket?.emit('join', { meeting_id: meetingId });
    console.log(`📍 Joined meeting room: ${meetingId}`);
  }

  /**
   * Leave a meeting room
   */
  leaveMeeting(meetingId: string): void {
    this.socket?.emit('leave', { meeting_id: meetingId });
    console.log(`🚪 Left meeting room: ${meetingId}`);
  }

  /**
   * Listen for meeting updates
   */
  onMeetingUpdated(callback: (data: any) => void): void {
    this.socket?.on('meeting_updated', callback);
  }

  /**
   * Listen for next agenda item events
   */
  onNextAgendaItem(callback: (data: any) => void): void {
    this.socket?.on('Next Agenda Item', callback);
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
      console.log('🔌 Disconnected from Socket.IO server');
    }
  }

  /**
   * Get the current socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

export default new SocketService();
