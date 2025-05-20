import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenshinController } from './genshin.controller';
import { GenshinService } from './genshin.service';
import { GenshinData } from './entities/genshin-data.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GenshinData])],
  controllers: [GenshinController],
  providers: [GenshinService],
  exports: [GenshinService],
})
export class GenshinModule {}
