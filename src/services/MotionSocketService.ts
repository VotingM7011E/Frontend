import { io, Socket } from 'socket.io-client';
import KeycloakService from './KeycloakService';

class MotionSocketService {
  private socket: Socket | null = null;
  private readonly SOCKET_URL = import.meta.env.DEV 
    ? 'http://localhost:80/motion-service' 
    : 'https://voting-dev.ltu-m7011e-2.se/api/motion-service';

  /**
   * Initialize and connect to the Motion Service Socket.IO server
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
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to Motion Service Socket.IO server');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from Motion Service Socket.IO server:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Motion Service socket connection error:', error);
    });

    return this.socket;
  }

  /**
   * Join a motion item room to receive updates for that specific motion item
   */
  joinMotionItem(motionItemId: string): void {
    if (!this.socket?.connected) {
      this.connect();
    }

    this.socket?.emit('join_motion_item', { motion_item_id: motionItemId });
    console.log(`📍 Joined motion item room: ${motionItemId}`);
  }

  /**
   * Leave a motion item room
   */
  leaveMotionItem(motionItemId: string): void {
    this.socket?.emit('leave_motion_item', { motion_item_id: motionItemId });
    console.log(`🚪 Left motion item room: ${motionItemId}`);
  }

  /**
   * Listen for new motion added events
   */
  onMotionAdded(callback: (data: any) => void): void {
    this.socket?.on('motion_added', callback);
  }

  /**
   * Listen for motion updated events
   */
  onMotionUpdated(callback: (data: any) => void): void {
    this.socket?.on('motion_updated', callback);
  }

  /**
   * Listen for motion deleted events (if needed)
   */
  onMotionDeleted(callback: (data: any) => void): void {
    this.socket?.on('motion_deleted', callback);
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
      console.log('🔌 Disconnected from Motion Service Socket.IO server');
    }
  }

  /**
   * Get the current socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

export default new MotionSocketService();
