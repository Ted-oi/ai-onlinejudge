#!/bin/bash

echo "🚀 启动AI OnlineJudge开发环境..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js"
    exit 1
fi

echo "✅ Node.js版本: $(node --version)"

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ npm未安装，请先安装npm"
    exit 1
fi

echo "✅ npm版本: $(npm --version)"

# 安装依赖
echo "📦 安装依赖..."

if [ ! -d "backend/node_modules" ]; then
    echo "安装后端依赖..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "安装前端依赖..."
    cd frontend && npm install && cd ..
fi

# 创建环境变量文件
if [ ! -f "backend/.env" ]; then
    echo "创建后端环境变量文件..."
    cp backend/.env.example backend/.env
fi

if [ ! -f "frontend/.env" ]; then
    echo "创建前端环境变量文件..."
    cp frontend/.env.example frontend/.env
fi

echo ""
echo "🎯 启动服务..."

# 启动后端服务
echo "启动后端服务..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# 等待后端服务启动
sleep 3

# 启动前端服务
echo "启动前端服务..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ 开发环境启动成功！"
echo ""
echo "📱 前端地址: http://localhost:3000"
echo "🔧 后端地址: http://localhost:5000"
echo "📖 API文档: http://localhost:5000/api"
echo ""
echo "🔑 默认管理员账号:"
echo "   用户名: admin"
echo "   密码: admin123"
echo ""
echo "🔑 默认学生账号:"
echo "   用户名: student1"
echo "   密码: admin123"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
wait