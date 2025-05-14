import { Controller, Get, Post, BadRequestException } from '@nestjs/common';
import { GachaService } from './gacha.service';

@Controller('gacha')
export class GachaController {
  constructor(private readonly gachaService: GachaService) {}

  @Get('url')
  getGachaUrl(): { url: string } {
    const url = this.gachaService.getGachaUrl();
    if (!url) {
      throw new BadRequestException('无法从本地缓存中提取抽卡记录 URL');
    }
    return { url };
  }

  @Post('fetch')
  async fetchLogs(): Promise<{ total: number; logs: any[] }> {
    const baseUrl = this.gachaService.getGachaUrl();
    if (!baseUrl) {
      throw new BadRequestException('无法从本地缓存中提取抽卡记录 URL');
    }
    const logs = await this.gachaService.fetchAllLogs(baseUrl);
    return { total: logs.length, logs };
  }
}