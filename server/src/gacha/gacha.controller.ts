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

/**
 * Health check controller
 */
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}

/**
 * Gacha controller
 */
@Controller('gacha')
export class GachaController {
  constructor(private readonly gachaService: GachaService) { }

  /**
   * POST /api/gacha/refresh
   * 根据uid从网络拉取最新抽卡记录并保存到本地数据库
   * @param body
   * @returns 
   */
  @Post('refresh')
  async refreshLogs(@Body() body: { uid: string; gameType?: 'starrail' | 'zenless' }): Promise<{ success: boolean }> {
    const { uid, gameType = 'starrail' } = body;
    if (!uid) {
      throw new BadRequestException('uid 为必填项');
    }
    try {
    await this.gachaService.fetchAndStoreLogs(uid, gameType);
      console.log(`刷新 ${uid} 的抽卡记录成功`);
      return { success: true };
    } catch (err: any) {
      console.error(`刷新 ${uid} 的抽卡记录失败：${err.message}`);
      return { success: false };
    }
  }

  /**
   * Post /api/gacha/refresh/url
   * 根据url从网络拉取最新抽卡记录并保存到本地数据库
   * @param body 
   * @returns 
   */
  @Post('refresh/url')
  async refreshLogsByUrl(@Body() body: { url: string; gameType?: 'starrail' | 'zenless' }): Promise<{ success: boolean; uid?: string; message?: string }> {
    const { url, gameType = 'starrail' } = body;
    if (!url) {
      return { success: false, message: 'url 为必填项' };
    }
    try {
      const uid = await this.gachaService.fetchAndStoreLogsByUrl(url, gameType);
      console.log(`通过URL刷新抽卡记录成功，UID: ${uid}`);
      return { success: true, uid };
    } catch (err: any) {
      console.error(`通过URL刷新抽卡记录失败：${err.message}`);
      if (err instanceof BadRequestException) {
        return { success: false, message: '你该不会在乱填？' };
      }
      return { success: false, message: '请检查URL是否正确' };
    }
  }
  
  /**
   * GET /api/gacha/logs?uid=...&pool=...
   * 从本地数据库读取指定 uid 和（可选）卡池的抽卡记录
   */
  @Get('logs')
  async getLogs(
    @Query('uid') uid: string,
    @Query('pool') pool?: string,
  ): Promise<GachaLog[]> {
    console.log(`收到客户端请求：查询 ${uid} 的 ${pool || '所有'} 抽卡记录`);
    if (!uid) {
      console.log('uid is not provided');
      throw new BadRequestException('查询参数 uid 为必填项');
    }
    console.log(`将 ${uid} 的 ${pool || '所有'} 抽卡记录返回给客户端`);
    return this.gachaService.getLogsFromDb(uid, pool);
  }

  /**
   * GET /api/gacha/uids
   * 获取本地数据库中所有 uid 的列表
   */
  @Get('uids')
  async getUids(): Promise<string[]> {
    console.log('将数据库中所有 uid 返回给客户端');
    return this.gachaService.getAllUids();
  }
}

