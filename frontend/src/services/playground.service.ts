import api from './api'

const playgroundService = {
  executeCode(data: { code: string; language: string; input?: string; timeLimit?: number }) {
    return api.post('/playground/execute', data)
  },
}

export default playgroundService
