const { query } = require('../../config/database');
const { logAdminActivity } = require('../../middleware/adminAuth');

/**
 * 获取所有站点设置
 */
const getSettings = async (req, res) => {
  try {
    const group = req.query.group; // 可选的分组筛选

    let settingsQuery = 'SELECT * FROM settings';
    let queryParams = [];

    if (group) {
      settingsQuery += ' WHERE group_name = ?';
      queryParams.push(group);
    }

    settingsQuery += ' ORDER BY group_name, key_name';

    const settings = await query(settingsQuery, queryParams);

    // 按分组组织设置
    const groupedSettings = {};
    settings.forEach(setting => {
      if (!groupedSettings[setting.group_name]) {
        groupedSettings[setting.group_name] = {};
      }
      groupedSettings[setting.group_name][setting.key_name] = {
        id: setting.id,
        value: setting.value,
        created_at: setting.created_at,
        updated_at: setting.updated_at
      };
    });

    res.json({
      settings: groupedSettings
    });

  } catch (error) {
    console.error('获取站点设置错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '获取站点设置失败'
    });
  }
};

/**
 * 获取特定分组的设置
 */
const getSettingsByGroup = async (req, res) => {
  try {
    const { group } = req.params;

    const settings = await query(
      'SELECT * FROM settings WHERE group_name = ? ORDER BY key_name',
      [group]
    );

    const groupSettings = {};
    settings.forEach(setting => {
      groupSettings[setting.key_name] = {
        id: setting.id,
        value: setting.value,
        created_at: setting.created_at,
        updated_at: setting.updated_at
      };
    });

    res.json({
      group,
      settings: groupSettings
    });

  } catch (error) {
    console.error('获取分组设置错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '获取分组设置失败'
    });
  }
};

/**
 * 获取单个设置项
 */
const getSetting = async (req, res) => {
  try {
    const { group, key } = req.params;

    const settingResult = await query(
      'SELECT * FROM settings WHERE group_name = ? AND key_name = ?',
      [group, key]
    );

    if (settingResult.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '设置项不存在'
      });
    }

    res.json({
      setting: settingResult[0]
    });

  } catch (error) {
    console.error('获取设置项错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '获取设置项失败'
    });
  }
};

/**
 * 更新设置项
 */
const updateSetting = async (req, res) => {
  try {
    const { group, key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '设置值不能为空'
      });
    }

    // 检查设置项是否存在
    const existingSetting = await query(
      'SELECT * FROM settings WHERE group_name = ? AND key_name = ?',
      [group, key]
    );

    if (existingSetting.length === 0) {
      // 创建新设置项
      const result = await query(
        'INSERT INTO settings (group_name, key_name, value) VALUES (?, ?, ?)',
        [group, key, value]
      );

      // 记录活动日志
      await logAdminActivity(req, 'create', 'setting', result.insertId, `创建设置项: ${group}.${key}`);

      res.status(201).json({
        message: '设置项创建成功',
        setting: {
          id: result.insertId,
          group_name: group,
          key_name: key,
          value,
          created_at: new Date(),
          updated_at: new Date()
        }
      });
    } else {
      // 更新现有设置项
      await query(
        'UPDATE settings SET value = ?, updated_at = NOW() WHERE group_name = ? AND key_name = ?',
        [value, group, key]
      );

      // 记录活动日志
      await logAdminActivity(req, 'update', 'setting', existingSetting[0].id, `更新设置项: ${group}.${key}`);

      // 返回更新后的设置
      const updatedSetting = await query(
        'SELECT * FROM settings WHERE group_name = ? AND key_name = ?',
        [group, key]
      );

      res.json({
        message: '设置项更新成功',
        setting: updatedSetting[0]
      });
    }

  } catch (error) {
    console.error('更新设置项错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '更新设置项失败'
    });
  }
};

/**
 * 批量更新设置
 */
