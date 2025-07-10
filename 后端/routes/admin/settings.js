const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../../middleware/validation');
const {
  getSettings,
  getSettingsByGroup,
  getSetting,
  updateSetting,
  batchUpdateSettings,
  deleteSetting,
  getSettingGroups,
  resetToDefaults
} = require('../../controllers/admin/settingsController');

const router = express.Router();

// 更新设置项验证规则
const updateSettingValidation = [
  body('value')
    .notEmpty()
    .withMessage('设置值不能为空')
];

// 批量更新设置验证规则
const batchUpdateValidation = [
  body('settings')
    .isObject()
    .withMessage('设置必须是一个对象')
];

// 路由定义
router.get('/', getSettings);
router.get('/groups', getSettingGroups);
router.get('/:group', getSettingsByGroup);
router.get('/:group/:key', getSetting);
router.put('/:group/:key', updateSettingValidation, validate, updateSetting);
router.put('/', batchUpdateValidation, validate, batchUpdateSettings);
router.delete('/:group/:key', deleteSetting);
router.post('/:group/reset', resetToDefaults);

module.exports = router;
