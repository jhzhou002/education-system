const Joi = require('joi');

// 用户注册验证
const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required().messages({
    'string.alphanum': '用户名只能包含字母和数字',
    'string.min': '用户名至少3个字符',
    'string.max': '用户名最多30个字符',
    'any.required': '用户名为必填项'
  }),
  email: Joi.string().email().required().messages({
    'string.email': '邮箱格式不正确',
    'any.required': '邮箱为必填项'
  }),
  password: Joi.string().min(6).max(30).required().messages({
    'string.min': '密码至少6个字符',
    'string.max': '密码最多30个字符',
    'any.required': '密码为必填项'
  }),
  real_name: Joi.string().max(50).allow(''),
  nickname: Joi.string().max(50).allow(''),
  phone: Joi.string().pattern(/^1[3-9]\d{9}$/).allow('').messages({
    'string.pattern.base': '手机号格式不正确'
  }),
  grade: Joi.string().valid('高一', '高二', '高三').allow('')
});

// 用户登录验证
const loginSchema = Joi.object({
  username: Joi.string().required().messages({
    'any.required': '用户名为必填项'
  }),
  password: Joi.string().required().messages({
    'any.required': '密码为必填项'
  })
});

// 题目创建验证
const questionSchema = Joi.object({
  subject_id: Joi.number().integer().positive().required(),
  type: Joi.string().valid('单选', '多选', '填空', '解答', '证明').required(),
  content: Joi.string().min(1).required(),
  content_format: Joi.string().valid('text', 'latex', 'html', 'markdown').default('latex'),
  options: Joi.array().when('type', {
    is: Joi.string().valid('单选', '多选'),
    then: Joi.required(),
    otherwise: Joi.allow(null)
  }),
  answer: Joi.alternatives().try(
    Joi.array().items(Joi.string()),
    Joi.string(),
    Joi.number()
  ).required(),
  analysis: Joi.string().allow(''),
  difficulty: Joi.number().integer().min(1).max(5).default(1),
  chapter_id: Joi.number().integer().positive().allow(null),
  grade: Joi.string().valid('高一', '高二', '高三').allow(null),
  exam_type: Joi.string().valid('选择题', '填空题', '解答题', '证明题').allow(null),
  knowledge_point_ids: Joi.array().items(Joi.number().integer().positive())
});

// AI生成题目验证
const aiGenerateSchema = Joi.object({
  subject_id: Joi.number().integer().positive().required(),
  knowledge_point_ids: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
  question_type: Joi.string().valid('单选', '多选', '填空', '解答', '证明').required(),
  difficulty: Joi.number().integer().min(1).max(5).default(3),
  count: Joi.number().integer().min(1).max(10).default(1),
  special_requirements: Joi.object().allow(null)
});

// 验证中间件工厂
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        error: '数据验证失败',
        details: errors
      });
    }
    
    req.body = value;
    next();
  };
};

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  questionSchema,
  aiGenerateSchema
};