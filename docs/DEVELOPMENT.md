# AI OnlineJudge 开发指南

## 项目状态

✅ **开发环境已成功启动！**

- 📱 前端地址: http://localhost:3000
- 🔧 后端地址: http://localhost:5000
- 📖 API文档: http://localhost:5000/api

## 默认账号

### 管理员账号
- 用户名: `admin`
- 密码: `admin123`
- 权限: 管理员，可以管理所有功能

### 学生账号
- 用户名: `student1`
- 密码: `admin123`
- 权限: 学生，可以做题和参与比赛

## 技术栈

### 前端
- React 18 + TypeScript
- Vite
- Ant Design
- React Router
- Monaco Editor
- Axios

### 后端
- Node.js + Express
- TypeScript
- 内存数据库 (开发环境)
- 内存缓存 (开发环境)
- JWT认证
- Winston日志

### 开发工具
- tsx (TypeScript执行器)
- tsx watch (热重载)

## 开发命令

### 后端开发
```bash
cd backend
npm run dev      # 启动开发服务器 (支持热重载)
npm run build    # 构建生产版本
npm start        # 启动生产服务器
```

### 前端开发
```bash
cd frontend
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
npm run preview  # 预览生产版本
```

### 快速启动
```bash
# Windows
scripts\start-dev.bat

# Linux/Mac
chmod +x scripts/start-dev.sh
./scripts/start-dev.sh
```

## 项目结构

```
ai-onlinejudge/
├── backend/               # 后端应用
│   ├── src/
│   │   ├── config/       # 配置文件 (数据库、缓存)
│   │   ├── controllers/  # 控制器
│   │   ├── middleware/   # 中间件
│   │   ├── models/       # 数据模型
│   │   ├── routes/       # 路由
│   │   ├── services/     # 业务逻辑
│   │   └── utils/        # 工具函数
│   ├── package.json
│   └── tsconfig.json
├── frontend/              # 前端应用
│   ├── src/
│   │   ├── components/   # React组件
│   │   ├── pages/        # 页面组件
│   │   ├── services/     # API服务
│   │   ├── hooks/        # 自定义Hooks
│   │   ├── types/        # TypeScript类型
│   │   ├── utils/        # 工具函数
│   │   └── styles/       # 样式文件
│   ├── package.json
│   └── vite.config.ts
├── docs/                  # 文档
│   ├── API.md            # API文档
│   ├── SETUP.md          # 部署指南
│   └── DEVELOPMENT.md    # 开发指南
├── scripts/               # 脚本文件
│   ├── start-dev.bat     # Windows启动脚本
│   └── start-dev.sh      # Linux/Mac启动脚本
└── README.md
```

## 开发流程

### 1. 添加新功能

#### 后端
1. 在 `backend/src/models/` 中定义数据模型
2. 在 `backend/src/services/` 中实现业务逻辑
3. 在 `backend/src/controllers/` 中创建控制器
4. 在 `backend/src/routes/` 中添加路由
5. 在 `backend/src/index.ts` 中注册路由

#### 前端
1. 在 `frontend/src/types/` 中定义TypeScript类型
2. 在 `frontend/src/services/` 中添加API服务
3. 在 `frontend/src/components/` 中创建组件
4. 在 `frontend/src/pages/` 中创建页面
5. 在路由配置中添加新路由

### 2. 调试技巧

#### 后端调试
```typescript
// 在代码中添加日志
import { logger } from './utils/logger'

logger.info('调试信息', { data })
logger.error('错误信息', error)
```

#### 前端调试
```typescript
// 在浏览器控制台中查看
console.log('调试信息', data)
```

#### API测试
```bash
# 使用curl测试API
curl -X GET http://localhost:5000/health

# 测试登录接口
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

## 数据库说明

开发环境使用内存数据库，重启后数据会重置。

### 默认数据

#### 用户
- 管理员: admin@example.com
- 学生: student1@example.com

#### 题目
- A+B问题 (简单)
- 斐波那契数列 (中等)
- 最大公约数 (简单)

## 环境变量

### 后端 (.env)
```env
# Database (开发环境使用内存数据库，可忽略)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=onlinejudge
DB_USER=postgres
DB_PASSWORD=postgres

# Redis (开发环境使用内存缓存，可忽略)
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=dev-secret-key-change-in-production

# AI (可选)
ANTHROPIC_API_KEY=

# Server
PORT=5000
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:3000

# Judge Server (可选)
JUDGE_SERVER_URL=http://localhost:8000
JUDGE_SERVER_TOKEN=your-judge-server-token

# Logging
LOG_LEVEL=info
```

### 前端 (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_TITLE=AI OnlineJudge
```

## 常见问题

### 1. 端口被占用
如果5000或3000端口被占用，可以修改：
- 后端: `.env` 文件中的 `PORT`
- 前端: `vite.config.ts` 文件中的 `server.port`

### 2. 依赖安装失败
```bash
# 清除缓存重新安装
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 3. TypeScript编译错误
```bash
# 重新生成类型定义
npm run build
```

### 4. API调用失败
1. 检查后端服务是否正常启动
2. 检查网络连接
3. 查看浏览器控制台和后端日志

## 下一步

### 功能完善
1. 添加更多前端页面
2. 完善AI智能体功能
3. 集成真实的评测系统
4. 添加实时通知功能
5. 优化用户体验

### 生产部署
1. 配置PostgreSQL数据库
2. 配置Redis缓存
3. 配置Nginx反向代理
4. 配置SSL证书
5. 性能优化和安全加固

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 联系方式

如有问题，请提交Issue或联系开发者。

---

**更新时间**: 2026年5月26日
**版本**: 1.0.0