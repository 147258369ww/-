const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../../middleware/validation');
const { adminAuth } = require('../../middleware/adminAuth');
const {
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  getActivityLogs
} = require('../../controllers/admin/authController');

const router = express.Router();

// 登录验证规则
const loginValidation = [
  body('username')
    .notEmpty()
    .withMessage('用户名不能为空')
    .isLength({ min: 3, max: 50 })
    .withMessage('用户名长度必须在3-50个字符之间'),
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
    .isLength({ min: 6 })
    .withMessage('密码长度不能少于6位')
];

// 更新个人信息验证规则
const updateProfileValidation = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('姓名长度必须在1-100个字符之间'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('邮箱格式不正确')
    .normalizeEmail(),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('头像必须是有效的URL')
];

// 修改密码验证规则
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('当前密码不能为空'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('新密码长度不能少于6位')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('新密码必须包含字母和数字')
];

// 公开路由（不需要认证）
router.post('/login', loginValidation, validate, login);

// 需要认证的路由
router.post('/logout', adminAuth, logout);
router.get('/profile', adminAuth, getProfile);
router.put('/profile', adminAuth, updateProfileValidation, validate, updateProfile);
router.put('/change-password', adminAuth, changePasswordValidation, validate, changePassword);
router.get('/activity-logs', adminAuth, getActivityLogs);

// 导出路由器和子路由器
const profileRouter = express.Router();
profileRouter.get('/', adminAuth, getProfile);
profileRouter.put('/', adminAuth, updateProfileValidation, validate, updateProfile);
profileRouter.put('/change-password', adminAuth, changePasswordValidation, validate, changePassword);

const logsRouter = express.Router();
logsRouter.get('/', adminAuth, getActivityLogs);

module.exports = router;
module.exports.profileRouter = profileRouter;
module.exports.logsRouter = logsRouter;
