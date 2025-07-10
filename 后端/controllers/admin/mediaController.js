const { query } = require('../../config/database');
const { logAdminActivity } = require('../../middleware/adminAuth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

// 配置文件上传
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../public/uploads');
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg|pdf|doc|docx|txt|mp4|mp3|wav/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  }
});

/**
 * 获取媒体文件列表
 */
const getMediaFiles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const type = req.query.type; // 可选的文件类型筛选
    const search = req.query.search; // 可选的搜索关键词

    // 构建查询条件
    let whereConditions = [];
    let queryParams = [];

    if (type) {
      whereConditions.push('type LIKE ?');
      queryParams.push(`${type}%`);
    }

    if (search) {
      whereConditions.push('(filename LIKE ? OR originalname LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 获取总数
    const countQuery = `SELECT COUNT(*) as total FROM media ${whereClause}`;
    const countResult = await query(countQuery, queryParams);
    const total = countResult[0].total;

    // 获取媒体文件列表
    const mediaQuery = `
      SELECT id, filename, originalname, url, type, size, dimensions, uploaded_at
      FROM media
      ${whereClause}
      ORDER BY uploaded_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const mediaFiles = await query(mediaQuery, [...queryParams, limit, offset]);

    res.json({
      mediaFiles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('获取媒体文件列表错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '获取媒体文件列表失败'
    });
  }
};

/**
 * 上传媒体文件
 */
const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '没有上传文件'
      });
    }

    const file = req.file;
    const url = `/uploads/${file.filename}`;
    
    // 获取图片尺寸（如果是图片）
    let dimensions = null;
    if (file.mimetype.startsWith('image/')) {
      try {
        const sharp = require('sharp');
        const metadata = await sharp(file.path).metadata();
        dimensions = `${metadata.width}x${metadata.height}`;
      } catch (error) {
        console.warn('获取图片尺寸失败:', error.message);
      }
    }

    // 保存到数据库
    const result = await query(`
      INSERT INTO media (filename, originalname, path, url, type, size, dimensions)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      file.filename,
      file.originalname,
      file.path,
      url,
      file.mimetype,
      file.size,
      dimensions
    ]);

    // 记录活动日志
    await logAdminActivity(req, 'upload', 'media', result.insertId, `上传文件: ${file.originalname}`);

    res.status(201).json({
      message: '文件上传成功',
      media: {
        id: result.insertId,
        filename: file.filename,
        originalname: file.originalname,
        url,
        type: file.mimetype,
        size: file.size,
        dimensions,
        uploaded_at: new Date()
      }
    });

  } catch (error) {
    console.error('上传媒体文件错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '上传文件失败'
    });
  }
};

/**
 * 获取单个媒体文件详情
 */
const getMediaFile = async (req, res) => {
  try {
    const { id } = req.params;

    const mediaResult = await query('SELECT * FROM media WHERE id = ?', [id]);

    if (mediaResult.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '媒体文件不存在'
      });
    }

    res.json({
      media: mediaResult[0]
    });

  } catch (error) {
    console.error('获取媒体文件详情错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '获取媒体文件详情失败'
    });
  }
};

/**
 * 删除媒体文件
 */
const deleteMediaFile = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查媒体文件是否存在
    const mediaResult = await query('SELECT * FROM media WHERE id = ?', [id]);
    if (mediaResult.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '媒体文件不存在'
      });
    }

    const media = mediaResult[0];

    // 检查文件是否被文章使用
    const usageCheck = await query(
      'SELECT COUNT(*) as count FROM articles WHERE cover_image = ? OR content LIKE ?',
      [media.url, `%${media.url}%`]
    );

    if (usageCheck[0].count > 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '该文件正在被文章使用，无法删除'
      });
    }

    // 删除物理文件
    try {
      await fs.unlink(media.path);
    } catch (error) {
      console.warn('删除物理文件失败:', error.message);
    }

    // 从数据库删除记录
    await query('DELETE FROM media WHERE id = ?', [id]);

    // 记录活动日志
    await logAdminActivity(req, 'delete', 'media', id, `删除文件: ${media.originalname}`);

    res.json({
      message: '媒体文件删除成功'
    });

  } catch (error) {
    console.error('删除媒体文件错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '删除媒体文件失败'
    });
  }
};

/**
 * 批量删除媒体文件
 */
