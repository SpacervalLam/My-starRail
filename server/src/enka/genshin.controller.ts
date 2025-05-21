import { Controller, Post, Get, Query, Body, BadRequestException, HttpException } from '@nestjs/common';
import { isAxiosError } from 'axios';
import { GenshinService } from './genshin.service';
import { GenshinData } from './entities/genshin-data.entity';

@Controller('genshin')
export class GenshinController {
  constructor(private readonly genshinService: GenshinService) { }

  @Post('refresh')
  async refreshData(@Body() body: { uid: string }) {
    const { uid } = body;
    if (!uid) throw new BadRequestException('uid is required');
    try {
      const saved = await this.genshinService.fetchAndStoreData(uid);
      return { success: true };
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response) {
        const status = err.response.status;
        // 后端调用 Enka API 返回的 message 可以直接拿来告诉前端
        const msg = err.response.data?.message || err.message;
        throw new HttpException(msg, status);
      }
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
