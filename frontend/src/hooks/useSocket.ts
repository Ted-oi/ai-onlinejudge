import { useEffect } from 'react'
import { getSocket } from '../services/socket'

export function useSocket(event: string, handler: (...args: any[]) => void) {
  useEffect(() => {
    const socket = getSocket()
    socket.on(event, handler)
    return () => {
      socket.off(event, handler)
    }
  }, [event])
}

export function useSocketJoin(contestId: number | null) {
  useEffect(() => {
    if (!contestId) return
    const socket = getSocket()
    socket.emit('join:contest', contestId)
    return () => {
      socket.emit('leave:contest', contestId)
    }
  }, [contestId])
}
