import { getIO } from '../config/socket'
import { logger } from '../utils/logger'

export function emitToUser(userId: number, event: string, data: any) {
  try {
    const io = getIO()
    if (!io) return
    io.to(`user:${userId}`).emit(event, data)
  } catch (error) {
    logger.error('WebSocket emitToUser error', error)
  }
}

export function emitToContest(contestId: number, event: string, data: any) {
  try {
    const io = getIO()
    if (!io) return
    io.to(`contest:${contestId}`).emit(event, data)
  } catch (error) {
    logger.error('WebSocket emitToContest error', error)
  }
}
