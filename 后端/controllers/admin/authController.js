const { query } = require('../../config/database');
const { generateToken, verifyPassword, hashPassword, logAdminActivity } = require('../../middleware/adminAuth');

/**
 * 管理员登录
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证输入
    if (!username || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '用户名和密码不能为空'
      });
    }

    // 查找管理员
    const adminResult = await query(
      'SELECT id, username, password, name, email, avatar FROM admins WHERE username = ?',
      [username]
    );

    if (adminResult.length === 0) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '用户名或密码错误'
      });
    }

    const admin = adminResult[0];

    // 验证密码
    const isPasswordValid = await verifyPassword(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '用户名或密码错误'
      });
    }

    // 更新最后登录时间
    await query(
      'UPDATE admins SET last_login = NOW() WHERE id = ?',
      [admin.id]
    );

    // 生成JWT token
    const token = generateToken(admin.id);

    // 记录登录活动
    await logAdminActivity(req, 'login', 'admin', admin.id, '管理员登录');

    // 返回登录成功信息（不包含密码）
    const { password: _, ...adminInfo } = admin;
    res.json({
      message: '登录成功',
      token,
      admin: adminInfo
    });

  } catch (error) {
    console.error('管理员登录错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '登录过程中发生错误'
    });
  }
};

/**
 * 管理员登出
 */
const logout = async (req, res) => {
  try {
    // 记录登出活动
    await logAdminActivity(req, 'logout', 'admin', req.admin.id, '管理员登出');

    res.json({
      message: '登出成功'
    });
  } catch (error) {
    console.error('管理员登出错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '登出过程中发生错误'
    });
  }
};

/**
 * 获取当前管理员信息
 */
const getProfile = async (req, res) => {
  try {
    const adminResult = await query(
      'SELECT id, username, name, email, avatar, last_login, created_at FROM admins WHERE id = ?',
      [req.admin.id]
    );

    if (adminResult.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '管理员信息不存在'
      });
    }

    res.json({
      admin: adminResult[0]
    });
  } catch (error) {
    console.error('获取管理员信息错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '获取管理员信息失败'
    });
  }
};

/**
 * 更新管理员个人信息
 */
const updateProfile = async (req, res) => {
  try {
    const { name, email, avatar } = req.body;
    const adminId = req.admin.id;

    // 验证邮箱格式
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '邮箱格式不正确'
      });
    }

    // 检查邮箱是否已被其他管理员使用
    if (email) {
      const emailCheck = await query(
        'SELECT id FROM admins WHERE email = ? AND id != ?',
        [email, adminId]
      );
      
      if (emailCheck.length > 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: '该邮箱已被其他管理员使用'
        });
      }
    }

    // 构建更新字段
    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (avatar !== undefined) {
      updateFields.push('avatar = ?');
      updateValues.push(avatar);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '没有提供要更新的字段'
      });
    }

    updateValues.push(adminId);

    // 执行更新
    await query(
      `UPDATE admins SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
      updateValues
    );

    // 记录更新活动
    await logAdminActivity(req, 'update', 'admin', adminId, '更新个人信息');

    // 返回更新后的信息
    const updatedAdmin = await query(
      'SELECT id, username, name, email, avatar, last_login, created_at, updated_at FROM admins WHERE id = ?',
      [adminId]
    );

    res.json({
      message: '个人信息更新成功',
      admin: updatedAdmin[0]
    });

  } catch (error) {
    console.error('更新管理员信息错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '更新个人信息失败'
    });
  }
};

/**
 * 修改密码
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.admin.id;

    // 验证输入
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '当前密码和新密码不能为空'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '新密码长度不能少于6位'
      });
    }

    // 获取当前密码
    const adminResult = await query(
      'SELECT password FROM admins WHERE id = ?',
      [adminId]
    );

    if (adminResult.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '管理员不存在'
      });
    }

    // 验证当前密码
    const isCurrentPasswordValid = await verifyPassword(currentPassword, adminResult[0].password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '当前密码不正确'
      });
    }

    // 加密新密码
    const hashedNewPassword = await hashPassword(newPassword);

    // 更新密码
    await query(
      'UPDATE admins SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedNewPassword, adminId]
    );

    // 记录密码修改活动
    await logAdminActivity(req, 'change_password', 'admin', adminId, '修改密码');

    res.json({
      message: '密码修改成功'
    });

  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '修改密码失败'
    });
  }
};

/**
 * 获取活动日志
 */
const getActivityLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // 获取总数
    const countResult = await query('SELECT COUNT(*) as total FROM activity_logs');
    const total = countResult[0].total;

    // 获取日志列表
    const logs = await query(
      'SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('获取活动日志错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '获取活动日志失败'
    });
  }
};

module.exports = {
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  getActivityLogs
};
