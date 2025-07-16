-- 天天练数学平台数据库结构
-- 简化版本，只包含基本功能

-- 用户表
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 题目表
CREATE TABLE questions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    content TEXT NOT NULL,
    option_a VARCHAR(500) NOT NULL,
    option_b VARCHAR(500) NOT NULL,
    option_c VARCHAR(500) NOT NULL,
    option_d VARCHAR(500) NOT NULL,
    correct_answer ENUM('A', 'B', 'C', 'D') NOT NULL,
    explanation TEXT,
    difficulty INT NOT NULL DEFAULT 1 CHECK (difficulty >= 1 AND difficulty <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 练习记录表
CREATE TABLE practice_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    questions JSON NOT NULL,  -- 存储12道题目的ID数组
    answers JSON,             -- 存储用户答案
    score INT DEFAULT 0,      -- 总分
    difficulty INT NOT NULL,  -- 难度等级
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 用户答题记录表
CREATE TABLE user_answers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    question_id INT NOT NULL,
    practice_record_id INT NOT NULL,
    user_answer ENUM('A', 'B', 'C', 'D') NOT NULL,
    is_correct BOOLEAN NOT NULL,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (practice_record_id) REFERENCES practice_records(id) ON DELETE CASCADE
);

-- 插入一些示例数据
INSERT INTO users (username, password, email) VALUES 
('student1', '$2b$10$dummy.hash.for.testing', 'student1@example.com'),
('student2', '$2b$10$dummy.hash.for.testing', 'student2@example.com');

-- 插入一些示例题目
INSERT INTO questions (content, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty) VALUES
('函数 f(x) = x² + 2x + 1 的最小值是多少？', 'A. -1', 'B. 0', 'C. 1', 'D. 2', 'B', '将函数配方得 f(x) = (x+1)² ≥ 0，所以最小值为0', 1),
('设 a = log₂3，b = log₃2，则 ab 的值是？', 'A. 1', 'B. 2', 'C. 3', 'D. 6', 'A', '根据换底公式，a = log₂3 = 1/log₃2，所以 ab = 1', 2),
('已知等差数列 {aₙ} 的首项 a₁ = 1，公差 d = 2，则 a₁₀ = ?', 'A. 17', 'B. 19', 'C. 21', 'D. 23', 'B', '等差数列通项公式 aₙ = a₁ + (n-1)d，所以 a₁₀ = 1 + 9×2 = 19', 1),
('函数 y = sin(2x + π/3) 的周期是？', 'A. π/2', 'B. π', 'C. 2π', 'D. 4π', 'B', '正弦函数 y = sin(ωx + φ) 的周期为 2π/ω，所以周期为 2π/2 = π', 2),
('设集合 A = {1, 2, 3}，B = {2, 3, 4}，则 A ∩ B = ?', 'A. {1}', 'B. {2, 3}', 'C. {4}', 'D. {1, 2, 3, 4}', 'B', '交集是两个集合的公共元素，A 和 B 的公共元素是 {2, 3}', 1);