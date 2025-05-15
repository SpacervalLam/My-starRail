import {
  Controller,
  Post,
  Get,
  Query,
  Body,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { GachaService } from './gacha.service';
import { GachaLog } from './entities/gacha-log.entity';


@Controller('gacha')
export class GachaController {
  constructor(private readonly gachaService: GachaService) {}

  /**
   * POST /api/gacha/refresh
   * 从网络拉取最新抽卡记录并保存到本地数据库
   */
  @Post('refresh')
  async refreshLogs(@Body() body: { uid: string }): Promise<{ success: boolean }> {
    const { uid } = body;
    if (!uid) {
      throw new BadRequestException('uid 为必填项');
    }
    try {
      await this.gachaService.fetchAndStoreLogs(uid);
      console.log(`刷新 ${uid} 的抽卡记录成功`);
      return { success: true };
    } catch (err: any) {
      console.error(`刷新 ${uid} 的抽卡记录失败：${err.message}`);
      throw new InternalServerErrorException(`刷新抽卡记录失败：${err.message}`);
    }
  }
  /**
   * GET /api/gacha/logs?uid=...&pool=...
   * 从本地数据库读取指定 uid（和可选卡池）的抽卡记录
   */
  @Get('logs')
  async getLogs(
    @Query('uid') uid: string,
    @Query('pool') pool?: string,
  ): Promise<GachaLog[]> {
    if (!uid) {
      console.log('uid is not provided');
      throw new BadRequestException('查询参数 uid 为必填项');
    }
    return this.gachaService.getLogsFromDb(uid, pool);
  }
  
  /**
   * GET /api/gacha/uids
   * 获取本地数据库中所有 uid 的列表
   */
  @Get('uids')
  async getUids(): Promise<string[]> {
    return this.gachaService.getAllUids();
  }
}

