-- ============================================
-- Seed Data for AI OnlineJudge
-- Run this after init-db.sql
-- ============================================

-- 插入示例用户（密码均为 admin123）
-- bcrypt hash of 'admin123': $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
INSERT INTO users (username, email, password, role, bio, rating) VALUES
  ('admin', 'admin@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin', '系统管理员', 1500),
  ('teacher1', 'teacher1@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'teacher', '教师用户', 1400),
  ('student1', 'student1@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'student', '学生用户', 1200)
ON CONFLICT (username) DO NOTHING;

-- 插入示例课程
INSERT INTO courses (title, description, category, instructor_id) VALUES
  ('C++基础入门', '从零开始学习C++编程语言，掌握基础语法和编程思维', '语法基础', 1),
  ('算法基础精讲', '学习常用算法和数据结构，提升编程能力', '算法基础', 1)
ON CONFLICT DO NOTHING;

-- 插入示例课次
INSERT INTO lessons (course_id, title, description, knowledge_point, order_index, duration) VALUES
  (1, '第1课：C++程序结构', '了解C++程序的基本结构，学习主函数和头文件', '程序结构与编译', 1, 45),
  (1, '第2课：变量与数据类型', '学习C++中的基本数据类型和变量声明', '变量与数据类型', 2, 50),
  (1, '第3课：输入输出', '掌握C++中的标准输入输出方法', '输入输出', 3, 40),
  (2, '第1课：算法复杂度分析', '学习时间复杂度和空间复杂度的分析方法', '算法复杂度', 1, 60),
  (2, '第2课：排序算法', '学习冒泡排序、选择排序、插入排序等基础排序算法', '排序算法', 2, 70);

-- 插入示例课程资源
INSERT INTO course_materials (course_id, lesson_id, title, type, content, file_url, file_name, file_size, mime_type, order_index) VALUES
  (1, 1, 'C++程序结构课件', 'ppt', 'C++程序的基本结构...', '/uploads/courses/cpp_lesson1.pptx', 'cpp_lesson1.pptx', 2048576, 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 1),
  (1, 1, 'C++程序结构视频', 'video', 'C++程序结构教学视频...', '/uploads/courses/cpp_lesson1.mp4', 'cpp_lesson1.mp4', 104857600, 'video/mp4', 2),
  (1, 2, '变量与数据类型课件', 'ppt', 'C++变量与数据类型详解...', '/uploads/courses/cpp_lesson2.pptx', 'cpp_lesson2.pptx', 2097152, 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 1),
  (2, 4, '算法复杂度分析课件', 'ppt', '时间复杂度和空间复杂度详解...', '/uploads/courses/algorithm_lesson1.pptx', 'algorithm_lesson1.pptx', 3145728, 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 1),
  (2, 5, '排序算法演示视频', 'video', '各种排序算法的可视化演示...', '/uploads/courses/sorting_demo.mp4', 'sorting_demo.mp4', 125829120, 'video/mp4', 1);
