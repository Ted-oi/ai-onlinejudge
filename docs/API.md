# AI OnlineJudge API 文档

## 基础信息

- 基础URL: `http://localhost:5000/api`
- 认证方式: JWT Bearer Token
- 内容类型: `application/json`

## 认证接口

### 用户注册

```
POST /auth/register
```

**请求体:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "role": "student"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "string",
      "email": "string",
      "role": "student"
    }
  }
}
```

### 用户登录

```
POST /auth/login
```

**请求体:**
```json
{
  "email": "string",
  "password": "string"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "string",
      "email": "string",
      "role": "student"
    },
    "token": "string"
  }
}
```

### 获取当前用户

```
GET /auth/me
```

**Headers:**
```
Authorization: Bearer <token>
```

**响应:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "string",
      "email": "string",
      "role": "student"
    }
  }
}
```

## 题目接口

### 获取题目列表

```
GET /problems
```

**查询参数:**
- `difficulty`: easy, medium, hard
- `category`: string
- `search`: string
- `page`: number
- `limit`: number

**响应:**
```json
{
  "success": true,
  "data": {
    "problems": [
      {
        "id": 1,
        "title": "string",
        "difficulty": "easy",
        "category": "string",
        "time_limit": 1000,
        "memory_limit": 256
      }
    ]
  }
}
```

### 获取题目详情

```
GET /problems/:id
```

**响应:**
```json
{
  "success": true,
  "data": {
    "problem": {
      "id": 1,
      "title": "string",
      "description": "string",
      "difficulty": "easy",
      "category": "string",
      "time_limit": 1000,
      "memory_limit": 256,
      "examples": []
    }
  }
}
```

## 提交接口

### 创建提交

```
POST /submissions
```

**请求体:**
```json
{
  "problem_id": 1,
  "user_id": 1,
  "language": "cpp",
  "code": "string"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "submission": {
      "id": 1,
      "problem_id": 1,
      "user_id": 1,
      "language": "cpp",
      "status": "pending"
    }
  }
}
```

### 获取提交详情

```
GET /submissions/:id
```

**响应:**
```json
{
  "success": true,
  "data": {
    "submission": {
      "id": 1,
      "problem_id": 1,
      "user_id": 1,
      "language": "cpp",
      "status": "accepted",
      "runtime": 100,
      "memory": 10
    }
  }
}
```

## AI接口

### AI对话

```
POST /ai/chat
```

**请求体:**
```json
{
  "user_id": 1,
  "problem_id": 1,
  "message": "string",
  "conversation_id": 1
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "conversation_id": 1,
    "message": "string"
  }
}
```

### 代码分析

```
POST /ai/analyze
```

**请求体:**
```json
{
  "code": "string",
  "language": "cpp",
  "problem_description": "string"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "analysis": "string"
  }
}
```

## 错误响应

所有错误响应格式：

```json
{
  "success": false,
  "error": {
    "message": "错误信息"
  }
}
```

### 常见状态码

- `400`: 请求参数错误
- `401`: 未认证
- `403`: 权限不足
- `404`: 资源不存在
- `500`: 服务器错误