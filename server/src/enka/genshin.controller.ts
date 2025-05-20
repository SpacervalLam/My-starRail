import { Controller, Post, Get, Query, Body, BadRequestException } from '@nestjs/common';
import { GenshinService } from './genshin.service';
import { GenshinData } from './entities/genshin-data.entity';

@Controller('genshin')
export class GenshinController {
  constructor(private readonly genshinService: GenshinService) {}

  @Post('refresh')
  async refreshData(@Body() body: { uid: string }): Promise<{ success: boolean; message?: string }> {
    const { uid } = body;
    if (!uid) {
      throw new BadRequestException('uid is required');
    }
    try {
      const ok = await this.genshinService.fetchAndStoreData(uid);
      console.log(ok ? '数据刷新成功' : '数据刷新失败');
      return { success: true };
    } catch (err) {
      throw new BadRequestException('数据刷新失败');
    }
  }

  @Get('data')
  async getData(@Query('uid') uid: string): Promise<GenshinData> {
    if (!uid) {
      throw new BadRequestException('uid is required');
    }
    const data = await this.genshinService.getDataFromDb(uid);  
    if (!data) {
      console.log('数据不存在');
      throw new BadRequestException('数据不存在');
    }
    console.log('数据获取成功');
    return data;
  }

  @Get('uids')
  async getUids(): Promise<string[]> {
    return this.genshinService.getAllUids();
  }
}