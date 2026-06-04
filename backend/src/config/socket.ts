import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import jwt from 'jsonwebtoken'
import { logger } from '../utils/logger'

let io: SocketIOServer | null = null

export function initSocketIO(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  })

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token
      if (!token) {
        return next(new Error('Authentication required'))
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: number; role: string }
      socket.data.userId = decoded.userId
      socket.data.role = decoded.role
      next()
    } catch {
      next(new Error('Authentication failed'))
    }
  })

  io.on('connection', (socket) => {
    const userId = socket.data.userId
    logger.info(`Socket connected: user ${userId}, socket ${socket.id}`)

    socket.join(`user:${userId}`)

    socket.on('join:contest', (contestId: number) => {
      socket.join(`contest:${contestId}`)
      logger.info(`User ${userId} joined contest ${contestId}`)
    })

    socket.on('leave:contest', (contestId: number) => {
      socket.leave(`contest:${contestId}`)
      logger.info(`User ${userId} left contest ${contestId}`)
    })

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: user ${userId}, socket ${socket.id}`)
    })
  })

  logger.info('Socket.IO server initialized')
}

export function getIO(): SocketIOServer | null {
  return io
}
