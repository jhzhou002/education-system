const { query, testConnection } = require('../config/database');

const tables = [
  // 用户表
  `CREATE TABLE IF NOT EXISTS sl_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    email VARCHAR(100) UNIQUE NOT NULL COMMENT '邮箱',
    password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
    phone VARCHAR(20) COMMENT '手机号',
    real_name VARCHAR(50) COMMENT '真实姓名',
    nickname VARCHAR(50) COMMENT '昵称',
    avatar_url VARCHAR(255) COMMENT '头像URL',
    gender ENUM('male', 'female', 'other') COMMENT '性别',
    birth_date DATE COMMENT '出生日期',
    school VARCHAR(100) COMMENT '学校',
    grade ENUM('高一', '高二', '高三') COMMENT '年级',
    class_name VARCHAR(50) COMMENT '班级',
    role ENUM('student', 'teacher', 'admin') DEFAULT 'student' COMMENT '角色',
    status ENUM('active', 'inactive', 'banned') DEFAULT 'active' COMMENT '状态',
    last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_grade (grade),
    INDEX idx_status (status)
  ) COMMENT='用户表'`,

  // 科目表
  `CREATE TABLE IF NOT EXISTS sl_subjects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(20) UNIQUE NOT NULL COMMENT '科目代码',
    name VARCHAR(50) NOT NULL COMMENT '科目名称',
    display_name VARCHAR(50) NOT NULL COMMENT '显示名称',
    description TEXT COMMENT '科目描述',
    icon_class VARCHAR(50) COMMENT '图标样式类',
    color VARCHAR(20) COMMENT '主题颜色',
    sort_order INT DEFAULT 0 COMMENT '排序',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_code (code),
    INDEX idx_is_active (is_active),
    INDEX idx_sort_order (sort_order)
  ) COMMENT='科目表'`,

  // 教材版本表
  `CREATE TABLE IF NOT EXISTS sl_textbooks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    subject_id INT NOT NULL COMMENT '科目ID',
    name VARCHAR(100) NOT NULL COMMENT '教材名称',
    version VARCHAR(50) NOT NULL COMMENT '版本号',
    publisher VARCHAR(100) COMMENT '出版社',
    grade ENUM('高一', '高二', '高三') NOT NULL COMMENT '年级',
    description TEXT COMMENT '教材描述',
    cover_url VARCHAR(255) COMMENT '封面图片',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    sort_order INT DEFAULT 0 COMMENT '排序',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (subject_id) REFERENCES sl_subjects(id),
    INDEX idx_subject_grade (subject_id, grade),
    INDEX idx_active (is_active)
  ) COMMENT='教材版本表'`,

  // 章节表
  `CREATE TABLE IF NOT EXISTS sl_chapters (
    id INT PRIMARY KEY AUTO_INCREMENT,
    subject_id INT NOT NULL COMMENT '科目ID',
    textbook_id INT NOT NULL COMMENT '教材ID',
    chapter_number VARCHAR(20) NOT NULL COMMENT '章节号',
    title VARCHAR(200) NOT NULL COMMENT '章节标题',
    parent_id INT NULL COMMENT '父章节ID',
    description TEXT COMMENT '章节描述',
    learning_objectives TEXT COMMENT '学习目标',
    key_concepts JSON COMMENT '核心概念',
    difficulty_level INT DEFAULT 1 COMMENT '难度等级',
    estimated_hours INT DEFAULT 8 COMMENT '预计学习时长',
    sort_order INT DEFAULT 0 COMMENT '排序',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (subject_id) REFERENCES sl_subjects(id),
    FOREIGN KEY (textbook_id) REFERENCES sl_textbooks(id),
    FOREIGN KEY (parent_id) REFERENCES sl_chapters(id),
    INDEX idx_subject_textbook (subject_id, textbook_id),
    INDEX idx_parent_id (parent_id),
    INDEX idx_sort_order (sort_order)
  ) COMMENT='章节表'`,

  // 知识点表
  `CREATE TABLE IF NOT EXISTS sl_knowledge_points (
    id INT PRIMARY KEY AUTO_INCREMENT,
    subject_id INT NOT NULL COMMENT '科目ID',
    code VARCHAR(50) UNIQUE NOT NULL COMMENT '知识点编码',
    name VARCHAR(200) NOT NULL COMMENT '知识点名称',
    parent_id INT NULL COMMENT '父知识点ID',
    chapter_id INT NOT NULL COMMENT '所属章节ID',
    grade ENUM('高一', '高二', '高三') NOT NULL COMMENT '年级归属',
    semester ENUM('上学期', '下学期') COMMENT '学期归属',
    is_core BOOLEAN DEFAULT TRUE COMMENT '是否核心考点',
    exam_frequency DECIMAL(3,2) DEFAULT 0.00 COMMENT '考试出现频率(0-1)',
    difficulty_level INT DEFAULT 1 COMMENT '难度等级1-5',
    description TEXT COMMENT '知识点描述',
    key_concepts JSON COMMENT '核心概念',
    formulas JSON COMMENT '相关公式',
    prerequisites JSON COMMENT '前置知识点ID数组',
    learning_objectives TEXT COMMENT '学习目标',
    common_mistakes JSON COMMENT '常见错误',
    solution_methods JSON COMMENT '解题方法',
    tags JSON COMMENT '标签',
    sort_order INT DEFAULT 0 COMMENT '排序',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (subject_id) REFERENCES sl_subjects(id),
    FOREIGN KEY (parent_id) REFERENCES sl_knowledge_points(id),
    FOREIGN KEY (chapter_id) REFERENCES sl_chapters(id),
    INDEX idx_subject_grade (subject_id, grade),
    INDEX idx_chapter_grade (chapter_id, grade),
    INDEX idx_parent_id (parent_id),
    INDEX idx_code (code),
    INDEX idx_is_core (is_core),
    INDEX idx_difficulty_level (difficulty_level),
    INDEX idx_exam_frequency (exam_frequency)
  ) COMMENT='知识点表（基于教育部课程标准）'`,

  // 题目表
  `CREATE TABLE IF NOT EXISTS sl_questions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    subject_id INT NOT NULL COMMENT '科目ID',
    type VARCHAR(20) NOT NULL COMMENT '题型',
    content LONGTEXT NOT NULL COMMENT '题目内容',
    content_format ENUM('text', 'latex', 'html', 'markdown') DEFAULT 'latex' COMMENT '内容格式',
    images JSON COMMENT '题目图片',
    options JSON COMMENT '选项（选择题）',
    answer JSON NOT NULL COMMENT '答案',
    analysis LONGTEXT COMMENT '解析',
    analysis_format ENUM('text', 'latex', 'html', 'markdown') DEFAULT 'latex' COMMENT '解析格式',
    difficulty INT DEFAULT 1 COMMENT '难度等级',
    chapter_id INT COMMENT '所属章节',
    grade ENUM('高一', '高二', '高三') COMMENT '年级',
    exam_type ENUM('选择题', '填空题', '解答题', '证明题') COMMENT '高考题型分类',
    is_core_exam BOOLEAN DEFAULT FALSE COMMENT '是否核心考点题目',
    error_rate DECIMAL(3,2) DEFAULT 0.00 COMMENT '错误率统计',
    source ENUM('AI生成', '人工录入', '第三方导入', '用户贡献') DEFAULT 'AI生成' COMMENT '题目来源',
    source_detail VARCHAR(255) COMMENT '来源详情',
    generation_model VARCHAR(50) COMMENT '生成模型',
    validation_score DECIMAL(3,1) COMMENT '校验分数',
    status ENUM('待审核', '已通过', '已拒绝', '需修改') DEFAULT '待审核' COMMENT '审核状态',
    estimated_time INT DEFAULT 180 COMMENT '预估答题时间(秒)',
    solution_methods JSON COMMENT '解题方法标签',
    tags JSON COMMENT '标签',
    metadata JSON COMMENT '元数据',
    created_by INT COMMENT '创建者ID',
    reviewed_by INT COMMENT '审核者ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (subject_id) REFERENCES sl_subjects(id),
    FOREIGN KEY (chapter_id) REFERENCES sl_chapters(id),
    FOREIGN KEY (created_by) REFERENCES sl_users(id),
    FOREIGN KEY (reviewed_by) REFERENCES sl_users(id),
    INDEX idx_subject_type (subject_id, type),
    INDEX idx_difficulty (difficulty),
    INDEX idx_chapter_grade (chapter_id, grade),
    INDEX idx_grade_exam_type (grade, exam_type),
    INDEX idx_is_core_exam (is_core_exam),
    INDEX idx_status (status),
    INDEX idx_source (source),
    INDEX idx_error_rate (error_rate),
    INDEX idx_created_at (created_at),
    FULLTEXT KEY ft_content (content)
  ) COMMENT='题目表（增强考点权重支持）'`,

  // 题目知识点关联表
  `CREATE TABLE IF NOT EXISTS sl_question_knowledge_points (
    id INT PRIMARY KEY AUTO_INCREMENT,
    question_id INT NOT NULL COMMENT '题目ID',
    knowledge_point_id INT NOT NULL COMMENT '知识点ID',
    weight DECIMAL(3,2) DEFAULT 1.0 COMMENT '权重(0-1)',
    is_primary BOOLEAN DEFAULT FALSE COMMENT '是否主要知识点',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (question_id) REFERENCES sl_questions(id) ON DELETE CASCADE,
    FOREIGN KEY (knowledge_point_id) REFERENCES sl_knowledge_points(id),
    UNIQUE KEY uk_question_knowledge (question_id, knowledge_point_id),
    INDEX idx_question_id (question_id),
    INDEX idx_knowledge_point_id (knowledge_point_id),
    INDEX idx_is_primary (is_primary)
  ) COMMENT='题目知识点关联表'`,

  // 用户答题记录表
  `CREATE TABLE IF NOT EXISTS sl_user_answers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID',
    question_id INT NOT NULL COMMENT '题目ID',
    user_answer JSON COMMENT '用户答案',
    is_correct BOOLEAN COMMENT '是否正确',
    score DECIMAL(4,2) COMMENT '得分',
    time_spent INT COMMENT '答题时间(秒)',
    attempt_count INT DEFAULT 1 COMMENT '尝试次数',
    session_id VARCHAR(50) COMMENT '会话ID',
    answer_analysis TEXT COMMENT '答题分析',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES sl_users(id),
    FOREIGN KEY (question_id) REFERENCES sl_questions(id),
    INDEX idx_user_question (user_id, question_id),
    INDEX idx_user_session (user_id, session_id),
    INDEX idx_is_correct (is_correct),
    INDEX idx_created_at (created_at)
  ) COMMENT='用户答题记录表'`,

  // 用户学习进度表
  `CREATE TABLE IF NOT EXISTS sl_user_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID',
    knowledge_point_id INT NOT NULL COMMENT '知识点ID',
    mastery_level DECIMAL(3,2) DEFAULT 0.0 COMMENT '掌握程度(0-1)',
    practice_count INT DEFAULT 0 COMMENT '练习次数',
    correct_count INT DEFAULT 0 COMMENT '正确次数',
    last_practice_at TIMESTAMP NULL COMMENT '最后练习时间',
    estimated_mastery_time INT COMMENT '预估掌握时间(分钟)',
    learning_path JSON COMMENT '学习路径',
    weak_points JSON COMMENT '薄弱环节',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES sl_users(id),
    FOREIGN KEY (knowledge_point_id) REFERENCES sl_knowledge_points(id),
    UNIQUE KEY uk_user_knowledge (user_id, knowledge_point_id),
    INDEX idx_user_id (user_id),
    INDEX idx_knowledge_point_id (knowledge_point_id),
    INDEX idx_mastery_level (mastery_level),
    INDEX idx_last_practice_at (last_practice_at)
  ) COMMENT='用户学习进度表'`
];

async function migrate() {
  try {
    console.log('🚀 开始数据库迁移...');
    
    // 测试连接
    await testConnection();
    
    // 执行表创建
    for (let i = 0; i < tables.length; i++) {
      const tableName = tables[i].match(/CREATE TABLE IF NOT EXISTS (\w+)/)[1];
      console.log(`📝 创建表: ${tableName}`);
      await query(tables[i]);
    }
    
    console.log('✅ 数据库迁移完成!');
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库迁移失败:', error);
    process.exit(1);
  }
}

migrate();