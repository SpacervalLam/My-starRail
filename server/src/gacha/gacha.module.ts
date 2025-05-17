import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';    

import { GachaService } from './gacha.service';
import { GachaController } from './gacha.controller';
import { GachaLog } from './entities/gacha-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([GachaLog]), 
    HttpModule,
  ],
  providers: [GachaService],
  controllers: [GachaController],
  exports: [GachaService],
})
export class GachaModule {}
