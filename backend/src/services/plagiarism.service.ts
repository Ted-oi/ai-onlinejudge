import { query } from '../config/database'

// Tokenize code into normalized tokens for comparison
function tokenize(code: string): string[] {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')    // Remove block comments
    .replace(/\/\/.*$/gm, '')              // Remove line comments
    .replace(/#include\s*<[^>]+>/g, '')    // Remove includes
    .replace(/using\s+namespace\s+\w+;/g, '')
    .replace(/\s+/g, ' ')                  // Normalize whitespace
    .trim()
    .split(/\s+/)
    .filter(t => t.length > 0)
}

// Generate n-grams from tokens
function getNgrams(tokens: string[], n: number): Set<string> {
  const ngrams = new Set<string>()
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.add(tokens.slice(i, i + n).join(' '))
  }
  return ngrams
}

// Calculate Jaccard similarity between two sets
function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 0
  let intersection = 0
  for (const item of setA) {
    if (setB.has(item)) intersection++
  }
  const union = setA.size + setB.size - intersection
  return union === 0 ? 0 : intersection / union
}

// Calculate Winnowing fingerprint similarity
function winnowingSimilarity(codeA: string, codeB: string): number {
  const NGRAM_SIZE = 5
  const WINDOW_SIZE = 4

  const tokensA = tokenize(codeA)
  const tokensB = tokenize(codeB)

  if (tokensA.length < NGRAM_SIZE || tokensB.length < NGRAM_SIZE) {
    return jaccardSimilarity(new Set(tokensA), new Set(tokensB))
  }

  const ngramsA = getNgrams(tokensA, NGRAM_SIZE)
  const ngramsB = getNgrams(tokensB, NGRAM_SIZE)

  // Winnowing: select minimum hash in each window
  const fingerprintA = winnow(ngramsA, WINDOW_SIZE)
  const fingerprintB = winnow(ngramsB, WINDOW_SIZE)

  return jaccardSimilarity(fingerprintA, fingerprintB)
}

function winnow(ngrams: Set<string>, windowSize: number): Set<string> {
  const ngramArr = Array.from(ngrams).sort()
  const fingerprints = new Set<string>()

  for (let i = 0; i <= ngramArr.length - windowSize; i++) {
    let minHash = ngramArr[i]
    for (let j = 1; j < windowSize; j++) {
      if (ngramArr[i + j] < minHash) {
        minHash = ngramArr[i + j]
      }
    }
    fingerprints.add(minHash)
  }

  return fingerprints.size > 0 ? fingerprints : ngrams
}

export interface PlagiarismResult {
  submission_a: { id: number; user_id: number; username: string; code: string }
  submission_b: { id: number; user_id: number; username: string; code: string }
  similarity: number
  problem_id: number
  problem_title: string
}

export async function detectPlagiarism(
  problemId: number,
  minSimilarity: number = 0.5
): Promise<PlagiarismResult[]> {
  // Get all accepted submissions for the problem
  const result = await query(
    `SELECT s.id, s.user_id, s.code, u.username
     FROM submissions s
     JOIN users u ON s.user_id = u.id
     WHERE s.problem_id = $1 AND s.language = $2
     ORDER BY s.created_at DESC`,
    [problemId, 'cpp']
  )

  if (result.rows.length < 2) return []

  // Pre-compute fingerprints
  const submissions = result.rows.map((row: any) => ({
    ...row,
    tokens: tokenize(row.code)
  }))

  const pairs: PlagiarismResult[] = []

  // Compare all pairs
  for (let i = 0; i < submissions.length; i++) {
    for (let j = i + 1; j < submissions.length; j++) {
      const a = submissions[i]
      const b = submissions[j]

      // Skip same user
      if (a.user_id === b.user_id) continue

      const similarity = winnowingSimilarity(a.code, b.code)

      if (similarity >= minSimilarity) {
        // Get problem title
        const pResult = await query('SELECT title FROM problems WHERE id = $1', [problemId])

        pairs.push({
          submission_a: { id: a.id, user_id: a.user_id, username: a.username, code: a.code },
          submission_b: { id: b.id, user_id: b.user_id, username: b.username, code: b.code },
          similarity: Math.round(similarity * 100) / 100,
          problem_id: problemId,
          problem_title: pResult.rows[0]?.title || ''
        })
      }
    }
  }

  return pairs.sort((a, b) => b.similarity - a.similarity)
}