const batchDeleteMedia = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '请提供要删除的媒体文件ID列表'
      });
    }

    // 获取要删除的文件信息
    const placeholders = ids.map(() => '?').join(',');
    const mediaFiles = await query(`SELECT * FROM media WHERE id IN (${placeholders})`, ids);

    if (mediaFiles.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: '没有找到要删除的媒体文件'
      });
    }

    // 检查文件是否被使用
    for (const media of mediaFiles) {
      const usageCheck = await query(
        'SELECT COUNT(*) as count FROM articles WHERE cover_image = ? OR content LIKE ?',
        [media.url, `%${media.url}%`]
      );

      if (usageCheck[0].count > 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: `文件 "${media.originalname}" 正在被文章使用，无法删除`
        });
      }
    }

    // 删除物理文件
    for (const media of mediaFiles) {
      try {
        await fs.unlink(media.path);
      } catch (error) {
        console.warn(`删除物理文件失败 ${media.path}:`, error.message);
      }
    }

    // 从数据库删除记录
    await query(`DELETE FROM media WHERE id IN (${placeholders})`, ids);

    // 记录活动日志
    await logAdminActivity(req, 'batch_delete', 'media', null, `批量删除媒体文件，影响文件数: ${mediaFiles.length}`);

    res.json({
      message: `成功删除 ${mediaFiles.length} 个媒体文件`
    });

  } catch (error) {
    console.error('批量删除媒体文件错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '批量删除媒体文件失败'
    });
  }
};

/**
 * 获取未使用的媒体文件
 */
const getUnusedMedia = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // 查找未被使用的媒体文件
    const unusedMediaQuery = `
      SELECT m.*
      FROM media m
      LEFT JOIN articles a1 ON a1.cover_image = m.url
      LEFT JOIN articles a2 ON a2.content LIKE CONCAT('%', m.url, '%')
      WHERE a1.id IS NULL AND a2.id IS NULL
      ORDER BY m.uploaded_at DESC
      LIMIT ? OFFSET ?
    `;

    const unusedMedia = await query(unusedMediaQuery, [limit, offset]);

    // 获取总数
    const countQuery = `
      SELECT COUNT(*) as total
      FROM media m
      LEFT JOIN articles a1 ON a1.cover_image = m.url
      LEFT JOIN articles a2 ON a2.content LIKE CONCAT('%', m.url, '%')
      WHERE a1.id IS NULL AND a2.id IS NULL
    `;
    const countResult = await query(countQuery);
    const total = countResult[0].total;

    res.json({
      unusedMedia,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('获取未使用媒体文件错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '获取未使用媒体文件失败'
    });
  }
};

/**
 * 清理未使用的媒体文件
 */
const cleanupUnusedMedia = async (req, res) => {
  try {
    // 获取所有未使用的媒体文件
    const unusedMediaQuery = `
      SELECT m.*
      FROM media m
      LEFT JOIN articles a1 ON a1.cover_image = m.url
      LEFT JOIN articles a2 ON a2.content LIKE CONCAT('%', m.url, '%')
      WHERE a1.id IS NULL AND a2.id IS NULL
    `;

    const unusedMedia = await query(unusedMediaQuery);

    if (unusedMedia.length === 0) {
      return res.json({
        message: '没有找到未使用的媒体文件'
      });
    }

    // 删除物理文件
    for (const media of unusedMedia) {
      try {
        await fs.unlink(media.path);
      } catch (error) {
        console.warn(`删除物理文件失败 ${media.path}:`, error.message);
      }
    }

    // 从数据库删除记录
    const ids = unusedMedia.map(m => m.id);
    const placeholders = ids.map(() => '?').join(',');
    await query(`DELETE FROM media WHERE id IN (${placeholders})`, ids);

    // 记录活动日志
    await logAdminActivity(req, 'cleanup', 'media', null, `清理未使用媒体文件，清理文件数: ${unusedMedia.length}`);

    res.json({
      message: `成功清理 ${unusedMedia.length} 个未使用的媒体文件`
    });

  } catch (error) {
    console.error('清理未使用媒体文件错误:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '清理未使用媒体文件失败'
    });
  }
};

module.exports = {
  upload,
  getMediaFiles,
  uploadMedia,
  getMediaFile,
  deleteMediaFile,
  batchDeleteMedia,
  getUnusedMedia,
  cleanupUnusedMedia
};
