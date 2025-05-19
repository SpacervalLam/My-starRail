import { Module } from '@nestjs/common';
import { HealthController } from './gacha/gacha.controller';
import { EnkaController } from './enka/enka.controller';
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
    EnkaController,
  ],
  providers: [],
})



export class AppModule { }


