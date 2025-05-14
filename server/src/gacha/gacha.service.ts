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

  /** 获取平台对应的 LocalLow 或等效目录，支持 macOS、Windows 和 WSL */
  private getLocalLowRoot(): string | null {
    const home = os.homedir();
    const platform = process.platform;
    const release = os.release().toLowerCase();
    const isWSL = platform === 'linux' && release.includes('microsoft');

    if (platform === 'win32') {
      console.log('[GetURL] Windows platform');
      return path.join(home, 'AppData', 'LocalLow');
    } else if (platform === 'darwin') {
      console.log('[GetURL] macOS platform');
      return path.join(home, 'Library', 'Logs');
    } else if (isWSL) {
      console.log('[GetURL] WSL detected');
      // WSL 中的家目录映射到 Windows 用户目录
      const winUser = process.env.USER || '';
      const winHome = path.join('/mnt/c/Users', winUser);
      return path.join(winHome, 'AppData', 'LocalLow');
    } else {
      console.log('[GetURL] Unsupported platform');
      return null;
    }
  }

  /** 从日志中提取游戏安装路径 */
  private getGameInstallPath(): string | null {
    const root = this.getLocalLowRoot();
    console.log('[GetURL] LocalLow root:', root);
    if (!root) return null;

    const candidateDirs = ['miHoYo', 'Cognosphere'];
    for (const vendor of candidateDirs) {
      const base = path.join(root, vendor);
      if (!fs.existsSync(base)) {
        console.warn('[GetURL] 未找到目录:', base);
        continue;
      }

      for (const sub of fs.readdirSync(base)) {
        if (/StarRail|崩坏：星穹铁道/i.test(sub)) {
          const tryPaths = [
            path.join(base, sub, 'Player.log'),
            path.join(base, sub, 'Player.txt'),
            path.join(os.homedir(), 'Library', 'Application Support', vendor, sub, 'Player.log'),
            path.join(os.homedir(), 'Library', 'Application Support', vendor, sub, 'Player.txt'),
          ];
          console.log('[GetURL] Try game install path:', tryPaths);
          for (const logPath of tryPaths) {
            if (!fs.existsSync(logPath)) continue;
            const content = fs.readFileSync(logPath, 'utf-8');
            const marker = 'Loading player data from ';
            const idx = content.indexOf(marker);
            if (idx === -1) continue;
            const substr = content.substring(idx + marker.length);
            const endMarker = '/Game/StarRail_Data/data.unity3d';
            const endIdx = substr.indexOf(endMarker);
            if (endIdx === -1) continue;
            const installPath = substr.substring(0, endIdx + '/Game/StarRail_Data/'.length);
            console.log('[GetURL] Found game install path:', installPath);
            return installPath;
          }
        }
      }
    }
    console.warn('[GetURL] 未从日志中找到游戏安装目录');
    return null;
  }

  /** 优先从 webCaches/data_2 中提取 URL */
  private getUrlFromCache(): string | null {
    const installPath = this.getGameInstallPath();
    if (!installPath) return null;

    const wc = path.join(installPath, 'webCaches');
    if (!fs.existsSync(wc)) return null;

    const versions = fs.readdirSync(wc)
      .filter(v => /^\d+\.\d+\.\d+\.\d+$/.test(v))
      .sort()
      .reverse();
    if (versions.length === 0) return null;

    const cacheFile = path.join(wc, versions[0], 'Cache', 'Cache_Data', 'data_2');
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

  /** 回退方案：直接在日志中匹配 URL */
  private getUrlFromLog(): string | null {
    const root = this.getLocalLowRoot();
    if (!root) return null;

    const candidateDirs = ['miHoYo', 'Cognosphere'];
    for (const vendor of candidateDirs) {
      const base = path.join(root, vendor);
      if (!fs.existsSync(base)) continue;

      for (const sub of fs.readdirSync(base)) {
        if (/StarRail|崩坏：星穹铁道/i.test(sub)) {
          const tryPaths = [
            path.join(base, sub, 'Player.log'),
            path.join(base, sub, 'Player.txt'),
            path.join(os.homedir(), 'Library', 'Application Support', vendor, sub, 'Player.log'),
            path.join(os.homedir(), 'Library', 'Application Support', vendor, sub, 'Player.txt'),
          ];
          for (const logPath of tryPaths) {
            if (!fs.existsSync(logPath)) continue;
            const txt = fs.readFileSync(logPath, 'utf-8');
            const match = txt.match(/https?:\/\/[^\s\r\n]+getGachaLog[^\s\r\n]+auth_appid=webview_gacha[^\s\r\n]+/);
            if (match) return match[0];
          }
        }
      }
    }
    return null;
  }

  /** 获取抽卡记录基础 URL */
  public getGachaUrl(): string {
    const url = this.getUrlFromCache() || this.getUrlFromLog();
    if (!url) {
      console.warn('[GetURL] 无法从缓存或日志中提取抽卡记录 URL');
      throw new BadRequestException('无法从本地缓存或日志中提取抽卡记录 URL');
    }
    console.log('[GetURL] Gacha URL:', url);
    return url;
  }

  /** 抓取单页数据 */
  private async fetchPage(url: string) {
    const resp$ = this.httpService.get(url);
    const res = await firstValueFrom(resp$);
    if (res.data?.retcode !== 0) {
      throw new BadRequestException(`抓取失败，retcode=${res.data.retcode}`);
    }
    return res.data.data;
  }

  /** 分页抓取并合并所有抽卡记录 */
  public async fetchAllLogs(pageSize = 20): Promise<any[]> {
    const baseUrl = this.getGachaUrl();

    let page = 1;
    const all: any[] = [];
    while (true) {
      const pagedUrl = `${baseUrl}&page=${page}&size=${pageSize}`;
      const data = await this.fetchPage(pagedUrl);
      const list = data.list ?? [];
      all.push(...list);
      if (list.length < pageSize) break;
      page++;
    }
    return all;
  }
}