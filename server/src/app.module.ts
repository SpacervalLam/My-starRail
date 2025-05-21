import { Module } from '@nestjs/common';
import { HealthController } from './gacha/gacha.controller';
import { GenshinController } from './enka/genshin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GachaModule } from './gacha/gacha.module';
import { GachaLog } from './gacha/entities/gacha-log.entity';
import { GenshinData } from './enka/entities/genshin-data.entity';
import { ZZZData } from './enka/entities/zzz-data.entity';
import * as path from 'path';
import { app } from 'electron';
import { GenshinModule } from './enka/genshin.module';
import { ZZZModule } from './enka/zzz.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: path.join(app.getPath('userData'), 'gacha.sqlite'),
      entities: [GachaLog, GenshinData, ZZZData],
      synchronize: false,
      retryAttempts: 5,
      retryDelay: 3000,
    }),
    GachaModule,
    GenshinModule,
    ZZZModule,
  ],
  controllers: [
    HealthController,
    GenshinController,
  ],
})
export class AppModule { }