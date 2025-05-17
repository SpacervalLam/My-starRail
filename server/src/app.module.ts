import { Module } from '@nestjs/common';
import { HealthController } from './gacha/gacha.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GachaModule } from './gacha/gacha.module';
import { GachaLog } from './gacha/entities/gacha-log.entity';
import * as path from 'path';
import { app } from 'electron';


@Module({
  imports: [
    // 全局数据库连接配置
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: path.join(app.getPath('userData'), 'gacha.sqlite'),
      entities: [GachaLog],
      synchronize: false,
    }),
    GachaModule,
  ],
  controllers: [
    HealthController,
  ],
  providers: [],
})



export class AppModule { }


