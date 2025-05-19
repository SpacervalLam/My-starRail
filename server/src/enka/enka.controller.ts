import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { fetchGenshinData } from './genshin';
import { fetchZZZData } from './zzz';

@Controller('enka')
export class EnkaController {
  @Post('genshin')
  async getGenshinData(@Body() body: { uid: string }) {
    if (!/^\d{9}$/.test(body.uid)) {
      throw new BadRequestException('Invalid UID format');
    }
    const data = await fetchGenshinData(body.uid);
    return {
      success: !!data,
      data
    };
  }

  @Post('genshin/fcva')
  async getGenshinFCVaData(@Body() body: { uid: string }) {
    if (!/^\d{9}$/.test(body.uid)) {
      throw new BadRequestException('Invalid UID format');
    }
    // 暂时使用zzz数据作为FCVa实现
    const data = await fetchZZZData(body.uid);
    return {
      success: !!data,
      data,
      message: 'FCVa功能暂未实现，返回ZZZ数据作为示例'
    };
  }
}
