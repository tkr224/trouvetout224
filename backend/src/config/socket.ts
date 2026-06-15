import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from './database';

// Map des utilisateurs en ligne : userId -> nombre de sockets connectés
const onlineUsers = new Map<string, number>();

export const isUserOnline = (userId: string) => onlineUsers.has(userId);
export const getOnlineUserIds = () => Array.from(onlineUsers.keys());

export const setupSocketIO = (io: Server) => {
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Token manquant'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      (socket as any).userId = decoded.userId;
      next();
    } catch {
      next(new Error('Token invalide'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    console.log(`Socket connecté: ${userId}`);

    const count = onlineUsers.get(userId) || 0;
    onlineUsers.set(userId, count + 1);

    socket.join(`user:${userId}`);

    if (count === 0) {
      io.emit('user_online', { userId });
    }

    socket.emit('online_users', { userIds: getOnlineUserIds() });

    socket.on('join_conversation', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('typing', ({ conversationId }: { conversationId: string }) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', { userId, conversationId });
    });

    socket.on('stop_typing', ({ conversationId }: { conversationId: string }) => {
      socket.to(`conversation:${conversationId}`).emit('user_stop_typing', { userId, conversationId });
    });

    socket.on('mark_read', async ({ conversationId }: { conversationId: string }) => {
      try {
        await prisma.message.updateMany({
          where: { conversationId, senderId: { not: userId }, isRead: false },
          data: { isRead: true, readAt: new Date() },
        });
        socket.to(`conversation:${conversationId}`).emit('messages_read', { conversationId, readBy: userId });
      } catch (e) {
        console.error('Erreur mark_read:', e);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket déconnecté: ${userId}`);
      const c = onlineUsers.get(userId) || 1;
      if (c <= 1) {
        onlineUsers.delete(userId);
        io.emit('user_offline', { userId });
      } else {
        onlineUsers.set(userId, c - 1);
      }
    });
  });
};