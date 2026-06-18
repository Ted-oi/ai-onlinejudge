import api from './api'

export type ReportCategory = 'description' | 'testdata' | 'solution' | 'spj' | 'other'
export type ReportSeverity = 'low' | 'normal' | 'high' | 'critical'
export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'rejected'

export interface ProblemReport {
  id: number
  problem_id: number
  problem_title?: string
  user_id?: number
  category: ReportCategory
  severity: ReportSeverity
  title: string
  content: string
  status: ReportStatus
  admin_comment?: string
  reviewer_id?: number
  reviewed_at?: string
  created_at: string
  updated_at: string
  reporter_name?: string
  reporter_avatar?: string
}

export interface CreateReportPayload {
  problem_id: number
  category: ReportCategory
  severity?: ReportSeverity
  title: string
  content: string
}

const problemReportService = {
  create: (data: CreateReportPayload) =>
    api.post('/problem-reports', data).then(res => res.data),

  getMy: (params?: { status?: ReportStatus; page?: number; limit?: number }): Promise<{ reports: ProblemReport[]; total: number }> =>
    api.get('/problem-reports/my', { params }).then(res => res.data.data),

  getById: (id: number): Promise<ProblemReport> =>
    api.get(`/problem-reports/${id}`).then(res => res.data.data),

  list: (params?: {
    status?: ReportStatus; category?: ReportCategory; problem_id?: number
    page?: number; limit?: number
  }): Promise<{ reports: ProblemReport[]; total: number }> =>
    api.get('/problem-reports', { params }).then(res => res.data.data),

  review: (id: number, data: { status: 'reviewing' | 'resolved' | 'rejected'; admin_comment?: string }) =>
    api.put(`/problem-reports/${id}/review`, data).then(res => res.data),
}

export default problemReportService
