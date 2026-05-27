#!/bin/bash
# AI OnlineJudge 一键启动脚本
# 用法: 在 Git Bash 中运行 bash start.sh

set -e

PGROOT="/c/Users/15522/pgsql/pgsql"
PGDATA="/c/Users/15522/pgsql/data"
PROJECT="/c/Users/15522/ai-onlinejudge"

echo "========================================="
echo "  AI OnlineJudge 启动脚本"
echo "========================================="

# 1. 启动 PostgreSQL
echo ""
echo "[1/3] 启动 PostgreSQL..."
if "$PGROOT/bin/pg_ctl.exe" -D "$PGDATA" status 2>&1 | grep -q "server is running"; then
  echo "  PostgreSQL 已在运行"
else
  "$PGROOT/bin/pg_ctl.exe" -D "$PGDATA" -l /c/Users/15522/pgsql/pg.log start
  echo "  PostgreSQL 启动成功"
fi

# 2. 启动后端
echo ""
echo "[2/3] 启动后端..."
cd "$PROJECT/backend"
# 后台运行，日志输出到 backend.log
npx tsx src/index.ts > backend.log 2>&1 &
BACKEND_PID=$!
echo "  后端启动中 (PID: $BACKEND_PID)..."

# 等待后端就绪
for i in $(seq 1 15); do
  if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo "  后端已就绪: http://localhost:5000"
    break
  fi
  sleep 1
done

# 3. 启动前端
echo ""
echo "[3/3] 启动前端..."
cd "$PROJECT/frontend"
npx vite --host > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "  前端启动中 (PID: $FRONTEND_PID)..."

# 等待前端就绪
for i in $(seq 1 10); do
  if curl -s -o /dev/null http://localhost:3000 2>&1; then
    echo "  前端已就绪: http://localhost:3000"
    break
  fi
  sleep 1
done

echo ""
echo "========================================="
echo "  所有服务已启动！"
echo "========================================="
echo ""
echo "  前端: http://localhost:3000"
echo "  后端: http://localhost:5000"
echo ""
echo "  测试账号:"
echo "    admin    / admin123"
echo "    teacher1 / admin123"
echo "    student1 / admin123"
echo ""
echo "  按 Ctrl+C 停止所有服务"
echo "========================================="

# 保存 PID 以便关闭
echo "$BACKEND_PID" > /tmp/oj-backend.pid
echo "$FRONTEND_PID" > /tmp/oj-frontend.pid

# 保持脚本运行，Ctrl+C 时关闭所有服务
trap "echo '正在关闭...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; '$PGROOT/bin/pg_ctl.exe' -D '$PGDATA' stop; echo '已关闭'; exit 0" SIGINT SIGTERM

wait
