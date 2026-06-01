import { Request, Response, NextFunction } from 'express'
import { detectPlagiarism } from '../services/plagiarism.service'

export const checkPlagiarism = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { problemId } = req.params
    const { min_similarity = 0.5 } = req.query

    const similarity = Math.max(0, Math.min(1, parseFloat(min_similarity as string) || 0.5))

    const results = await detectPlagiarism(parseInt(problemId), similarity)

    res.json({
      success: true,
      data: {
        problem_id: parseInt(problemId),
        total_pairs: results.length,
        min_similarity: similarity,
        results
      }
    })
  } catch (error) {
    next(error)
  }
}
