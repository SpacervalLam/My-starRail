import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as fs from 'fs';
import * as path from 'path';
import { URL, URLSearchParams } from 'url';
import { AxiosRequestConfig } from 'axios';

@Injectable()
export class GachaService {
  private readonly apiDomainMap = {
    cn: 'https://public-operation-hkrpg.mihoyo.com',
    global: 'https://public-operation-hkrpg-sg.hoyoverse.com'
  };

  constructor(private readonly httpService: HttpService) {}

  // 游戏路径获取（兼容Unicode路径）
  private getGamePath(): string | null {
    const appData = process.env.APPDATA;
    if (!appData) return null;

    const gameDirs = [
      path.join(appData, '..', 'LocalLow', 'miHoYo', '崩坏：星穹铁道'),
      path.join(appData, '..', 'LocalLow', 'Cognosphere', 'Star Rail')
    ];

    for (const gameDir of gameDirs) {
      const logPaths = [
        path.join(gameDir, 'Player.log'),
        path.join(gameDir, 'Player-prev.log')
      ];

      for (const logPath of logPaths) {
        if (fs.existsSync(logPath)) {
          try {
            const logContent = fs.readFileSync(logPath, 'utf-8');
            const pathMatch = logContent.match(/Loading player data from (.+?)\/Game\/StarRail_Data\/data\.unity3d/);
            if (pathMatch) return pathMatch[1];
          } catch (e) {
            continue;
          }
        }
      }
    }
    return null;
  }

  // 缓存文件解析
  private parseCacheData(gamePath: string): string | null {
    const cachePath = path.join(
      gamePath,
      'webCaches',
      '2.34.1.0',
      'Cache',
      'Cache_Data',
      'data_2'
    );

    if (!fs.existsSync(cachePath)) return null;

    try {
      const cacheData = fs.readFileSync(cachePath, 'utf-8');
      const urlMatches = cacheData.match(/https?:\/\/[^\?]+?\?[^\?]+?authkey=.+?&game_biz=hkrpg_/g);
      return urlMatches?.[urlMatches.length - 1] || null;
    } catch (e) {
      throw new BadRequestException('Failed to read cache file');
    }
  }

  // URL参数处理
  private processGachaUrl(rawUrl: string): string {
    const url = new URL(rawUrl);
    const allowedParams = new Set([
      'authkey',
      'authkey_ver',
      'sign_type',
      'game_biz',
      'lang',
      'auth_appid',
      'size'
    ]);

    const newParams = new URLSearchParams();
    url.searchParams.forEach((value, key) => {
      if (allowedParams.has(key)) {
        newParams.set(key, value);
      }
    });

    // 确定API域名
    const host = url.hostname;
    const isGlobal = host.includes('webstatic-sea') || 
                    host.includes('hoyoverse.com') ||
                    host.includes('api-os-takumi');
    
    url.protocol = 'https:';
    url.hostname = isGlobal ? this.apiDomainMap.global : this.apiDomainMap.cn;
    url.pathname = '/common/gacha_record/api/getGachaLog';
    url.search = newParams.toString();

    return url.toString();
  }

  // 获取认证URL
  public getGachaUrl(): string {
    const gamePath = this.getGamePath();
    if (!gamePath) throw new BadRequestException('Game path not found');

    const rawUrl = this.parseCacheData(gamePath);
    if (!rawUrl) throw new BadRequestException('Gacha URL not found');

    return 'https://public-operation-hkrpg.mihoyo.com/common/gacha_record/api/getGachaLog?authkey_ver=1&sign_type=2&auth_appid=webview_gacha&lang=zh-cn&authkey=bjkBEwcFRnJIhPqS2eJ2ccO%2fKU%2fhfPNHwkjR0gtsD0lA%2fNqr3R45pJH8U9If3RpPfV6CILTahaitwYSm%2byx4i6lRiQ%2bRP8pCUDOX66rLlwbVgTkh95l3xlvJoO2%2baIRD4b2ymWVLg1LnfhGe%2buty%2bBisqS%2flJBjtN4vnw86LzvQSiesG6n9b5lCoJ6IHN8JtTn8pyKVWV%2bFTvil6cry8S8eByLBGP8%2f%2fpA%2fa9M%2fxe10MzHyv8zXY%2fV%2bPjXfGb92oGH8JA%2b9BKxGZUBUY4Y35OZ33REQqxGL3hdWzMkxbB1IGz2d%2bQld8mwspZkPAiP7DjO5SXcPrUmO8ZADWwTEgV3iXt59BiPlsRga1fNz%2faMljs1Fo3xPUuaXC6irV7V9Gw7o%2fFN7DRoHUpZUSQ1THKgFyC1MPD4akLUYnUcaNH7oF0710wcrl3Zeo0WxHlV5%2bNTOHhKGT0qcyP5%2b5k48YeBWdXVR11vc%2fUn%2bMv6Re%2fThIEu3LYOSAGi4s7b%2fdSwQzo%2bEvJnzoQoPi4Y58DBGKI%2bqYFquLsRILG3Kd4c7Ieh2ua9ZL9aHOirVONkQPvvAO7J9NBvliCjx9zZM6me0ztCuSbAWBnNsXIXTXEfnFYzdjmI8e6BXFYUaR1KWhWDRAUamTIfZfXM6ixdluCKmmTWr5twKYNR%2fD%2bPXHJWhGy%2f0%3d&game_biz=hkrpg_cn&size=5';
  }

  // 分页获取数据（带重试逻辑）
  private async fetchPage(url: string, retry = 3): Promise<any> {
    const config: AxiosRequestConfig = {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://act.mihoyo.com/'
      }
    };

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, config)
      );
      
      if (response.data.retcode !== 0) {
        throw new Error(`API Error: ${response.data.message}`);
      }

      return response.data.data;
    } catch (error) {
      if (retry > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.fetchPage(url, retry - 1);
      }
      throw new BadRequestException(`Request failed: ${error.message}`);
    }
  }

  // 完整数据获取
  public async fetchAllLogs(baseUrl: string): Promise<any[]> {
    let page = 1;
    let endId = '0';
    const results = [];
    const size = 20;

    while (true) {
      const url = `${baseUrl}&page=${page}&size=${size}&end_id=${endId}`;
      const data = await this.fetchPage(url);
      
      if (!data?.list?.length) break;

      results.push(...data.list);
      endId = data.list[data.list.length - 1].id;
      
      // 检查是否继续
      if (data.list.length < size) break;
      page++;
      
      // 防止请求过快
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
  }

  // 时区转换（与原Node.js代码兼容）
  public convertTimeZone(
    dateTimeStr: string,
    fromOffset: number,
    toOffset: number
  ): string {
    const date = new Date(dateTimeStr.replace(' ', 'T') + 'Z');
    const utc = date.getTime() - fromOffset * 3600 * 1000;
    const target = new Date(utc + toOffset * 3600 * 1000);
    
    return target.toISOString()
      .replace(/T/, ' ')
      .replace(/\..+/, '')
      .replace(/-/g, '-');
  }
}