@echo off
chcp 65001 >nul
echo 🚀 启动AI OnlineJudge开发环境...

REM 检查Node.js是否安装
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js未安装，请先安装Node.js
    exit /b 1
)

echo ✅ Node.js版本:
node --version

REM 检查npm是否安装
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm未安装，请先安装npm
    exit /b 1
)

echo ✅ npm版本:
npm --version

REM 安装依赖
echo.
echo 📦 安装依赖...

if not exist "backend\node_modules" (
    echo 安装后端依赖...
    cd backend
    call npm install
    cd ..
)

if not exist "frontend\node_modules" (
    echo 安装前端依赖...
    cd frontend
    call npm install
    cd ..
)

REM 创建环境变量文件
if not exist "backend\.env" (
    echo 创建后端环境变量文件...
    copy backend\.env.example backend\.env
)

if not exist "frontend\.env" (
    echo 创建前端环境变量文件...
    copy frontend\.env.example frontend\.env
)

echo.
echo 🎯 启动服务...

REM 启动后端服务
echo 启动后端服务...
cd backend
start "后端服务" cmd /k "npm run dev"
cd ..

REM 等待后端服务启动
timeout /t 3 /nobreak >nul

REM 启动前端服务
echo 启动前端服务...
cd frontend
start "前端服务" cmd /k "npm run dev"
cd ..

echo.
echo ✅ 开发环境启动成功！
echo.
echo 📱 前端地址: http://localhost:3000
echo 🔧 后端地址: http://localhost:5000
echo 📖 API文档: http://localhost:5000/api
echo.
echo 🔑 默认管理员账号:
echo    用户名: admin
echo    密码: admin123
echo.
echo 🔑 默认学生账号:
echo    用户名: student1
echo    密码: admin123
echo.
echo 要停止服务，请关闭对应的命令窗口
pause