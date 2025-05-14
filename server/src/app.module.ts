import { Module } from '@nestjs/common';
import { GachaModule } from './gacha/gacha.module';

@Module({
  imports: [GachaModule],
  controllers: [],
  providers: [],
})
export class AppModule {}