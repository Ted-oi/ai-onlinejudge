#!/bin/bash
# AI OnlineJudge 停止脚本

PGROOT="/c/Users/15522/pgsql/pgsql"
PGDATA="/c/Users/15522/pgsql/data"

echo "正在停止所有服务..."

# 停止后端和前端
kill $(cat /tmp/oj-backend.pid 2>/dev/null) 2>/dev/null
kill $(cat /tmp/oj-frontend.pid 2>/dev/null) 2>/dev/null
pkill -f "tsx src/index.ts" 2>/dev/null
pkill -f "vite" 2>/dev/null

# 停止 PostgreSQL
"$PGROOT/bin/pg_ctl.exe" -D "$PGDATA" stop 2>/dev/null

echo "所有服务已停止"
