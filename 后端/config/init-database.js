const { query, testConnection } = require('./database');

// 创建数据库表的SQL语句
const createTablesSQL = {
  categories: `
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  
  articles: `
    CREATE TABLE IF NOT EXISTS articles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      content LONGTEXT NOT NULL,
      summary TEXT,
      cover_image VARCHAR(255),
      published_at DATETIME NOT NULL,
      view_count INT DEFAULT 0,
      category_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  
  comments: `
    CREATE TABLE IF NOT EXISTS comments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      content TEXT NOT NULL,
      article_id INT,
      author_name VARCHAR(100),
      author_email VARCHAR(150),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  
  subscribers: `
    CREATE TABLE IF NOT EXISTS subscribers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(150) NOT NULL UNIQUE,
      status ENUM('active', 'unsubscribed') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // 管理员表
  admins: `
    CREATE TABLE IF NOT EXISTS admins (
      id INT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(50) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(100),
      email VARCHAR(255) UNIQUE,
      avatar VARCHAR(255),
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // 媒体库表
  media: `
    CREATE TABLE IF NOT EXISTS media (
      id INT PRIMARY KEY AUTO_INCREMENT,
      filename VARCHAR(255) NOT NULL,
      originalname VARCHAR(255) NOT NULL,
      path VARCHAR(500) NOT NULL,
      url VARCHAR(500) NOT NULL,
      type VARCHAR(50) NOT NULL,
      size INT NOT NULL,
      dimensions VARCHAR(20),
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // 站点设置表
  settings: `
    CREATE TABLE IF NOT EXISTS settings (
      id INT PRIMARY KEY AUTO_INCREMENT,
      group_name VARCHAR(50) NOT NULL,
      key_name VARCHAR(100) NOT NULL,
      value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_setting (group_name, key_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // 活动日志表
  activity_logs: `
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INT PRIMARY KEY AUTO_INCREMENT,
      action VARCHAR(100) NOT NULL,
      resource_type VARCHAR(50),
      resource_id INT,
      details TEXT,
      ip_address VARCHAR(50),
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `
};

// 修改现有表结构的SQL语句
const alterTablesSQL = [
  // 修改评论表，添加状态和IP地址字段
  `ALTER TABLE comments
   ADD COLUMN status VARCHAR(20) DEFAULT 'pending'`,

  `ALTER TABLE comments
   ADD COLUMN ip_address VARCHAR(50)`,

  // 修改文章表，添加状态字段
  `ALTER TABLE articles
   ADD COLUMN status VARCHAR(20) DEFAULT 'published'`
];

// 初始化数据
const initData = {
  categories: [
    { name: '设计资源', description: '设计相关的文章和资源分享' },
    { name: '前端开发', description: '前端技术、框架和最佳实践' },
    { name: '人工智能', description: 'AI技术和应用案例分享' },
    { name: '生活随笔', description: '生活感悟和个人思考' }
  ],

  // 默认管理员账户 (密码: admin123)
  admin: {
    username: 'admin',
    password: '$2b$10$3P.8K8OGtNwIpm1Q2ibbbu8IkwGPcWQoWLB5QWLMQ5So3LH6US13O', // bcrypt hash of 'admin123'
    name: '超级管理员',
    email: 'admin@blog.com'
  },

  // 默认站点设置
  settings: [
    { group_name: 'site', key_name: 'title', value: '个人博客' },
    { group_name: 'site', key_name: 'description', value: '分享技术与生活的个人博客' },
    { group_name: 'site', key_name: 'keywords', value: '博客,技术,生活,分享' },
    { group_name: 'site', key_name: 'author', value: '博主' },
    { group_name: 'contact', key_name: 'email', value: 'contact@blog.com' },
    { group_name: 'social', key_name: 'github', value: '' },
    { group_name: 'social', key_name: 'twitter', value: '' }
  ]
};

// 初始化数据库
async function initDatabase() {
  try {
    console.log('🚀 开始初始化数据库...');
    
    // 测试连接
    const connected = await testConnection();
    if (!connected) {
      throw new Error('数据库连接失败');
    }
    
    // 创建表
    console.log('📝 创建数据库表...');
    for (const [tableName, sql] of Object.entries(createTablesSQL)) {
      await query(sql);
      console.log(`✅ 表 ${tableName} 创建成功`);
    }

    // 修改现有表结构
    console.log('🔧 修改现有表结构...');
    for (const sql of alterTablesSQL) {
      try {
        await query(sql);
      } catch (error) {
        // 忽略字段已存在的错误
        if (!error.message.includes('Duplicate column name')) {
          console.warn('⚠️ 表结构修改警告:', error.message);
        }
      }
    }
    console.log('✅ 表结构修改完成');

    // 检查是否需要插入初始数据
    const categoryCount = await query('SELECT COUNT(*) as count FROM categories');
    if (categoryCount[0].count === 0) {
      console.log('📊 插入初始数据...');

      // 插入分类数据
      for (const category of initData.categories) {
        await query(
          'INSERT INTO categories (name, description) VALUES (?, ?)',
          [category.name, category.description]
        );
      }
      console.log('✅ 初始分类数据插入成功');
    }

    // 检查是否需要插入管理员数据
    const adminCount = await query('SELECT COUNT(*) as count FROM admins');
    if (adminCount[0].count === 0) {
      console.log('👤 插入默认管理员账户...');
      await query(
        'INSERT INTO admins (username, password, name, email) VALUES (?, ?, ?, ?)',
        [initData.admin.username, initData.admin.password, initData.admin.name, initData.admin.email]
      );
      console.log('✅ 默认管理员账户创建成功 (用户名: admin, 密码: admin123)');
    }

    // 检查是否需要插入站点设置
    const settingsCount = await query('SELECT COUNT(*) as count FROM settings');
    if (settingsCount[0].count === 0) {
      console.log('⚙️ 插入默认站点设置...');
      for (const setting of initData.settings) {
        await query(
          'INSERT INTO settings (group_name, key_name, value) VALUES (?, ?, ?)',
          [setting.group_name, setting.key_name, setting.value]
        );
      }
      console.log('✅ 默认站点设置插入成功');
    }
    
    console.log('🎉 数据库初始化完成！');
    return true;
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    return false;
  }
}

// 如果直接运行此文件，则执行初始化
if (require.main === module) {
  initDatabase().then(() => {
    process.exit(0);
  }).catch(() => {
    process.exit(1);
  });
}

module.exports = { initDatabase };
