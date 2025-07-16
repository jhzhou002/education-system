const { query, testConnection } = require('../config/database');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    console.log('🌱 开始数据库种子数据...');
    
    await testConnection();
    
    // 清空现有数据（可选）
    console.log('🗑️ 清理现有数据...');
    
    // 插入科目数据
    console.log('📚 插入科目数据...');
    await query(`
      INSERT IGNORE INTO sl_subjects (code, name, display_name, description, icon_class, color, sort_order, is_active) VALUES
      ('math', 'mathematics', '数学', '高中数学全面学习，包含函数、几何、概率统计等', 'el-icon-calculator', '#409EFF', 1, true),
      ('physics', 'physics', '物理', '高中物理学习，涵盖力学、电学、光学等', 'el-icon-lightning', '#67C23A', 2, false),
      ('chemistry', 'chemistry', '化学', '高中化学学习，包含无机、有机、物理化学', 'el-icon-test-tube', '#E6A23C', 3, false),
      ('biology', 'biology', '生物', '高中生物学习，涵盖细胞、遗传、生态等', 'el-icon-grape', '#F56C6C', 4, false)
    `);
    
    // 插入数学教材数据
    console.log('📖 插入教材数据...');
    await query(`
      INSERT IGNORE INTO sl_textbooks (subject_id, name, version, publisher, grade, description, is_active, sort_order) VALUES
      (1, '普通高中教科书数学', '人教版A版', '人民教育出版社', '高一', '人教版A版高一数学教材', true, 1),
      (1, '普通高中教科书数学', '人教版A版', '人民教育出版社', '高二', '人教版A版高二数学教材', true, 2),
      (1, '普通高中教科书数学', '人教版A版', '人民教育出版社', '高三', '人教版A版高三数学教材', true, 3)
    `);
    
    // 插入数学章节数据
    console.log('📄 插入章节数据...');
    await query(`
      INSERT IGNORE INTO sl_chapters (id, subject_id, textbook_id, chapter_number, title, description, difficulty_level, sort_order) VALUES
      (1, 1, 1, '1', '集合与逻辑', '集合的概念、运算及逻辑推理', 1, 1),
      (2, 1, 1, '2', '函数基础', '函数的概念、性质及基本函数', 2, 2),
      (3, 1, 1, '3', '指数对数函数', '指数函数、对数函数的图像与性质', 3, 3),
      (4, 1, 1, '4', '三角函数', '三角函数定义、图像、恒等变换', 3, 4),
      (5, 1, 1, '5', '平面向量', '向量的概念、运算及应用', 2, 5)
    `);
    
    // 插入知识点数据
    console.log('🧠 插入知识点数据...');
    const knowledgePoints = [
      // 高一上学期：集合与逻辑
      [1, 'MATH_G1_S1_SET_01', '集合的概念', null, 1, '高一', '上学期', true, 0.95, 1, '集合的定义、表示方法、元素与集合的关系', '["集合", "元素", "属于关系"]', '[]', '理解集合的概念，掌握集合的表示方法'],
      [1, 'MATH_G1_S1_SET_02', '集合的运算', null, 1, '高一', '上学期', true, 0.90, 2, '集合的交集、并集、补集运算', '["交集", "并集", "补集"]', '[1]', '掌握集合的基本运算及其性质'],
      [1, 'MATH_G1_S1_LOGIC_01', '命题与量词', null, 1, '高一', '上学期', true, 0.85, 2, '命题的概念、全称量词与存在量词', '["命题", "全称量词", "存在量词"]', '[1,2]', '理解命题的概念，掌握量词的使用'],
      [1, 'MATH_G1_S1_LOGIC_02', '充分必要条件', null, 1, '高一', '上学期', true, 0.88, 3, '充分条件、必要条件、充要条件的判断', '["充分条件", "必要条件", "充要条件"]', '[3]', '掌握充分必要条件的判断方法'],
      
      // 高一上学期：函数基础
      [1, 'MATH_G1_S1_FUNC_01', '函数的概念', null, 2, '高一', '上学期', true, 0.95, 2, '函数的定义、定义域、值域', '["函数", "定义域", "值域"]', '[1,2]', '理解函数的概念，掌握函数的表示方法'],
      [1, 'MATH_G1_S1_FUNC_02', '函数的性质', null, 2, '高一', '上学期', true, 0.92, 3, '函数的单调性、奇偶性、周期性', '["单调性", "奇偶性", "周期性"]', '[5]', '掌握函数的基本性质及其应用'],
      [1, 'MATH_G1_S1_FUNC_03', '二次函数', null, 2, '高一', '上学期', true, 0.98, 3, '二次函数的图像与性质', '["抛物线", "对称轴", "最值"]', '[5,6]', '掌握二次函数的图像和性质'],
      [1, 'MATH_G1_S1_FUNC_04', '幂函数', null, 2, '高一', '上学期', true, 0.80, 2, '幂函数的定义、图像与性质', '["幂函数", "指数", "图像特征"]', '[6]', '了解幂函数的基本性质']
    ];
    
    for (const kp of knowledgePoints) {
      await query(`
        INSERT IGNORE INTO sl_knowledge_points 
        (subject_id, code, name, parent_id, chapter_id, grade, semester, is_core, exam_frequency, difficulty_level, description, key_concepts, prerequisites, learning_objectives) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, kp);
    }
    
    // 创建管理员用户
    console.log('👤 创建管理员用户...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await query(`
      INSERT IGNORE INTO sl_users (username, email, password_hash, real_name, nickname, role, grade, status) VALUES
      ('admin', 'admin@smartlearn.com', ?, '系统管理员', '管理员', 'admin', '高一', 'active'),
      ('teacher', 'teacher@smartlearn.com', ?, '张老师', '数学老师', 'teacher', '高一', 'active'),
      ('student', 'student@smartlearn.com', ?, '李同学', '小李', 'student', '高一', 'active')
    `, [hashedPassword, hashedPassword, hashedPassword]);
    
    // 插入示例题目
    console.log('❓ 插入示例题目...');
    await query(`
      INSERT IGNORE INTO sl_questions (subject_id, type, content, options, answer, analysis, difficulty, chapter_id, grade, exam_type, status, created_by) VALUES
      (1, '单选', '设集合A = {1, 2, 3}，B = {2, 3, 4}，则A ∩ B =', '["A. {1}", "B. {2, 3}", "C. {3, 4}", "D. {1, 2, 3, 4}"]', '["B"]', '交集是两个集合共同拥有的元素组成的集合', 1, 1, '高一', '选择题', '已通过', 1),
      (1, '单选', '函数f(x) = x² - 2x + 1的最小值为', '["A. 0", "B. 1", "C. -1", "D. 2"]', '["A"]', '配方得f(x) = (x-1)²，最小值为0', 2, 2, '高一', '选择题', '已通过', 1),
      (1, '填空', '若函数f(x) = 2x + 1，则f(3) = ___', '[]', '[7]', 'f(3) = 2×3 + 1 = 7', 1, 2, '高一', '填空题', '已通过', 1)
    `);
    
    console.log('✅ 数据库种子数据完成!');
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库种子失败:', error);
    process.exit(1);
  }
}

seed();