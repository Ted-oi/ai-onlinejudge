import { logger } from '../utils/logger'

// 简单的内存数据存储
class MemoryDatabase {
  private users: any[] = []
  private problems: any[] = []
  private submissions: any[] = []
  private contests: any[] = []
  private courses: any[] = []
  private lessons: any[] = []
  private course_materials: any[] = []
  private user_progress: any[] = []
  private userIdCounter = 1
  private problemIdCounter = 1
  private submissionIdCounter = 1
  private contestIdCounter = 1
  private courseIdCounter = 1
  private lessonIdCounter = 1
  private materialIdCounter = 1
  private progressIdCounter = 1

  constructor() {
    this.initializeSampleData()
  }

  private initializeSampleData() {
    const bcrypt = require('bcryptjs')
    const hashedPassword = bcrypt.hashSync('admin123', 10)

    this.users = [
      {
        id: this.userIdCounter++,
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        avatar: null,
        bio: '系统管理员',
        rating: 1500,
        solved_count: 0,
        submit_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: this.userIdCounter++,
        username: 'student1',
        email: 'student1@example.com',
        password: hashedPassword,
        role: 'student',
        avatar: null,
        bio: '学生用户',
        rating: 1200,
        solved_count: 0,
        submit_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]

    this.courses = [
      {
        id: this.courseIdCounter++,
        title: 'C++基础入门',
        description: '从零开始学习C++编程语言，掌握基础语法和编程思维',
        category: '语法基础',
        instructor_id: 1,
        lessons_count: 3,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: this.courseIdCounter++,
        title: '算法基础精讲',
        description: '学习常用算法和数据结构，提升编程能力',
        category: '算法基础',
        instructor_id: 1,
        lessons_count: 2,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]

    this.lessons = [
      {
        id: this.lessonIdCounter++,
        course_id: 1,
        title: '第1课：C++程序结构',
        description: '了解C++程序的基本结构，学习主函数和头文件',
        knowledge_point: '程序结构与编译',
        order_index: 1,
        duration: 45,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: this.lessonIdCounter++,
        course_id: 1,
        title: '第2课：变量与数据类型',
        description: '学习C++中的基本数据类型和变量声明',
        knowledge_point: '变量与数据类型',
        order_index: 2,
        duration: 50,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: this.lessonIdCounter++,
        course_id: 1,
        title: '第3课：输入输出',
        description: '掌握C++中的标准输入输出方法',
        knowledge_point: '输入输出',
        order_index: 3,
        duration: 40,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: this.lessonIdCounter++,
        course_id: 2,
        title: '第1课：算法复杂度分析',
        description: '学习时间复杂度和空间复杂度的分析方法',
        knowledge_point: '算法复杂度',
        order_index: 1,
        duration: 60,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: this.lessonIdCounter++,
        course_id: 2,
        title: '第2课：排序算法',
        description: '学习冒泡排序、选择排序、插入排序等基础排序算法',
        knowledge_point: '排序算法',
        order_index: 2,
        duration: 70,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]

    this.course_materials = [
      {
        id: this.materialIdCounter++,
        course_id: 1,
        lesson_id: 1,
        title: 'C++程序结构课件',
        type: 'ppt',
        content: 'C++程序的基本结构...',
        file_url: '/uploads/courses/cpp_lesson1.pptx',
        file_name: 'cpp_lesson1.pptx',
        file_size: 2048576,
        mime_type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        order_index: 1,
        created_at: new Date()
      },
      {
        id: this.materialIdCounter++,
        course_id: 1,
        lesson_id: 1,
        title: 'C++程序结构视频',
        type: 'video',
        content: 'C++程序结构教学视频...',
        file_url: '/uploads/courses/cpp_lesson1.mp4',
        file_name: 'cpp_lesson1.mp4',
        file_size: 104857600,
        mime_type: 'video/mp4',
        order_index: 2,
        created_at: new Date()
      },
      {
        id: this.materialIdCounter++,
        course_id: 1,
        lesson_id: 2,
        title: '变量与数据类型课件',
        type: 'ppt',
        content: 'C++变量与数据类型详解...',
        file_url: '/uploads/courses/cpp_lesson2.pptx',
        file_name: 'cpp_lesson2.pptx',
        file_size: 2097152,
        mime_type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        order_index: 1,
        created_at: new Date()
      },
      {
        id: this.materialIdCounter++,
        course_id: 2,
        lesson_id: 1,
        title: '算法复杂度分析课件',
        type: 'ppt',
        content: '时间复杂度和空间复杂度详解...',
        file_url: '/uploads/courses/algorithm_lesson1.pptx',
        file_name: 'algorithm_lesson1.pptx',
        file_size: 3145728,
        mime_type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        order_index: 1,
        created_at: new Date()
      },
      {
        id: this.materialIdCounter++,
        course_id: 2,
        lesson_id: 2,
        title: '排序算法演示视频',
        type: 'video',
        content: '各种排序算法的可视化演示...',
        file_url: '/uploads/courses/sorting_demo.mp4',
        file_name: 'sorting_demo.mp4',
        file_size: 125829120,
        mime_type: 'video/mp4',
        order_index: 1,
        created_at: new Date()
      }
    ]

    this.user_progress = [
      {
        id: this.progressIdCounter++,
        user_id: 2,
        lesson_id: 1,
        completed: true,
        last_position: 45,
        completed_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: this.progressIdCounter++,
        user_id: 2,
        lesson_id: 2,
        completed: false,
        last_position: 20,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]

    // 验证并修复examples字段
    const validateExamples = (examples: any[]) => {
      if (!Array.isArray(examples)) return []
      return examples.filter((example: any) => {
        return example && typeof example.input === 'string' && typeof example.output === 'string'
      })
    }

    // 从种子数据加载题目
    try {
      const seedPath = require('path').join(__dirname, '..', 'data', 'problems-seed.json')
      const seedData = require('fs').readFileSync(seedPath, 'utf8')
      const seedProblems = JSON.parse(seedData)
      this.problems = seedProblems.map((p: any) => ({
        ...p,
        id: this.problemIdCounter++,
        created_at: new Date(),
        updated_at: new Date(),
        examples: validateExamples(p.examples)
      }))
      logger.info(`Loaded ${this.problems.length} problems from seed data`)
    } catch (error) {
      logger.warn('Failed to load seed data, using default problems')
    }

    /* 原始示例题目（已替换为种子数据）
    this.problems_backup = [
      {
        id: this.problemIdCounter++,
        title: 'A+B问题',
        description: '给定两个整数A和B，计算A+B的值。\n\n**输入格式**\n第一行包含两个整数A和B，用空格分隔。\n\n**输出格式**\n输出A+B的值。',
        difficulty: 'easy',
        category: '基础',
        categories: ['io', 'variables'],  // 输入输出、变量与数据类型
        time_limit: 1000,
        memory_limit: 256,
        examples: [{ input: '1 2', output: '3' }],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: this.problemIdCounter++,
        title: '斐波那契数列',
        description: '计算斐波那契数列的第n项。斐波那契数列定义为：\n- F(0) = 0\n- F(1) = 1\n- F(n) = F(n-1) + F(n-2) (n ≥ 2)\n\n**输入格式**\n一个整数n (0 ≤ n ≤ 30)\n\n**输出格式**\n输出斐波那契数列的第n项。',
        difficulty: 'medium',
        category: '动态规划',
        categories: ['dp', 'functions'],  // 动态规划、函数与递归
        time_limit: 1000,
        memory_limit: 256,
        examples: [{ input: '5', output: '5' }],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: this.problemIdCounter++,
        title: '最大公约数',
        description: '求两个正整数a和b的最大公约数。\n\n**输入格式**\n两个正整数a和b，用空格分隔。\n\n**输出格式**\n输出a和b的最大公约数。',
        difficulty: 'easy',
        category: '数学',
        categories: ['math', 'loops'],  // 数学算法、循环语句
        time_limit: 1000,
        memory_limit: 256,
        examples: [{ input: '12 18', output: '6' }],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: this.problemIdCounter++,
        title: '判断质数',
        description: '判断一个正整数n是否为质数。\n\n**输入格式**\n一个正整数n (1 ≤ n ≤ 10^9)\n\n**输出格式**\n如果是质数输出"YES"，否则输出"NO"。',
        difficulty: 'easy',
        category: '数学',
        categories: ['math', 'control'],  // 数学算法、控制语句
        time_limit: 1000,
        memory_limit: 256,
        examples: [{ input: '7', output: 'YES' }, { input: '8', output: 'NO' }],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: this.problemIdCounter++,
        title: '快速排序',
        description: '实现快速排序算法，对给定的数组进行排序。\n\n**输入格式**\n第一行包含一个整数n，表示数组长度\n第二行包含n个整数\n\n**输出格式**\n输出排序后的数组',
        difficulty: 'medium',
        category: '算法',
        categories: ['sorting', 'arrays'],  // 排序与二分、数组操作
        time_limit: 1000,
        memory_limit: 256,
        examples: [{ input: '5\\n3 1 4 2 5', output: '1 2 3 4 5' }],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: this.problemIdCounter++,
        title: '字符串反转',
        description: '将给定的字符串反转输出。\n\n**输入格式**\n一个字符串（长度不超过100）\n\n**输出格式**\n输出反转后的字符串',
        difficulty: 'easy',
        category: '基础',
        categories: ['strings', 'arrays'],  // 字符串处理、数组操作
        time_limit: 1000,
        memory_limit: 256,
        examples: [{ input: 'hello', output: 'olleh' }],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: this.problemIdCounter++,
        title: '背包问题',
        description: '经典的0-1背包问题。给定n个物品，每个物品有重量和价值，背包容量为W，求能装入的最大价值。\n\n**输入格式**\n第一行包含两个整数n和W\n接下来n行，每行包含两个整数wi和vi\n\n**输出格式**\n输出最大价值',
        difficulty: 'hard',
        category: '动态规划',
        categories: ['dp', 'simulation'],  // 动态规划、模拟与枚举
        time_limit: 1000,
        memory_limit: 256,
        examples: [{ input: '3 5\\n2 3\\n3 4\\n4 5', output: '7' }],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: this.problemIdCounter++,
        title: '深度优先搜索',
        description: '使用DFS算法遍历图，输出节点的访问顺序。\n\n**输入格式**\n第一行包含两个整数n和m，表示节点数和边数\n接下来m行描述图的边\n\n**输出格式**\n输出DFS遍历的节点顺序',
        difficulty: 'medium',
        category: '图论',
        categories: ['search', 'graph'],  // 搜索算法、图论基础
        time_limit: 1000,
        memory_limit: 256,
        examples: [{ input: '4 4\\n1 2\\n1 3\\n2 4\\n3 4', output: '1 2 4 3' }],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: this.problemIdCounter++,
        title: '栈的应用',
        description: '使用栈实现括号匹配检查。\n\n**输入格式**\n一个包含括号的字符串\n\n**输出格式**\n如果括号匹配输出"YES"，否则输出"NO"',
        difficulty: 'easy',
        category: '数据结构',
        categories: ['data_structures', 'strings'],  // 数据结构基础、字符串处理
        time_limit: 1000,
        memory_limit: 256,
        examples: [
          { input: 'abc', output: 'YES' },
          { input: 'xyz', output: 'NO' }
        ],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: this.problemIdCounter++,
        title: '贪心算法-活动选择',
        description: '给定n个活动，每个活动有开始和结束时间，求最多能参加的活动数量。\n\n**输入格式**\n第一行包含一个整数n\n接下来n行，每行包含两个整数si和ei\n\n**输出格式**\n输出最多能参加的活动数量',
        difficulty: 'medium',
        category: '算法',
        categories: ['greedy', 'control'],  // 贪心算法、控制语句
        time_limit: 1000,
        memory_limit: 256,
        examples: [{ input: '4\\n1 3\\n2 5\\n4 7\\n6 9', output: '3' }],
        created_at: new Date(),
        updated_at: new Date()
      }
    ]
    */

    // 验证并修复所有problems的examples字段
    this.problems = this.problems.map((problem: any) => ({
      ...problem,
      examples: validateExamples(problem.examples)
    }))

    logger.info('内存数据库初始化完成')
  }

  async query(sql: string, params: any[] = []): Promise<any> {
    // 解析SQL语句
    const sqlLower = sql.toLowerCase().trim()
    const start = Date.now()

    try {
      if (sqlLower.startsWith('select')) {
        return this.handleSelect(sql, params)
      } else if (sqlLower.startsWith('insert')) {
        return this.handleInsert(sql, params)
      } else if (sqlLower.startsWith('update')) {
        return this.handleUpdate(sql, params)
      } else if (sqlLower.startsWith('delete')) {
        return this.handleDelete(sql, params)
      } else {
        throw new Error('不支持的SQL语句')
      }
    } finally {
      const duration = Date.now() - start
      logger.debug('Executed query', { sql, duration })
    }
  }

  private handleSelect(sql: string, params: any[]): any {
    let table = ''
    let whereClause = ''
    let orderBy = ''
    let limit = ''
    let offset = ''

    // 简单解析SELECT语句
    const match = sql.match(/from\s+(\w+)/i)
    if (match) {
      table = match[1]
    }

    // 解析WHERE条件
    const whereMatch = sql.match(/where\s+(.+?)(?:\s+order\s+by|\s+limit|\s+offset|$)/i)
    if (whereMatch) {
      whereClause = whereMatch[1]
    }

    // 解析ORDER BY
    const orderMatch = sql.match(/order\s+by\s+(\w+\s+(?:asc|desc)?)/i)
    if (orderMatch) {
      orderBy = orderMatch[1]
    }

    // 解析LIMIT和OFFSET
    const limitMatch = sql.match(/limit\s+(\d+)/i)
    if (limitMatch) {
      limit = limitMatch[1]
    }

    const offsetMatch = sql.match(/offset\s+(\d+)/i)
    if (offsetMatch) {
      offset = offsetMatch[1]
    }

    let data: any[] = []

    // 获取数据
    switch (table) {
      case 'users':
        data = [...this.users]
        break
      case 'problems':
        data = [...this.problems]
        break
      case 'submissions':
        data = [...this.submissions]
        break
      case 'contests':
        data = [...this.contests]
        break
      case 'courses':
        data = [...this.courses]
        break
      default:
        data = []
    }

    // 过滤数据
    if (whereClause) {
      data = this.applyWhereClause(data, whereClause, params)
    }

    // 排序
    if (orderBy) {
      const [field, direction] = orderBy.split(/\s+/)
      data.sort((a, b) => {
        const aVal = a[field]
        const bVal = b[field]
        if (direction === 'desc') {
          return aVal > bVal ? -1 : 1
        }
        return aVal > bVal ? 1 : -1
      })
    }

    // 分页
    const limitNum = limit ? parseInt(limit) : undefined
    const offsetNum = offset ? parseInt(offset) : 0

    if (offsetNum > 0 || limitNum !== undefined) {
      const start = offsetNum
      const end = limitNum !== undefined ? start + limitNum : undefined
      data = data.slice(start, end)
    }

    return {
      rows: data,
      rowCount: data.length
    }
  }

  private handleInsert(sql: string, params: any[]): any {
    const match = sql.match(/insert\s+into\s+(\w+)\s*\((.+?)\)\s*values\s*\((.+?)\)/i)
    if (!match) {
      throw new Error('无法解析INSERT语句')
    }

    const table = match[1]
    const columns = match[2].split(',').map((col: string) => col.trim())
    const valuesPlaceholders = match[3].split(',').map((_: string, index: number) => `$${index + 1}`)

    const record: any = {}
    columns.forEach((col: string, index: number) => {
      const placeholderIndex = valuesPlaceholders.indexOf(`$${index + 1}`)
      record[col] = params[placeholderIndex]
    })

    // 添加ID和时间戳
    let idCounter = 1
    switch (table) {
      case 'users':
        idCounter = this.userIdCounter++
        break
      case 'problems':
        idCounter = this.problemIdCounter++
        break
      case 'submissions':
        idCounter = this.submissionIdCounter++
        break
      case 'contests':
        idCounter = this.contestIdCounter++
        break
      case 'courses':
        idCounter = this.courseIdCounter++
        break
    }

    record.id = idCounter
    if (!record.created_at) record.created_at = new Date()
    if (!record.updated_at) record.updated_at = new Date()

    // 添加到对应的数组
    switch (table) {
      case 'users':
        this.users.push(record)
        break
      case 'problems':
        this.problems.push(record)
        break
      case 'submissions':
        this.submissions.push(record)
        break
      case 'contests':
        this.contests.push(record)
        break
      case 'courses':
        this.courses.push(record)
        break
    }

    return {
      rows: [record],
      rowCount: 1
    }
  }

  private handleUpdate(sql: string, params: any[]): any {
    const match = sql.match(/update\s+(\w+)\s+set\s+(.+?)\s+where\s+(.+)/i)
    if (!match) {
      throw new Error('无法解析UPDATE语句')
    }

    const table = match[1]
    const setClause = match[2]
    const whereClause = match[3]

    let data: any[] = []

    switch (table) {
      case 'users':
        data = this.users
        break
      case 'problems':
        data = this.problems
        break
      case 'submissions':
        data = this.submissions
        break
      case 'contests':
        data = this.contests
        break
      case 'courses':
        data = this.courses
        break
      case 'lessons':
        data = this.lessons
        break
      case 'course_materials':
        data = this.course_materials
        break
      case 'user_progress':
        data = this.user_progress
        break
      default:
        return { rows: [], rowCount: 0 }
    }

    // 解析SET子句
    const setParts = setClause.split(',')
    const updates: any = {}

    setParts.forEach((part, index) => {
      const [field, placeholder] = part.split('=').map((s: string) => s.trim())
      const placeholderIndex = parseInt(placeholder.replace('$', '')) - 1
      updates[field] = params[placeholderIndex]
    })

    // 添加更新时间
    updates.updated_at = new Date()

    // 解析WHERE子句并更新记录
    let paramStartIndex = setParts.length
    const updatedRecords: any[] = []

    for (let i = 0; i < data.length; i++) {
      const record = data[i]
      if (this.matchWhereClause(record, whereClause, params.slice(paramStartIndex))) {
        Object.assign(record, updates)
        updatedRecords.push(record)
      }
    }

    return {
      rows: updatedRecords,
      rowCount: updatedRecords.length
    }
  }

  private handleDelete(sql: string, params: any[]): any {
    const match = sql.match(/delete\s+from\s+(\w+)\s+where\s+(.+)/i)
    if (!match) {
      throw new Error('无法解析DELETE语句')
    }

    const table = match[1]
    const whereClause = match[2]

    let data: any[] = []
    const deletedRecords: any[] = []

    switch (table) {
      case 'users':
        data = this.users
        break
      case 'problems':
        data = this.problems
        break
      case 'submissions':
        data = this.submissions
        break
      case 'contests':
        data = this.contests
        break
      case 'courses':
        data = this.courses
        break
      case 'lessons':
        data = this.lessons
        break
      case 'course_materials':
        data = this.course_materials
        break
      case 'user_progress':
        data = this.user_progress
        break
      default:
        return { rows: [], rowCount: 0 }
    }

    // 查找并删除匹配的记录
    for (let i = data.length - 1; i >= 0; i--) {
      if (this.matchWhereClause(data[i], whereClause, params)) {
        deletedRecords.push(data[i])
        data.splice(i, 1)
      }
    }

    return {
      rows: deletedRecords,
      rowCount: deletedRecords.length
    }
  }

  private applyWhereClause(data: any[], whereClause: string, params: any[]): any[] {
    return data.filter(record => this.matchWhereClause(record, whereClause, params))
  }

  private matchWhereClause(record: any, whereClause: string, params: any[]): boolean {
    // 简单的WHERE子句匹配
    // 处理简单的条件：column = $n, column LIKE $n, column ILIKE $n, $n = ANY(column)
    const conditions = whereClause.split(/\s+and\s+/i)

    return conditions.every(condition => {
      // 处理ANY数组操作
      const anyMatch = condition.match(/\$(\d+)\s*=\s*ANY\s*\((\w+)\)/i)
      if (anyMatch) {
        const paramIndex = parseInt(anyMatch[1]) - 1
        const field = anyMatch[2]
        const paramValue = params[paramIndex]
        const recordValue = record[field]

        if (Array.isArray(recordValue)) {
          return recordValue.includes(paramValue)
        }
        return false
      }

      // 处理常规比较
      const match = condition.match(/(\w+)\s*(=|like|ilike)\s*\$(\d+)/i)
      if (!match) return true

      const field = match[1]
      const operator = match[2].toLowerCase()
      const paramIndex = parseInt(match[3]) - 1

      const recordValue = record[field]
      const paramValue = params[paramIndex]

      if (operator === '=') {
        // 处理数字和字符串的比较
        return String(recordValue) === String(paramValue)
      } else if (operator === 'like' || operator === 'ilike') {
        const pattern = paramValue.replace(/%/g, '.*').replace(/_/g, '.')
        return new RegExp(pattern, operator === 'ilike' ? 'i' : '').test(String(recordValue))
      }

      return true
    })
  }

  async getClient() {
    return this
  }
}

const db = new MemoryDatabase()

export const query = async (text: string, params?: any[]) => {
  return db.query(text, params || [])
}

export const getClient = () => db.getClient()

export default db