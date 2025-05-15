import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GachaModule } from './gacha/gacha.module';
import { GachaLog } from './gacha/entities/gacha-log.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'data/gacha.sqlite',   // 本地文件
      entities: [GachaLog],
      synchronize: true,                // 开发时自动同步
    }),
    GachaModule,
  ],
})
export class AppModule {}
