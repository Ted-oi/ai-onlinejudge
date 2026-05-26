# AI OnlineJudge 测试指南

## ✅ 已修复的问题

1. **题目详情显示问题** - 修复了内存数据库的类型比较问题
2. **题目示例数据格式** - 修复了examples字段的JSON序列化问题
3. **代码评测功能** - 实现了基础的代码评测逻辑
4. **提交记录管理** - 完善了提交记录的显示和管理

## 🎯 核心功能测试

### 1. 题目查看 ✅

**测试步骤：**
1. 登录系统 (使用默认账号)
2. 点击左侧菜单 "题目"
3. 点击任意题目名称

**预期结果：**
- 显示题目详情页面
- 包含题目描述、难度、分类
- 显示示例输入输出
- 有"开始解题"按钮

### 2. 代码提交 ✅

**测试步骤：**
1. 在题目详情页点击"开始解题"
2. 选择编程语言
3. 编写代码
4. 点击"提交代码"

**测试代码：**

**C++版本（A+B问题）：**
```cpp
#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
}
```

**Python版本（A+B问题）：**
```python
a, b = map(int, input().split())
print(a + b)
```

**Java版本（A+B问题）：**
```java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int a = scanner.nextInt();
        int b = scanner.nextInt();
        System.out.println(a + b);
    }
}
```

**预期结果：**
- 提交成功
- 显示评测结果（通过/错误）
- 自动跳转到提交详情页

### 3. 提交记录查看 ✅

**测试步骤：**
1. 点击左侧菜单 "提交记录"
2. 或者在提交成功后点击提交ID

**预期结果：**
- 显示提交历史记录
- 包含状态、运行时间、内存使用
- 可以查看详细信息和代码

## 🧪 评测逻辑说明

当前系统实现了基础的代码评测逻辑：

### 通过条件

**C++代码：**
- 包含 `cin` 和 `cout`
- 包含 `+` 操作符
- 包含 `#include` 语句

**Python代码：**
- 包含 `input()` 和 `print`
- 包含 `+` 操作符
- 不需要 `def` 关键字

**Java代码：**
- 包含 `Scanner`
- 包含 `System.out.println`
- 包含 `+` 操作符
- 包含 `public class`

### 错误类型

- **答案错误** (wrong_answer) - 代码不满足通过条件
- **编译错误** (compilation_error) - 缺少必要的关键字
- **运行时错误** (runtime_error) - Python代码缺少函数定义

## 📊 测试数据

### 当前可用题目

1. **A+B问题** (ID: 1)
   - 难度：简单
   - 分类：基础
   - 示例：输入 "1 2"，输出 "3"

2. **斐波那契数列** (ID: 2)
   - 难度：中等
   - 分类：动态规划
   - 示例：输入 "5"，输出 "5"

3. **最大公约数** (ID: 3)
   - 难度：简单
   - 分类：数学
   - 示例：输入 "12 18"，输出 "6"

### 测试账号

**管理员账号：**
- 邮箱：admin@example.com
- 密码：admin123
- 权限：管理员

**学生账号：**
- 邮箱：student1@example.com
- 密码：admin123
- 权限：学生

## 🔍 调试技巧

### 检查网络请求

打开浏览器开发者工具 (F12) -> Network标签，查看API调用：
- **绿色** ✅ - 请求成功
- **红色** ❌ - 请求失败，查看错误信息

### 查看控制台日志

打开浏览器开发者工具 (F12) -> Console标签，查看调试信息：
- `App组件已加载`
- `ProtectedRoute检查token: xxx`
- `题目不存在` 或其他错误信息

### API测试

使用curl命令直接测试后端API：

```bash
# 获取题目列表
curl http://localhost:5000/api/problems

# 获取题目详情
curl http://localhost:5000/api/problems/1

# 获取提交记录
curl http://localhost:5000/api/submissions

# 提交代码
curl -X POST http://localhost:5000/api/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "problem_id": 1,
    "user_id": 1,
    "language": "cpp",
    "code": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    cout << a + b << endl;\n    return 0;\n}"
  }'
```

## 🐛 常见问题

### 1. 题目详情显示"题目不存在"

**原因：** 数据库类型比较问题
**解决：** 已修复，现在支持字符串和数字的比较

### 2. 示例数据无法显示

**原因：** examples字段是字符串格式
**解决：** 已修复，现在返回正确的JSON数组

### 3. 提交后没有评测结果

**原因：** 评测逻辑未实现
**解决：** 已实现基础评测逻辑

### 4. 提交记录页面空白

**原因：** 前端路由配置问题
**解决：** 已添加提交记录相关路由

## 📈 性能指标

当前评测系统模拟的性能数据：
- **运行时间**: 10-110ms (随机生成)
- **内存使用**: 5-25MB (随机生成)
- **评测状态**: 通过/错误/编译错误/运行时错误

## 🚀 后续优化建议

1. **真实评测系统** - 集成QDUOJ或其他评测系统
2. **更多测试用例** - 为题目添加更多测试案例
3. **复杂度分析** - 分析代码时间和空间复杂度
4. **性能优化** - 优化评测速度和资源使用
5. **错误诊断** - 提供更详细的错误信息

## ✅ 测试检查清单

- [ ] 能够登录系统
- [ ] 能够查看题目列表
- [ ] 能够查看题目详情
- [ ] 能够提交代码
- [ ] 能够看到评测结果
- [ ] 能够查看提交历史
- [ ] 能够重新提交代码
- [ ] 能够查看代码详情

---

**更新时间**: 2026年5月26日
**版本**: 1.0.0