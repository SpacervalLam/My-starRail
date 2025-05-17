import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { GachaLog } from './gacha/entities/gacha-log.entity';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // 在 Electron 渲染进程里 fetch 不能使用 https，要开启 CORS
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    },
  });

  // 全局管道：启用类验证
  app.useGlobalPipes(new ValidationPipe());

  // 监听端口，优先读取环境变量 PORT，否则默认 3168
  const port = process.env.PORT ?? 3168;
  app.setGlobalPrefix('api'); // 设置全局前缀
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);

  // 数据库初始化检查
  const dataSource = app.get(DataSource);
  try {
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS gacha_log (
        id INTEGER PRIMARY KEY,
        uid TEXT NOT NULL,
        gacha_type TEXT NOT NULL,
        timestamp DATETIME NOT NULL
      );
    `);
    console.log('gacha_log 表检查/创建完成');
  } catch (err) {
    console.error('初始化数据库表失败：', err);
  }
}

// 直接用 `node dist/main.js` 调试时会进来执行
if (require.main === module) {
  bootstrap().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
