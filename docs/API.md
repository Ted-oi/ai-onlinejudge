# AI OnlineJudge API 文档

## 基础信息

- 基础 URL: `http://localhost:5000/api`
- 认证方式: JWT Bearer Token（Header: `Authorization: Bearer <token>`）
- 内容类型: `application/json`

## 通用响应格式

**成功:**
```json
{ "success": true, "data": { ... } }
```

**失败:**
```json
{ "success": false, "error": { "message": "错误描述" } }
```

## 认证 `/auth`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/auth/register` | 注册（username, email, password, role） | 否 |
| POST | `/auth/login` | 登录（account: 用户名或邮箱, password） | 否 |
| POST | `/auth/logout` | 退出登录 | 是 |
| GET | `/auth/me` | 获取当前用户信息 | 是 |

## 题目 `/problems`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/problems` | 题目列表（search, difficulty, category, page, limit） |
| GET | `/problems/:id` | 题目详情 |
| POST | `/problems` | 创建题目（admin/teacher） |
| PUT | `/problems/:id` | 更新题目 |
| DELETE | `/problems/:id` | 删除题目 |
| GET | `/problems/:id/testcases` | 获取测试用例 |
| POST | `/problems/:id/testcases` | 添加测试用例 |
| PUT | `/problems/testcases/:id` | 更新测试用例 |
| DELETE | `/problems/testcases/:id` | 删除测试用例 |
| POST | `/problems/import` | 导入题目（JSON 文件） |
| GET | `/problems/export` | 导出题目 |
| POST | `/problems/:id/favorite` | 收藏/取消收藏 |

## 提交 `/submissions`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/submissions` | 提交代码（problem_id, language, code, contest_id?） |
| GET | `/submissions` | 提交列表（page, limit, user_id?, problem_id?, status?） |
| GET | `/submissions/:id` | 提交详情 |

## 比赛 `/contests`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/contests` | 比赛列表 |
| GET | `/contests/:id` | 比赛详情 |
| POST | `/contests` | 创建比赛（admin/teacher） |
| PUT | `/contests/:id` | 更新比赛 |
| DELETE | `/contests/:id` | 删除比赛 |
| POST | `/contests/:id/register` | 注册参赛 |
| GET | `/contests/:id/standing` | 比赛排名 |

## 课程 `/courses`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/courses` | 课程列表 |
| GET | `/courses/:id` | 课程详情 |
| POST | `/courses` | 创建课程（admin/teacher） |
| PUT | `/courses/:id` | 更新课程 |
| DELETE | `/courses/:id` | 删除课程 |

## AI `/ai`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/ai/chat` | AI 对话（message, user_id, problem_id?） |
| POST | `/ai/analyze` | 代码分析（code, language, problem_description） |
| POST | `/ai/hint` | 智能提示（problem_id, level: 1-3） |
| POST | `/ai/explain-error` | 错误解释（submission_id） |
| GET | `/ai/recommendations` | 题目推荐 |
| GET | `/ai/conversations/:userId` | 对话历史 |

## 排行榜 `/leaderboard`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/leaderboard` | 全局排行榜（search, role, page, limit） |

## 用户 `/users`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/users/:id` | 用户信息 |
| GET | `/users/:id/stats` | 用户统计（技能雷达、提交分布） |
| PUT | `/users/:id` | 更新用户资料（含头像上传） |

## 文章 `/articles`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/articles` | 文章列表（type, search, page, limit） |
| GET | `/articles/:id` | 文章详情 |
| POST | `/articles` | 创建文章（需审核） |
| PUT | `/articles/:id` | 更新文章 |
| DELETE | `/articles/:id` | 删除文章 |
| POST | `/articles/:id/like` | 点赞 |
| POST | `/articles/:id/favorite` | 收藏 |
| POST | `/articles/:id/comments` | 评论 |
| GET | `/articles/my` | 我的文章 |
| GET | `/articles/favorites` | 收藏的文章 |

## 代码分享 `/code-shares`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/code-shares` | 分享列表 |
| GET | `/code-shares/:id` | 分享详情 |
| POST | `/code-shares` | 创建分享 |
| POST | `/code-shares/:id/like` | 点赞 |

## 学习路径 `/learning-paths`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/learning-paths` | 路径列表 |
| GET | `/learning-paths/:id` | 路径详情 |
| POST | `/learning-paths` | 创建路径（admin） |
| PUT | `/learning-paths/:id` | 更新路径 |
| POST | `/learning-paths/:id/join` | 加入路径 |
| POST | `/learning-paths/:id/leave` | 退出路径 |

## 团队 `/teams`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/teams` | 团队列表（team_type, search, page, limit） |
| GET | `/teams/my` | 我的团队 |
| GET | `/teams/:id` | 团队详情 |
| POST | `/teams` | 创建团队 |
| PUT | `/teams/:id` | 更新团队 |
| DELETE | `/teams/:id` | 删除团队 |
| POST | `/teams/:id/join` | 加入团队 |
| POST | `/teams/:id/leave` | 退出团队 |
| GET | `/teams/:id/members` | 成员列表 |
| GET | `/teams/:id/stats` | 团队统计 |
| GET | `/teams/:id/leaderboard` | 内部排行榜 |
| DELETE | `/teams/:id/members/:userId` | 移除成员 |
| PUT | `/teams/:id/transfer` | 转让队长 |
| POST | `/teams/:id/invite-code` | 生成邀请码 |
| POST | `/teams/join-by-code` | 邀请码加入 |

## 题单 `/problem-sets`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/problem-sets` | 题单列表 |
| GET | `/problem-sets/:id` | 题单详情 |
| POST | `/problem-sets` | 创建题单（admin） |
| PUT | `/problem-sets/:id` | 更新题单 |

## 通知 `/notifications`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/notifications` | 通知列表 |
| GET | `/notifications/unread-count` | 未读数量 |
| PUT | `/notifications/:id/read` | 标记已读 |

## 讨论 `/discussions`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/discussions/problem/:problemId` | 题目讨论列表 |
| GET | `/discussions/thread/:id` | 讨论详情 |
| POST | `/discussions` | 创建讨论 |
| POST | `/discussions/:id/reply` | 回复讨论 |

## 管理后台 `/admin`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/admin/stats` | 仪表盘统计 |
| PUT | `/admin/users/:id/role` | 修改用户角色 |

## 常见状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁（每分钟 500 次） |
| 500 | 服务器内部错误 |
