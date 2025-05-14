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
   * 自动提取 URL 并分池、分页抓取抽卡记录
   * 返回格式：{ [gacha_type: string]: GachaLogItem[] }
   */
  @Post('fetch')
  async fetchLogs(): Promise<Record<string, any[]>> {
    try {
      // fetchAllLogs 已经返回 Record<string, any[]>
      const result = await this.gachaService.fetchAllLogs();
      return result;
    } catch (err: any) {
      throw new BadRequestException(err.message || '抓取抽卡日志失败');
    }
  }
}
