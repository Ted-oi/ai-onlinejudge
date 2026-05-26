# AI OnlineJudge 部署指南

## 环境要求

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Docker & Docker Compose
- Claude API Key

## 开发环境搭建

### 1. 克隆项目

```bash
git clone <repository-url>
cd ai-onlinejudge
```

### 2. 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 3. 配置环境变量

复制环境变量模板文件：

```bash
# 后端环境变量
cp backend/.env.example backend/.env

# 前端环境变量
cp frontend/.env.example frontend/.env

# Docker环境变量
cp docker/.env.example docker/.env
```

编辑 `backend/.env` 文件，配置必要的环境变量：

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=onlinejudge
DB_USER=postgres
DB_PASSWORD=postgres

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key-change-in-production

# AI
ANTHROPIC_API_KEY=your-anthropic-api-key

# Server
PORT=5000
NODE_ENV=development
```

### 4. 启动数据库

```bash
# 使用Docker启动数据库
cd docker
docker-compose up -d postgres redis

# 等待数据库启动
sleep 10

# 初始化数据库
docker exec -i onlinejudge-postgres psql -U postgres -d onlinejudge < init-db.sql
```

### 5. 启动后端服务

```bash
cd backend
npm run dev
```

后端服务将在 `http://localhost:5000` 启动。

### 6. 启动前端服务

```bash
# 新开一个终端
cd frontend
npm run dev
```

前端服务将在 `http://localhost:3000` 启动。

### 7. 启动评测服务（可选）

```bash
# 新开一个终端
cd judge
docker-compose up -d
```

评测服务将在 `http://localhost:8000` 启动。

## 生产环境部署

### 1. 使用Docker Compose部署

```bash
# 配置环境变量
cp docker/.env.example docker/.env
# 编辑 .env 文件，设置生产环境配置

# 构建并启动所有服务
docker-compose -f docker/docker-compose.yml up -d

# 查看日志
docker-compose -f docker/docker-compose.yml logs -f

# 停止服务
docker-compose -f docker/docker-compose.yml down
```

### 2. 单独部署后端

```bash
cd backend

# 构建项目
npm run build

# 使用PM2启动
npm install -g pm2
pm2 start dist/index.js --name onlinejudge-backend

# 或者直接启动
npm start
```

### 3. 单独部署前端

```bash
cd frontend

# 构建项目
npm run build

# 使用nginx部署
# 将 dist 目录配置到nginx
```

### 4. nginx配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 后端API代理
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 前端资源
    location /assets {
        root /path/to/frontend/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 数据库管理

### 备份数据库

```bash
docker exec onlinejudge-postgres pg_dump -U postgres onlinejudge > backup.sql
```

### 恢复数据库

```bash
docker exec -i onlinejudge-postgres psql -U postgres onlinejudge < backup.sql
```

### 查看数据库状态

```bash
docker exec -it onlinejudge-postgres psql -U postgres -d onlinejudge
```

## 常见问题

### 1. 数据库连接失败

检查数据库是否启动：
```bash
docker ps | grep postgres
```

检查环境变量配置是否正确。

### 2. Redis连接失败

检查Redis是否启动：
```bash
docker ps | grep redis
```

### 3. 前端无法访问后端API

检查CORS配置是否正确，确保 `FRONTEND_URL` 环境变量设置正确。

### 4. 评测服务不可用

检查评测服务是否启动，确保 `JUDGE_SERVER_URL` 和 `JUDGE_SERVER_TOKEN` 配置正确。

## 安全建议

1. 修改所有默认密码和密钥
2. 使用HTTPS协议
3. 配置防火墙规则
4. 定期备份数据库
5. 监控服务器资源使用情况
6. 及时更新依赖包版本

## 性能优化

1. 配置Redis缓存热点数据
2. 使用CDN加速静态资源
3. 数据库查询优化
4. 启用gzip压缩
5. 配置负载均衡

## 监控和日志

1. 配置日志收集系统（如ELK）
2. 设置性能监控（如Prometheus）
3. 配置告警系统
4. 定期检查服务器资源使用情况