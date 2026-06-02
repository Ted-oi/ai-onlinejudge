# AI OnlineJudge 部署指南

## 一键启动（开发环境）

```bash
# 克隆项目
git clone https://github.com/Ted-oi/ai-onlinejudge.git
cd ai-onlinejudge

# 安装依赖
cd frontend && npm install && cd ../backend && npm install

# 一键启动 PostgreSQL + 后端 + 前端
bash start.sh

# 一键停止
bash stop.sh
```

- 前端: http://localhost:3000
- 后端: http://localhost:5000

## 环境要求

- Node.js 18+
- PostgreSQL 14+（免安装版即可，数据目录默认 `C:\Users\15522\pgsql\data`）
- 智谱 API Key（AI 功能可选，不配置则 AI 功能不可用）

## 环境配置

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
JWT_SECRET=dev-secret-key-change-in-production

# AI（可选）
GLM_API_KEY=your-glm-api-key
GLM_API_URL=https://open.bigmodel.cn/api/paas/v4/chat/completions
GLM_MODEL=glm-4-flash

# Server
PORT=5000
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:3000
```

## 前端配置

前端通过 Vite 代理将 `/api` 请求转发到后端，配置在 `frontend/vite.config.ts`：

```typescript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
  },
}
```

## 测试账号

| 账号 | 密码 | 角色 |
|------|------|------|
| admin | admin123 | 管理员 |
| teacher1 | admin123 | 教师 |
| student1 | admin123 | 学生 |

## Docker 生产部署

```bash
cd docker
docker compose up -d
```

Docker 配置包含：
- 后端多阶段构建（Node.js）
- 前端多阶段构建（Nginx 托管静态文件）
- Nginx 反向代理（前端 + API）

### Nginx 配置

```nginx
server {
    listen 80;

    # 前端静态文件
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    # API 代理到后端
    location /api {
        proxy_pass http://backend:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 数据库管理

### 备份

```bash
pg_dump -U postgres onlinejudge > backup.sql
```

### 恢复

```bash
psql -U postgres onlinejudge < backup.sql
```

## 常见问题

### 1. 登录提示"请求失败"

检查 PostgreSQL 是否运行：
```bash
# Linux/Mac
pg_isready

# Windows
netstat -an | grep 5432
```

如果未运行，执行 `bash start.sh` 会自动启动。

### 2. Rate Limit 429 错误

默认限制为每分钟 500 次请求。如需调整，修改 `backend/src/index.ts` 中的 `rateLimit` 配置。

### 3. AI 功能不可用

确认 `backend/.env` 中 `GLM_API_KEY` 已配置有效的智谱 API Key。可在 https://open.bigmodel.cn 申请。

### 4. 前端无法访问后端

确认 `frontend/vite.config.ts` 中 proxy target 指向后端实际端口。