const batchUpdateSettings = async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        error: 'Bad Request',
        message: '请提供要更新的设置对象'
      });
    }

    const updates = [];
    const creates = [];

    // 处理每个设置项
    for (const [group, groupSettings] of Object.entries(settings)) {
      for (const [key, value] of Object.entries(groupSettings)) {
        // 检查设置项是否存在
        const existingSetting = await query(
          'SELECT id FROM settings WHERE group_name = ? AND key_name = ?',
          [group, key]
        );

        if (existingSetting.length > 0) {
          updates.push({ group, key, value, id: existingSetting[0].id });
        } else {
          creates.push({ group, key, value });
        }
      }
    }

    // 执行更新
    for (const update of updates) {
      await query(
        'UPDATE settings SET value = ?, updated_at = NOW() WHERE id = ?',
        [update.value, update.id]
      );
    }

    // 执行创建
    for (const create of creates) {
      await query(
        'INSERT INTO settings (group_name, key_name, value) VALUES (?, ?, ?)',
        [create.group, create.key, create.value]
      );
    }

    // 记录活动日志
    await logAdminActivity(
      req, 
      'batch_update', 
      'setting', 
      null, 
      `批量更新设置，更新: ${updates.length}项，创建: ${creates.length}项`
    );

    res.json({
      message: `成功更新 ${updates.length} 项设置，创建 ${creates.length} 项新设置`
    });

  } catch (error) {
    console.error('批量更新设置错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '批量更新设置失败'
    });
  }
};

/**
 * 删除设置项
 */
const deleteSetting = async (req, res) => {
  try {
    const { group, key } = req.params;

    // 检查设置项是否存在
    const existingSetting = await query(
      'SELECT * FROM settings WHERE group_name = ? AND key_name = ?',
      [group, key]
    );

    if (existingSetting.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '设置项不存在'
      });
    }

    // 删除设置项
    await query(
      'DELETE FROM settings WHERE group_name = ? AND key_name = ?',
      [group, key]
    );

    // 记录活动日志
    await logAdminActivity(req, 'delete', 'setting', existingSetting[0].id, `删除设置项: ${group}.${key}`);

    res.json({
      message: '设置项删除成功'
    });

  } catch (error) {
    console.error('删除设置项错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '删除设置项失败'
    });
  }
};

/**
 * 获取设置分组列表
 */
const getSettingGroups = async (req, res) => {
  try {
    const groupsResult = await query(`
      SELECT 
        group_name,
        COUNT(*) as setting_count,
        MAX(updated_at) as last_updated
      FROM settings 
      GROUP BY group_name 
      ORDER BY group_name
    `);

    res.json({
      groups: groupsResult
    });

  } catch (error) {
    console.error('获取设置分组错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '获取设置分组失败'
    });
  }
};

/**
 * 重置设置为默认值
 */
const resetToDefaults = async (req, res) => {
  try {
    const { group } = req.params;

    // 默认设置
    const defaultSettings = {
      site: {
        title: '个人博客',
        description: '分享技术与生活的个人博客',
        keywords: '博客,技术,生活,分享',
        author: '博主'
      },
      contact: {
        email: 'contact@blog.com'
      },
      social: {
        github: '',
        twitter: ''
      }
    };

    if (!defaultSettings[group]) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '不支持的设置分组'
      });
    }

    // 删除现有设置
    await query('DELETE FROM settings WHERE group_name = ?', [group]);

    // 插入默认设置
    const settings = defaultSettings[group];
    for (const [key, value] of Object.entries(settings)) {
      await query(
        'INSERT INTO settings (group_name, key_name, value) VALUES (?, ?, ?)',
        [group, key, value]
      );
    }

    // 记录活动日志
    await logAdminActivity(req, 'reset', 'setting', null, `重置设置分组: ${group}`);

    res.json({
      message: `设置分组 "${group}" 已重置为默认值`
    });

  } catch (error) {
    console.error('重置设置错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '重置设置失败'
    });
  }
};

module.exports = {
  getSettings,
  getSettingsByGroup,
  getSetting,
  updateSetting,
  batchUpdateSettings,
  deleteSetting,
  getSettingGroups,
  resetToDefaults
};
