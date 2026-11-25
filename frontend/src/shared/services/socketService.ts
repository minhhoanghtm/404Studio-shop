import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '../api/client';
import { getSocketServerUrl } from '../config/env';

export interface StaffStatusPayload {
  isStaffOnline: boolean;
  onlineStaffCount?: number;
  statusText?: string;
}

export interface TypingPayload {
  conversationId: string;
  senderName?: string;
  role?: string;
}

export interface MessageNewPayload {
  message: {
    _id?: string;
    id?: string;
    conversationId: string;
    senderType: 'user' | 'admin' | 'guest' | 'ai' | 'system';
    senderGuestId?: string;
    content: string;
    createdAt?: string;
    guestName?: string;
    metadata?: any;
    clientMessageId?: string;
  };
  conversation?: any;
  staffName?: string;
}

export interface StaffJoinedPayload {
  conversationId: string;
  staffId: string;
  staffName: string;
  message: string;
}

class SocketService {
  private socket: Socket | null = null;
  private currentConversationId: string | null = null;

  private getSocketUrl(): string | undefined {
    return getSocketServerUrl();
  }

  public connect(): Socket {
    if (this.socket) {
      if (!this.socket.active) this.socket.connect();
      return this.socket;
    }

    const url = this.getSocketUrl();

    this.socket = io(url, {
      autoConnect: true,
      transports: ['websocket'],
      auth: (callback) => {
        const token = getAccessToken();
        callback(token ? { token } : {});
      },
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      this.socket?.emit('joinAdmin');
      // Re-join active conversation if reconnected
      if (this.currentConversationId) {
        this.socket?.emit('conversation:join', this.currentConversationId);
      }
    });

    return this.socket;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public joinGuest(conversationId: string, guestId: string): Promise<boolean> {
    return new Promise((resolve) => {
      const s = this.connect();
      this.currentConversationId = conversationId;
      s.emit('guest:join', { conversationId, guestId }, (res: any) => {
        resolve(Boolean(res?.success));
      });
    });
  }

  public joinConversation(conversationId: string): Promise<boolean> {
    return new Promise((resolve) => {
      const s = this.connect();
      this.currentConversationId = conversationId;
      s.emit('conversation:join', conversationId, (res: any) => {
        resolve(Boolean(res?.success));
      });
    });
  }

  public leaveConversation(conversationId: string): void {
    if (this.socket) {
      this.socket.emit('conversation:leave', conversationId);
    }
    if (this.currentConversationId === conversationId) {
      this.currentConversationId = null;
    }
  }

  public sendTypingStart(conversationId: string, senderName?: string, role?: string): void {
    if (this.socket) {
      this.socket.emit('typing:start', { conversationId, senderName, role });
    }
  }

  public sendTypingStop(conversationId: string, senderName?: string, role?: string): void {
    if (this.socket) {
      this.socket.emit('typing:stop', { conversationId, senderName, role });
    }
  }

  public onStaffStatus(handler: (data: StaffStatusPayload) => void): () => void {
    const s = this.connect();
    s.on('staff:status', handler);
    return () => {
      s.off('staff:status', handler);
    };
  }

  public onMessageNew(handler: (data: MessageNewPayload) => void): () => void {
    const s = this.connect();
    s.on('message:new', handler);
    return () => {
      s.off('message:new', handler);
    };
  }

  public onTypingStart(handler: (data: TypingPayload) => void): () => void {
    const s = this.connect();
    s.on('typing:start', handler);
    return () => {
      s.off('typing:start', handler);
    };
  }

  public onTypingStop(handler: (data: TypingPayload) => void): () => void {
    const s = this.connect();
    s.on('typing:stop', handler);
    return () => {
      s.off('typing:stop', handler);
    };
  }

  public onConversationUpdated(handler: (data: any) => void): () => void {
    const s = this.connect();
    s.on('conversation:updated', handler);
    return () => {
      s.off('conversation:updated', handler);
    };
  }

  public onStaffJoined(handler: (data: StaffJoinedPayload) => void): () => void {
    const s = this.connect();
    s.on('staff:joined', handler);
    return () => {
      s.off('staff:joined', handler);
    };
  }

  public joinAdmin(): void {
    const s = this.connect();
    s.emit('joinAdmin');
  }

  public onPresenceUpdated(handler: (data: any) => void): () => void {
    const s = this.connect();
    s.emit('joinAdmin');
    s.on('presence:updated', handler);
    return () => {
      s.off('presence:updated', handler);
    };
  }

  public onPresenceLeave(handler: (data: any) => void): () => void {
    const s = this.connect();
    s.emit('joinAdmin');
    s.on('presence:leave', handler);
    return () => {
      s.off('presence:leave', handler);
    };
  }
}

export const socketService = new SocketService();
