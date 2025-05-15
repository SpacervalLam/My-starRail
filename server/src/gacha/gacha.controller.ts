import {
  Controller,
  Post,
  Get,
  Query,
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
  async refreshLogs(): Promise<{ success: boolean }> {
    try {
      await this.gachaService.fetchAndStoreLogs();
      return { success: true };
    } catch (err: any) {
      throw new InternalServerErrorException(
        `刷新抽卡记录失败：${err.message}`,
      );
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
      throw new BadRequestException('查询参数 uid 为必填项');
    }
    return this.gachaService.getLogsFromDb(uid, pool);
  }
}

  // /**
  //  * GET /gacha/url
  //  * 仅返回从本地缓存或日志中提取到的抽卡记录基础 URL。
  //  * 如果提取失败，GachaService.getGachaUrl() 会抛 BadRequestException，由框架统一返回 400。
  //  */
  // @Get('url')
  // getGachaUrl(): { url: string } {
  //   // 如果无法提取 URL，service 内部会抛出 BadRequestException
  //   const url = this.gachaService.getGachaUrl();
  //   return { url };
  // }



//   /**
//    * POST /gacha/fetch
//    * 自动提取 URL 并分池、分页抓取抽卡记录
//    * 返回格式：{ [gacha_type: string]: GachaLogItem[] }
//    */
//   @Post('fetch')
//   async fetchLogs(): Promise<Record<string, any[]>> {
//     try {
//       // fetchAllLogs 已经返回 Record<string, any[]>
//       const result = await this.gachaService.fetchAllLogs();
//       return result;
//     } catch (err: any) {
//       throw new BadRequestException(err.message || '抓取抽卡日志失败');
//     }
//   }
// }
