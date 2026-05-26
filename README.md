# AI OnlineJudge

一个面向信息学竞赛的智能在线评测系统，集成AI智能体功能，支持学生学习和题目解答。

## 功能特性

- 🎯 **题目系统**: 完整的题目管理和评测功能
- 🤖 **AI智能体**: 集成Claude API，提供智能解答和知识点讲解
- 📚 **课程学习**: 支持PPT、视频等课程资源
- 🏆 **排行榜**: 实时用户排名和统计
- ⚡ **实时评测**: 集成QDUOJ评测系统
- 🔒 **用户系统**: 完整的用户认证和权限管理

## 技术栈

### 前端
- React 18 + TypeScript
- Vite
- Ant Design
- React Router
- Axios
- Monaco Editor

### 后端
- Node.js + Express
- TypeScript
- PostgreSQL
- Redis
- JWT
- Winston

### 评测系统
- QDUOJ
- 支持多种编程语言
- 完整的评测API

### AI集成
- Anthropic Claude API
- 智能代码分析
- 题目解答指导

## 快速开始

### 前置要求

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Docker & Docker Compose
- Claude API Key

### 安装依赖

```bash
# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
npm install
```

### 环境配置

1. 复制环境变量模板：
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

2. 配置环境变量（参见各.env.example文件）

### 启动开发环境

```bash
# 启动数据库和Redis
cd docker
docker-compose up -d postgres redis

# 初始化数据库
docker exec -i onlinejudge-postgres psql -U postgres -d onlinejudge < init-db.sql

# 启动后端
cd ../backend
npm run dev

# 启动前端（新终端）
cd ../frontend
npm run dev
```

### 访问应用

- 前端: http://localhost:3000
- 后端: http://localhost:5000
- API文档: docs/API.md

## 项目结构

```
ai-onlinejudge/
├── frontend/              # 前端应用
│   ├── src/
│   │   ├── components/    # React组件
│   │   ├── pages/        # 页面组件
│   │   ├── services/     # API服务
│   │   ├── hooks/        # 自定义Hooks
│   │   ├── utils/        # 工具函数
│   │   └── types/        # TypeScript类型
│   ├── package.json
│   └── vite.config.ts
├── backend/               # 后端应用
│   ├── src/
│   │   ├── controllers/   # 控制器
│   │   ├── models/       # 数据模型
│   │   ├── routes/       # 路由
│   │   ├── services/     # 业务逻辑
│   │   ├── middleware/   # 中间件
│   │   └── utils/        # 工具函数
│   ├── package.json
│   └── tsconfig.json
├── judge/                 # 评测系统
├── docker/                # Docker配置
│   ├── docker-compose.yml
│   ├── init-db.sql
│   └── .env.example
├── docs/                  # 文档
│   ├── API.md
│   └── SETUP.md
└── README.md
```

## 数据库设计

### 核心数据表

- **users**: 用户信息
- **problems**: 题目信息
- **test_cases**: 测试用例
- **submissions**: 提交记录
- **contests**: 比赛信息
- **courses**: 课程信息
- **course_materials**: 课程资源
- **user_progress**: 学习进度
- **ai_conversations**: AI对话
- **ai_messages**: AI消息

## API文档

详细的API文档请参考 [docs/API.md](docs/API.md)

## 部署指南

详细的部署指南请参考 [docs/SETUP.md](docs/SETUP.md)

## 开发指南

### 添加新页面

1. 在 `frontend/src/pages/` 创建页面组件
2. 在 `frontend/src/services/` 添加API服务
3. 在 `backend/src/routes/` 添加路由
4. 在 `backend/src/controllers/` 添加控制器

### 添加新功能

1. 设计数据库模型 (`backend/src/models/`)
2. 实现业务逻辑 (`backend/src/services/`)
3. 创建API接口 (`backend/src/controllers/` + `backend/src/routes/`)
4. 实现前端界面 (`frontend/src/components/` + `frontend/src/pages/`)

## 贡献指南

欢迎提交Issue和Pull Request！

## 许可证

MIT License

## 联系方式

如有问题，请提交Issue或联系开发者。

---

**项目创建时间**: 2026年5月26日
**开发者**: Claude Code
**版本**: 1.0.0