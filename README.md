# AI OnlineJudge

面向信息学竞赛的智能在线评测系统，集成 AI 智能助手，支持 C++ 在线编程与评测。

## 功能概览

### 核心功能
- **题库系统** — 440+ 道算法题目，支持难度/标签筛选、题目收藏
- **在线编程** — Monaco 编辑器，C++ 实时编译评测，支持暗黑模式
- **智能评测** — 本地评测器（超时检测、输出比对），可选 QDUOJ 远程评测
- **AI 助手** — 智能提示（3 级）、错误解释、代码分析、题目推荐（智谱 GLM）
- **比赛系统** — 创建/参加比赛、实时排名、竞赛内做题
- **课程管理** — 课程资源、作业系统、课程进度可视化

### 社区与社交
- **讨论区** — 按题目讨论、置顶帖、回复
- **博客/题解** — 文章发布、评论、点赞、收藏、管理员审核
- **代码分享** — 分享提交代码、点赞/收藏/评论
- **排行榜** — 全局排名、Rating 系统

### 学习与组织
- **学习路径** — 路径+阶段+题目结构、进度追踪、智能推荐
- **题单** — 按算法知识点组织题目
- **团队/班级** — 创建团队、邀请码加入、内部排行榜、成员管理
- **客观题** — 单选题、判断题

### 管理后台
- **仪表盘** — 平台统计数据
- **题目管理** — CRUD、测试用例管理、题目导入/导出（JSON）
- **用户管理** — 角色切换（admin/teacher/student）
- **竞赛/课程/题单管理**
- **提交审查** — 代码查重（Winnowing 算法）
- **文章审核** — 题解文章审核
- **团队管理** — 团队列表、成员查看、删除

### 用户体验
- **暗黑模式** — 全局主题切换（Ant Design 5 dark algorithm）
- **通知系统** — 评测结果实时推送
- **用户主页** — 成就徽章、Rating 历史、技能雷达图、提交热力图
- **响应式设计** — 移动端适配
- **骨架屏** — 加载状态优化
- **页面过渡动画** — 路由切换淡入效果
- **面包屑导航** — 子页面路径导航
- **路由懒加载** — 按需加载页面组件

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite + Ant Design 5 + Monaco Editor |
| 后端 | Node.js + Express + TypeScript + PostgreSQL 14 |
| AI | 智谱 GLM（OpenAI 兼容格式） |
| 评测 | 本地评测器（child_process），C++ (MinGW g++ 8.1.0) |
| 部署 | Docker + Nginx 多阶段构建 |

## 快速开始

### 一键启动

```bash
# 克隆项目
git clone https://github.com/Ted-oi/ai-onlinejudge.git
cd ai-onlinejudge

# 安装依赖
cd frontend && npm install && cd ../backend && npm install

# 启动（PostgreSQL + 后端 + 前端）
bash start.sh

# 停止
bash stop.sh
```

### 环境要求

- Node.js 18+
- PostgreSQL 14+
- 智谱 API Key（AI 功能可选）

### 环境配置

编辑 `backend/.env`：

```env
# Database
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=onlinejudge
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=your-secret-key

# AI（可选，不配置则 AI 功能不可用）
GLM_API_KEY=your-glm-api-key
GLM_API_URL=https://open.bigmodel.cn/api/paas/v4/chat/completions
GLM_MODEL=glm-4-flash

# Server
PORT=5000
```

### 访问地址

- 前端: http://localhost:3000
- 后端: http://localhost:5000

### 测试账号

| 账号 | 密码 | 角色 |
|------|------|------|
| admin | admin123 | 管理员 |
| teacher1 | admin123 | 教师 |
| student1 | admin123 | 学生 |

## 项目结构

```
ai-onlinejudge/
├── frontend/src/
│   ├── components/       # 通用组件（布局、通知、面包屑、错误边界等）
│   ├── pages/            # 页面组件
│   │   ├── admin/        # 管理后台页面
│   │   ├── ai/           # AI 助手
│   │   ├── articles/     # 博客/题解
│   │   ├── assignments/  # 作业
│   │   ├── codeShare/    # 代码分享
│   │   ├── contests/     # 比赛
│   │   ├── courses/      # 课程
│   │   ├── discussions/  # 讨论区
│   │   ├── home/         # 首页
│   │   ├── leaderboard/  # 排行榜
│   │   ├── learningPaths/# 学习路径
│   │   ├── problemSets/  # 题单
│   │   ├── problems/     # 题目
│   │   ├── submissions/  # 提交
│   │   ├── teams/        # 团队/班级
│   │   └── user/         # 用户主页/设置
│   ├── services/         # API 服务层
│   ├── hooks/            # 自定义 Hooks
│   ├── styles/           # 全局样式
│   └── types/            # TypeScript 类型
├── backend/src/
│   ├── controllers/      # 控制器
│   ├── services/         # 业务逻辑
│   ├── routes/           # 路由定义
│   ├── middleware/       # 中间件（认证、权限）
│   ├── config/           # 数据库配置、种子数据
│   ├── models/           # 数据模型
│   └── utils/            # 工具函数
├── docker/               # Docker 生产部署配置
├── scripts/              # 辅助脚本
├── start.sh / stop.sh    # 一键启停脚本
└── docs/                 # 项目文档
```

## 数据库表

users, problems, test_cases, submissions, contests, contest_registrations, contest_submissions,
courses, course_materials, assignments, user_progress, user_skills, user_achievements,
ai_conversations, ai_messages, articles, article_comments, code_shares,
teams, team_members, learning_paths, problem_sets, notifications, discussions

## API 文档

详见 [docs/API.md](docs/API.md)

## 部署指南

详见 [docs/SETUP.md](docs/SETUP.md)

## 许可证

MIT License
