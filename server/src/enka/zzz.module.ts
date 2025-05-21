import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZZZController } from './zzz.controller';
import { ZZZService } from './zzz.service';
import { ZZZData } from './entities/zzz-data.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ZZZData])],
  controllers: [ZZZController],
  providers: [ZZZService],
  exports: [ZZZService],
})
export class ZZZModule {}
