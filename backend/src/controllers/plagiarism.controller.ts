import { detectPlagiarism } from '../services/plagiarism.service'
import { asyncHandler } from '../utils/asyncHandler'
import { sendSuccess } from '../utils/apiResponse'

export const checkPlagiarism = asyncHandler(async (req, res) => {
  const { problemId } = req.params
  const { min_similarity = 0.5 } = req.query

  const similarity = Math.max(0, Math.min(1, parseFloat(min_similarity as string) || 0.5))

  const results = await detectPlagiarism(parseInt(problemId), similarity)

  return sendSuccess(res, {
    problem_id: parseInt(problemId),
    total_pairs: results.length,
    min_similarity: similarity,
    results
  })
})
