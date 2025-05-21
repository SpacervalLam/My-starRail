import { Controller, Post, Get, Query, Body, BadRequestException, HttpException } from '@nestjs/common';
import { isAxiosError } from 'axios';
import { ZZZService } from './zzz.service';
import { ZZZData } from './entities/zzz-data.entity';

@Controller('zzz')
export class ZZZController {
  constructor(private readonly zzzService: ZZZService) { }

  @Post('refresh')
  async refreshData(@Body() body: { uid: string }) {
    const { uid } = body;
    if (!uid) throw new BadRequestException('uid is required');
    try {
      await this.zzzService.fetchAndStoreData(uid);
      return { success: true };
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response) {
        const status = err.response.status;
        const msg = err.response.data?.message || err.message;
        throw new HttpException(msg, status);
      }
      throw new BadRequestException('数据刷新失败');
    }
  }

  @Get('data')
  async getData(@Query('uid') uid: string): Promise<ZZZData> {
    if (!uid) throw new BadRequestException('uid is required');
    const data = await this.zzzService.getDataFromDb(uid);
    if (!data) throw new BadRequestException('数据不存在');
    return data;
  }

  @Get('uids')
  async getUids(): Promise<string[]> {
    return this.zzzService.getAllUids();
  }
}
