import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GachaService } from './gacha.service';
import { GachaController } from './gacha.controller';

@Module({
  imports: [HttpModule],
  controllers: [GachaController],
  providers: [GachaService],
})
export class GachaModule {}