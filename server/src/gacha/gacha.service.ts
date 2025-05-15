import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GachaLog } from './entities/gacha-log.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class GachaService {
  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(GachaLog)
    private readonly logRepo: Repository<GachaLog>,
  ) { }

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
        const regex = /Loading player data from\s+([A-Za-z]:[\\/][^\r\n]+?StarRail_Data)[\\/]/i;
        const match = content.match(regex);
        if (match && match[1]) {
          console.log(`Found game install path: ${match[1]}`);
          return match[1] + path.sep;
        }
      }
    }
    console.log('Cannot find game install path');
    return null;
  }

  /** 只保留核心参数并重建基础 URL */
  private sanitizeUrl(rawUrl: string): string {
    const urlObj = new URL(rawUrl);
    const keepKeys = [
      'authkey_ver',
      'sign_type',
      'auth_appid',
      'lang',
      'authkey',
      'game_biz',
      'size'
    ];
    const base = urlObj.origin + urlObj.pathname;
    const params = new URLSearchParams();
    for (const key of keepKeys) {
      const v = urlObj.searchParams.get(key);
      if (v) params.set(key, v);
    }
    return `${base}?${params.toString()}`;
  }

  /** 从缓存文件 data_2 提取 URL */
  private getUrlFromCache(): string | null {
    const installPath = this.getGameInstallPath();
    if (!installPath) return null;
    const wc = path.join(installPath, 'webCaches');
    if (!fs.existsSync(wc)) return null;
    const versions = fs.readdirSync(wc)
      .filter(v => /^\d+\.\d+\.\d+\.\d+$/.test(v))
      .sort().reverse();
    if (!versions.length) return null;
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

  /** 回退：从 Player.log 中用正则匹配 URL */
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
        if (match) return match[0];
      }
    }
    return null;
  }

  /** 获取并 sanitize 基础 URL */
  public getGachaUrl(): string {
    const raw = this.getUrlFromCache() || this.getUrlFromLog();
    if (!raw) {
      throw new BadRequestException('无法提取抽卡记录 URL');
    }
    return this.sanitizeUrl(raw);
  }

  /** 单页抓取 with 重试 */
  private async fetchGachaPage(
    base: string,
    poolKey: string,
    poolName: string,
    page: number,
    size: number,
    endId: string,
    retry = 3
  ) {
    const urlObj = new URL(base);
    urlObj.searchParams.set('gacha_type', poolKey);
    urlObj.searchParams.set('page', String(page));
    urlObj.searchParams.set('size', String(size));
    urlObj.searchParams.set('end_id', endId);
    const url = urlObj.toString();
    try {
      const resp = await firstValueFrom(this.httpService.get(url));
      if (resp.data.retcode !== 0) {
        throw new Error(`retcode=${resp.data.retcode}`);
      }
      console.log(`成功获取 ${poolName} 第 ${page} 页`);
      return resp.data.data;
    } catch (err: any) {
      if (retry > 0) {
        await new Promise(r => setTimeout(r, 500));
        return this.fetchGachaPage(base, poolKey, poolName, page, size, endId, retry - 1);
      }
      console.error(`获取 ${poolName} 第 ${page} 页失败: ${err.message}`);
      throw new BadRequestException(`卡池 ${poolName} 抓取失败: ${err.message}`);
    }
  }

  private async getLatestTimestamp(uid: string, gachaType: string): Promise<string | null> {
    const latestLog = await this.logRepo.findOne({
      where: { uid, gacha_type: gachaType },
      order: { time: 'DESC' },
    });
    return latestLog?.time || null;
  }

  /**
   * 从网络抓取所有记录、存库去重
   */
  public async fetchAndStoreLogs(uid: string): Promise<void> {
    const base = this.getGachaUrl();
    const pools = [
      { key: '11', name: '角色活动跃迁' },
      { key: '12', name: '光锥活动跃迁' },
      { key: '1', name: '常驻跃迁' },
      { key: '2', name: '新手跃迁' },
    ];

    const toInsert: GachaLog[] = [];

    for (const p of pools) {
      const maxTime = await this.getLatestTimestamp(uid, p.key);
      let page = 1;
      let endId = '0';
      let hasMore = true;

      while (hasMore) {
        const data = await this.fetchGachaPage(base, p.key, p.name, page, 20, endId);
        const list = data.list ?? [];
        if (list.length === 0) {
          hasMore = false;
          break;
        }

        let newItems = [];
        for (const item of list) {
          if (item.uid !== uid) {
            console.error(`跳过不属于用户 ${uid} 的记录：${item.id}`);
            continue;
          }

          if (maxTime && item.time <= maxTime) {
            hasMore = false;
            break;
          }
          newItems.push(item);
        }

        if (newItems.length === 0) {
          hasMore = false;
          break;
        }

        newItems.forEach(item => {
          toInsert.push(this.logRepo.create({
            id: item.id,
            uid: item.uid,
            gacha_type: p.key,
            name: item.name,
            rank_type: item.rank_type,
            time: item.time,
          }));
        });

        if (newItems.length < list.length) {
          hasMore = false;
        } else {
          endId = list[list.length - 1].id;
          page++;
        }
      }
    }

    try {
      if (toInsert.length > 0) {
        await this.logRepo
          .createQueryBuilder()
          .insert()
          .values(toInsert)
          .orIgnore()
          .execute();
        console.log(`成功插入 ${toInsert.length} 条新记录`);
      }
    } catch (err) {
      console.error('保存抽卡记录失败:', err);
      throw new InternalServerErrorException('保存抽卡记录失败');
    }
  }

  /**
   * 从数据库查询已存记录
   */
  public async getLogsFromDb(uid: string, poolType?: string): Promise<GachaLog[]> {
    console.log(`从数据库查询 ${uid} 的 ${poolType || '所有'} 抽卡记录`);
    const qb = this.logRepo.createQueryBuilder('log')
      .where('log.uid = :uid', { uid });
    if (poolType) {
      qb.andWhere('log.gacha_type = :pool', { pool: poolType });
    }
    const result = await qb.orderBy('log.time', 'DESC').getMany();
    console.log(`找到 ${result.length} 条记录`);
    console.log('示例记录(最新一条):', result[0]);
    return result;
  }

  public async getAllUids(): Promise<string[]> {
    return this.logRepo
      .createQueryBuilder('log')
      .select('DISTINCT log.uid', 'uid')
      .getRawMany()
      .then(res => res.map(item => item.uid));
  }
}
