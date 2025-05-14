// server/src/gacha/gacha.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class GachaService {
  constructor(private readonly httpService: HttpService) {}

  /** 根据平台返回 LocalLow 或等效日志根目录 */
  private getLocalLowRoot(): string | null {
    const home = os.homedir();
    if (process.platform === 'win32') {
      return path.join(home, 'AppData', 'LocalLow');
    } else if (process.platform === 'darwin') {
      return path.join(home, 'Library', 'Logs');
    }
    return null;
  }

  /**
   * 从 Player.log 中用正则匹配出实际游戏安装目录
   * 适配日志中 "Loading player data from F:/Star Rail Game/StarRail_Data/data.unity3d"
   */
  private getGameInstallPath(): string | null {
    const root = this.getLocalLowRoot();
    if (!root) return null;

    const vendors = ['miHoYo', 'Cognosphere'];
    for (const vendor of vendors) {
      const vendorDir = path.join(root, vendor);
      if (!fs.existsSync(vendorDir)) continue;

      for (const sub of fs.readdirSync(vendorDir)) {
        if (!/StarRail|崩坏：星穹铁道/i.test(sub)) continue;
        const logFile = path.join(vendorDir, sub, 'Player.log');
        if (!fs.existsSync(logFile)) continue;

        const content = fs.readFileSync(logFile, 'utf-8');
        // 新正则：捕获到 ".../StarRail_Data"
        const regex = /Loading player data from\s+([A-Za-z]:[\\/][^\r\n]+?StarRail_Data)[\\/]/i;
        const match = content.match(regex);
        if (match && match[1]) {
          const installPath = match[1] + path.sep;  // 确保路径尾部带分隔符
          console.log('[GachaService] Found game install path:', installPath);
          return installPath;
        }
      }
    }
    return null;
  }

  /**
   * 确保 authkey 参数被 encodeURIComponent 编码
   */
  private sanitizeUrl(rawUrl: string): string {
    const urlObj = new URL(rawUrl);

    // 白名单：只保留这些原始参数
    const keepKeys = [
      'authkey_ver',
      'sign_type',
      'auth_appid',
      'lang',
      'authkey',
      'game_biz',
      // 如果你的 PowerShell URL 中还有其他参数（比如 size=5），也一并保留：
      'size'
    ];

    // 取出 base path
    const base = urlObj.origin + urlObj.pathname;
    const params = new URLSearchParams();

    // 过滤保留
    for (const key of keepKeys) {
      const v = urlObj.searchParams.get(key);
      if (v) params.set(key, v);
    }

    return `${base}?${params.toString()}`;
  }


  /** 优先从 webCaches/data_2 中提取 URL */
  private getUrlFromCache(): string | null {
    const installPath = this.getGameInstallPath();
    if (!installPath) return null;

    const wc = path.join(installPath, 'webCaches');
    if (!fs.existsSync(wc)) return null;

    const versions = fs
      .readdirSync(wc)
      .filter(v => /^\d+\.\d+\.\d+\.\d+$/.test(v))
      .sort()
      .reverse();
    if (versions.length === 0) return null;

    const cacheFile = path.join(
      wc,
      versions[0],
      'Cache',
      'Cache_Data',
      'data_2',
    );
    if (!fs.existsSync(cacheFile)) return null;

    const raw = fs.readFileSync(cacheFile, 'utf-8');
    const parts = raw.split('1/0/');
    for (let i = parts.length - 1; i >= 0; i--) {
      const ln = parts[i];
      if (ln.startsWith('http') && ln.includes('getGachaLog')) {
        return ln.split('\0')[0];
      }
    }
    return null;
  }

  /** 回退方案：在日志文件中正则匹配 URL */
  private getUrlFromLog(): string | null {
    const root = this.getLocalLowRoot();
    if (!root) return null;

    const vendors = ['miHoYo', 'Cognosphere'];
    for (const vendor of vendors) {
      const vendorDir = path.join(root, vendor);
      if (!fs.existsSync(vendorDir)) continue;

      for (const sub of fs.readdirSync(vendorDir)) {
        if (!/StarRail|崩坏：星穹铁道/i.test(sub)) continue;
        const logFile = path.join(vendorDir, sub, 'Player.log');
        if (!fs.existsSync(logFile)) continue;

        const txt = fs.readFileSync(logFile, 'utf-8');
        const match = txt.match(
          /https?:\/\/[^\s\r\n]+getGachaLog[^\s\r\n]+auth_appid=webview_gacha[^\s\r\n]+/,
        );
        if (match) {
          return match[0];
        }
      }
    }
    return null;
  }

  /** 获取抽卡记录基础 URL */
  public getGachaUrl(): string {
    const url = this.getUrlFromCache() || this.getUrlFromLog();
    if (!url) {
      console.error('[GachaService] Cannot find gacha URL');
      throw new BadRequestException(
        '无法从本地缓存或日志中提取抽卡记录 URL',
      );
    }
    console.log('[GachaService] Gacha URL:', url);
    return this.sanitizeUrl(url);
  }

  /**
   * 分批次、分类型抓取抽卡记录，并按照 UIGF 标准组织返回值
   */
  public async fetchAllLogs(): Promise<Record<string, any[]>> {
    // 基础 URL（已 sanitize）
    const baseUrl = this.getGachaUrl();

    const pools = [
      { key: '11', name: '角色活动跃迁' },
      { key: '12', name: '光锥活动跃迁' },
      { key: '1', name: '常驻跃迁' },
      { key: '2', name: '新手跃迁' },
    ];

    const result: Record<string, any[]> = {};
    for (const pool of pools) {
      const items: any[] = [];
      let page = 1;
      let endId = '0';
      const pageSize = 20;

      while (true) {
        const data = await this.fetchGachaPage(
          baseUrl,
          pool.key,
          pool.name,
          page,
          pageSize,
          endId
        );
        const list = data.list ?? [];
        if (!list.length) break;

        items.push(...list);
        endId = list[list.length - 1].id;
        page++;
      }

      // 按时间正序符合 UIGF 要求
      items.reverse();
      result[pool.key] = items;
    }
    return result;
  }


  /** 
   * 发起单页请求，带重试逻辑 
   */
  private async fetchGachaPage(
    rawUrl: string,
    poolKey: string,
    poolName: string,
    page: number,
    pageSize: number,
    endId: string,
    retry = 3
  ) {
    const urlObj = new URL(rawUrl);

    urlObj.searchParams.set('gacha_type', poolKey);
    urlObj.searchParams.append('page', page.toString());
    urlObj.searchParams.append('size', pageSize.toString());
    urlObj.searchParams.append('end_id', endId);

    const finalUrl = urlObj.toString();

    try {
      const resp = await firstValueFrom(this.httpService.get(finalUrl));
      if (resp.data.retcode !== 0) {
        throw new Error(`retcode=${resp.data.retcode}`);
      }
      console.log(`[GachaService] ${poolName} 抓取成功: page=${page}, size=${pageSize}, end_id=${endId}`);
      return resp.data.data;
    } catch (err: any) {
      if (retry > 0) {
        await new Promise(r => setTimeout(r, 500));
        return this.fetchGachaPage(
          rawUrl, poolKey, poolName,
          page, pageSize, endId, retry - 1
        );
      }
      console.error(`[GachaService] ${poolName} 抓取失败: ${err.message}`);
      throw new BadRequestException(`卡池 ${poolName} 抓取失败: ${err.message}`);
    }
  }

}
