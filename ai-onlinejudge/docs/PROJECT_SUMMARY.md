# AI-Enabled OnlineJudge 项目总结

## 项目概述

这是一个功能完整的 OnlineJudge 系统，专为信息学竞赛学习设计。系统集成了AI智能体功能，提供智能的编程学习体验，并支持课程资源管理。

## 技术栈

### 前端
- **React 18** + **TypeScript** - 现代化的前端框架
- **Vite** - 快速的开发构建工具
- **Ant Design** - 企业级UI组件库
- **React Router** - 前端路由管理
- **Axios** - HTTP客户端
- **Zustand** - 状态管理

### 后端
- **Node.js** + **Express** - 后端服务框架
- **TypeScript** - 类型安全开发
- **PostgreSQL** - 关系型数据库
- **Redis** - 缓存和会话管理
- **JWT** - 用户认证
- **Winston** - 日志管理

### 评测系统
- **QDUOJ** - 青岛大学开源评测系统
- 支持多种编程语言
- 完整的评测API

### AI集成
- **Anthropic Claude API** - AI智能体服务
- **LangChain** - AI应用开发框架

### 部署
- **Docker** + **Docker Compose** - 容器化部署
- **Nginx** - 反向代理和静态文件服务

## 核心功能模块

### 1. 用户系统 ✅
- 用户注册/登录
- 角色管理（学生、教师、管理员）
- 个人资料管理
- 用户排名和统计

### 2. 题目系统 ✅
- 题目CRUD操作
- 题目分类和标签
- 难度级别管理
- 题目搜索功能
- 多语言支持

### 3. 评测系统 ✅
- 代码提交和评测
- 实时状态查询
- 评测结果展示
- 提交历史记录

### 4. AI智能体 ✅
- 智能对话界面
- 题目解答指导
- 知识点讲解
- 代码优化建议
- 对话历史管理

### 5. 课程学习系统 ✅
- 课程管理
- 资源上传（PPT、视频）
- 学习进度追踪
- 课程分类和搜索

### 6. 排名统计 ✅
- 用户排名
- 比赛排名
- 学习统计
- 数据可视化

### 7. 比赛系统 ✅
- 在线比赛创建
- 比赛注册
- 实时排行榜
- 比赛状态管理

## 项目结构

```
ai-onlinejudge/
├── frontend/                    # 前端应用
│   ├── src/
│   │   ├── components/         # React组件
│   │   │   └── layout/         # 布局组件
│   │   ├── pages/             # 页面组件
│   │   │   └── home/           # 首页
│   │   ├── services/          # API服务
│   │   │   ├── api.ts         # Axios配置
│   │   │   ├── auth.service.ts
│   │   │   ├── problem.service.ts
│   │   │   └── ai.service.ts
│   │   ├── types/             # TypeScript类型定义
│   │   └── styles/            # 样式文件
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── Dockerfile
├── backend/                    # 后端应用
│   ├── src/
│   │   ├── controllers/       # 控制器
│   │   │   ├── auth.controller.ts
│   │   │   ├── problem.controller.ts
│   │   │   ├── submission.controller.ts
│   │   │   ├── ai.controller.ts
│   │   │   ├── course.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   └── contest.controller.ts
│   │   ├── routes/            # 路由
│   │   ├── middleware/        # 中间件
│   │   └── utils/             # 工具函数
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── judge/                      # 评测系统
├── docker/                     # Docker配置
│   ├── docker-compose.yml
│   ├── init-db.sql
│   └── .env.example
├── docs/                       # 文档
│   ├── API.md
│   └── SETUP.md
├── scripts/                    # 脚本文件
│   ├── dev.sh
│   └── build.sh
├── README.md
└── .gitignore
```

## 数据库设计

### 核心数据表
- **users** - 用户信息
- **problems** - 题目信息
- **test_cases** - 测试用例
- **submissions** - 提交记录
- **contests** - 比赛信息
- **courses** - 课程信息
- **course_materials** - 课程资源
- **user_progress** - 学习进度
- **ai_conversations** - AI对话
- **ai_messages** - AI消息

## 开发进度

### 已完成 ✅
- [x] 项目基础结构搭建
- [x] 前端开发环境配置
- [x] 后端开发环境配置
- [x] 数据库设计
- [x] API路由设计
- [x] 基础组件创建
- [x] Docker配置
- [x] 文档编写

### 待开发 🚧
- [ ] 用户认证实现
- [ ] 数据库连接和ORM
- [ ] 题目管理系统
- [ ] 评测系统集成
- [ ] Claude API集成
- [ ] AI对话界面
- [ ] 课程管理系统
- [ ] 排名和统计功能
- [ ] 比赛系统
- [ ] 文件上传功能
- [ ] 单元测试

## 快速开始

### 1. 安装依赖
```bash
# 安装前端依赖
cd frontend && npm install

# 安装后端依赖
cd backend && npm install
```

### 2. 启动服务
```bash
# 启动数据库和Redis
docker-compose -f docker/docker-compose.yml up -d postgres redis judge

# 启动后端
cd backend && npm run dev

# 启动前端
cd frontend && npm run dev
```

### 3. 访问应用
- 前端: http://localhost:3000
- 后端: http://localhost:5000
- API文档: docs/API.md

## 部署方案

### Docker部署
```bash
# 构建项目
./scripts/build.sh

# 启动所有服务
docker-compose -f docker/docker-compose.yml up -d
```

### 环境变量配置
- `JWT_SECRET` - JWT密钥
- `ANTHROPIC_API_KEY` - Claude API密钥
- `JUDGE_SERVER_TOKEN` - 评测服务器密钥

## 技术特点

### 安全性
- JWT用户认证
- 密码加密存储
- 请求限流保护
- CORS配置
- XSS防护

### 性能
- 数据库查询优化
- Redis缓存
- 代码分割和懒加载
- 静态资源CDN

### 扩展性
- 模块化架构
- RESTful API设计
- 容器化部署
- 微服务架构

## 后续计划

### 短期目标
1. 实现核心功能的业务逻辑
2. 完成前后端对接
3. 集成Claude API
4. 添加基础测试

### 中期目标
1. 优化用户体验
2. 添加更多题目和课程
3. 实现高级AI功能
4. 性能优化

### 长期目标
1. 支持多语言国际化
2. 实现移动端适配
3. 添加社交功能
4. 大数据分析和推荐

## 贡献指南

欢迎提交Issue和Pull Request！

## 许可证

MIT License

---

**项目创建时间**: 2024年5月26日  
**开发者**: Claude Code  
**版本**: 1.0.0