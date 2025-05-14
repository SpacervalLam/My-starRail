import { Controller, Get, Post, BadRequestException } from '@nestjs/common';
import { GachaService } from './gacha.service';

@Controller('gacha')
export class GachaController {
  constructor(private readonly gachaService: GachaService) {}

  /**
   * GET /gacha/url
   * 仅返回从本地缓存或日志中提取到的抽卡记录基础 URL。
   * 如果提取失败，GachaService.getGachaUrl() 会抛 BadRequestException，由框架统一返回 400。
   */
  @Get('url')
  getGachaUrl(): { url: string } {
    // 如果无法提取 URL，service 内部会抛出 BadRequestException
    const url = this.gachaService.getGachaUrl();
    return { url };
  }

  /**
   * POST /gacha/fetch
   * 一步到位：自动从本地缓存或日志中提取 URL，分页抓取所有抽卡记录并返回。
   */
  @Post('fetch')
  async fetchLogs(): Promise<{ total: number; logs: any[] }> {
    try {
      const logs = await this.gachaService.fetchAllLogs();
      return { total: logs.length, logs };
    } catch (error: any) {
      // 将 service 抛出的错误或网络请求错误封装为 BadRequest
      throw new BadRequestException(error.message || '抓取抽卡日志失败');
    }
  }
}
