import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

export interface AuthSocket extends Socket {
  user?: {
    id: string;
    discordId: string;
    username: string;
    role: string;
  };
}

export const setupSocketIO = (io: SocketIOServer): void => {
  // Authentication middleware
  io.use((socket: AuthSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;
      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthSocket) => {
    console.log(`User connected: ${socket.user?.username} (${socket.id})`);

    // Join user's personal room (for direct user-targeted events)
    if (socket.user?.id) {
      socket.join(`user:${socket.user.id}`);
    }

    // Join server room
    socket.on('join_server', (serverId: string) => {
      socket.join(`server:${serverId}`);
      console.log(`${socket.user?.username} joined server: ${serverId}`);
    });

    // Leave server room
    socket.on('leave_server', (serverId: string) => {
      socket.leave(`server:${serverId}`);
      console.log(`${socket.user?.username} left server: ${serverId}`);
    });

    // Command executed event
    socket.on('command_executed', (data) => {
      // Broadcast to server room
      socket.to(`server:${data.serverId}`).emit('command_executed', data);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user?.username}`);
    });
  });
};

// Helper function to emit events to server rooms
export const emitToServer = (io: SocketIOServer, serverId: string, event: string, data: any): void => {
  io.to(`server:${serverId}`).emit(event, data);
};

// Helper function to emit events to specific user
// Requires sockets to join their user room on connection: socket.join(`user:${socket.user!.id}`)
export const emitToUser = (io: SocketIOServer, userId: string, event: string, data: any): void => {
  io.to(`user:${userId}`).emit(event, data);
};
