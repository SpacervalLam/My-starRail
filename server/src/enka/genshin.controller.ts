import {
  Controller,
  Post,
  Get,
  Query,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { GenshinService } from './genshin.service';
import { GenshinData } from './entities/genshin-data.entity';

@Controller('genshin')
export class GenshinController {

  constructor(private readonly genshinService: GenshinService) { }

  @Post('refresh')
  async refreshData(@Body() body: { uid: string }): Promise<{ success: boolean; message?: string }> {
    const { uid } = body;
    if (!uid) {
      console.warn('请求缺少必要参数uid');
      throw new BadRequestException('uid is required');
    }

    try {
      await this.genshinService.fetchAndStoreData(uid);
      return { success: true };
    } catch (err: any) {
      console.error(`UID ${uid} 数据刷新失败: ${err.message}`);
      if (err.message.includes('不存在')) {
        throw new BadRequestException(err.message);
      }
      throw new BadRequestException('数据刷新失败');
    }
  }

  @Get('data')
  async getData(@Query('uid') uid: string): Promise<GenshinData> {
    console.log(`收到数据查询请求，UID: ${uid || '未提供'}`);
    if (!uid) {
      console.warn('请求缺少必要参数uid');
      throw new BadRequestException('uid is required');
    }
    console.log(`查询UID ${uid} 的数据`);
    const data = await this.genshinService.getDataFromDb(uid);
    if (!data) {
      console.warn(`UID ${uid} 数据不存在`);
      throw new BadRequestException('UID不存在或未公开信息');
    }
    return data;
  }

  @Get('uids')
  async getUids(): Promise<string[]> {
    console.log('收到UID列表查询请求');
    const uids = await this.genshinService.getAllUids();
    console.log(`返回 ${uids.length} 个UID`);
    return uids;
  }

}
