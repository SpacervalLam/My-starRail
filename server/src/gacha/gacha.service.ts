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
  private getGameInstallPath(gameType: 'starrail' | 'zenless' = 'starrail'): string | null {
    console.log(`从 Player.log 中查找 ${gameType} 安装目录`);
    const root = this.getLocalLowRoot();
    if (!root) return null;

    const vendors = ['miHoYo', 'Cognosphere'];
    const gamePatterns = {
      starrail: /StarRail|崩坏：星穹铁道/i,
      zenless: /ZenlessZoneZero|绝区零/i
    };
    console.log(gamePatterns[gameType]);
    for (const vendor of vendors) {
      const vendorDir = path.join(root, vendor);
      if (!fs.existsSync(vendorDir)) continue;

      for (const sub of fs.readdirSync(vendorDir)) {
        if (!gamePatterns[gameType].test(sub)) continue;
        const logFile = path.join(vendorDir, sub, 'Player.log');
        if (!fs.existsSync(logFile)) continue;

        const content = fs.readFileSync(logFile, 'utf-8');
        const regex = gameType === 'starrail'
          ? /Loading player data from\s+([A-Za-z]:[\\/][^\r\n]+?StarRail_Data)[\\/]/i
          : /Discovering subsystems at path\s+([A-Za-z]:[\\/](?:[^\\/:"*?<>|]+[\\/])*ZenlessZoneZero_Data)(?:[\\/][^\\/\r\n]*)?/i;

        const match = content.match(regex);
        if (match && match[1]) {
          console.log(`找到游戏安装路径: ${match[1]}`);
          return match[1] + path.sep;
        }
      }
    }
    console.log('无法找到游戏安装路径');
    return null;
  }

  /** 只保留核心参数并重建基础 URL */
  private sanitizeUrl(rawUrl: string): string {
    try {
      const urlObj = new URL(rawUrl);
      const gameBiz = urlObj.searchParams.get('game_biz');
      console.log(`game_biz: ${gameBiz}`);

      if (!gameBiz) {
        throw new Error('Missing game_biz parameter');
      }

      // 每个游戏保留的参数列表
      const keepParamsMap: Record<string, string[]> = {
        'hk4e_cn': [ // 原神
          'authkey_ver',
          'sign_type',
          'auth_appid',
          'lang',
          'authkey',
          'game_biz',
          'size'
        ],
        'hkrpg_cn': [ // 星穹铁道
          'authkey_ver',
          'sign_type',
          'auth_appid',
          'lang',
          'authkey',
          'game_biz',
          'size'
        ],
        'nap_cn': [ // 绝区零
          'authkey_ver',
          'sign_type',
          'auth_appid',
          'lang',
          'authkey',
          'game_biz',
          'size'
        ]
      };

      const keepKeys = keepParamsMap[gameBiz];
      if (!keepKeys) {
        throw new Error(`Unsupported game_biz: ${gameBiz}`);
      }

      const base = urlObj.origin + urlObj.pathname;
      const params = new URLSearchParams();

      for (const key of keepKeys) {
        const value = urlObj.searchParams.get(key);
        if (value !== null) {
          params.set(key, value);
        }
      }

      return `${base}?${params.toString()}`;
    } catch (err) {
      console.error(`Invalid URL format: ${rawUrl}`, err);
      throw new BadRequestException('Invalid URL format or unsupported game_biz');
    }
  }

  /** 从缓存文件 data_2 提取 URL */
  private getUrlFromCache(gameType: 'starrail' | 'zenless' = 'starrail'): string | null {
    console.log(`从缓存文件 data_2 中提取 URL`);
    const installPath = this.getGameInstallPath(gameType);
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
  private getUrlFromLog(
    gameType: 'starrail' | 'zenless' = 'starrail'
  ): string | null {
    console.log(`回退，从从 Player.log 中匹配 URL`);
    const root = this.getLocalLowRoot();
    if (!root) return null;
    const vendors = ['miHoYo', 'Cognosphere'];
    const gamePatterns = {
      starrail: /StarRail|崩坏：星穹铁道/i,
      zenless: /ZenlessZoneZero|绝区零/i,
    };

    const zenlessUrlRegex =
      /https?:\/\/[^\s\r\n]+getGachaLog[^\s\r\n]+auth_appid=webview_gacha[^\s\r\n]+/gi;

    const starrailUrlRegex =
      /https?:\/\/[^\s\r\n]+getGachaLog[^\s\r\n]+auth_appid=webview_gacha[^\s\r\n]+/gi;

    for (const vendor of vendors) {
      const vendorDir = path.join(root, vendor);
      if (!fs.existsSync(vendorDir)) continue;
      for (const sub of fs.readdirSync(vendorDir)) {
        if (!gamePatterns[gameType].test(sub)) continue;
        const logFile = path.join(vendorDir, sub, 'Player.log');
        if (!fs.existsSync(logFile)) continue;
        const txt = fs.readFileSync(logFile, 'utf-8');

        const regex = gameType === 'zenless' ? zenlessUrlRegex : starrailUrlRegex;
        let match: RegExpExecArray | null;
        while ((match = regex.exec(txt))) {
          // 找到 URL
          return match[1];
        }
      }
    }
    return null;
  }

  /** 获取并 sanitize 基础 URL */
  private getGachaUrl(url?: string, gameType: 'starrail' | 'zenless' = 'starrail'): string {
    const raw = url || this.getUrlFromCache(gameType) || this.getUrlFromLog(gameType);
    if (!raw) {
      throw new BadRequestException('无法提取抽卡记录 URL');
    }
    return this.sanitizeUrl(raw);
  }

  /** 单页抓取 with 重试 
   * @param base 基础 URL
   * @param poolKey 抽卡池类型
   * @param poolName 抽卡池名称
   * @param page 页码
   * @param size 每页大小
   * @param endId 结束 ID
   * @param retry 重试次数
   * @returns {Promise<{list: any[], uid: string, region: string, region_time_zone: string}>} 抽卡记录列表: {list: any[], uid: string, region: string, region_time_zone: string}
  */
  private async fetchGachaPage(
    base: string,
    poolKey: string,
    poolName: string,
    page: number,
    size: number,
    endId: string,
    retry = 3
  ): Promise<{ list: any[]; uid: string; region: string; region_time_zone: string }> {
    const urlObj = new URL(base);
    urlObj.searchParams.set('gacha_type', poolKey);
    urlObj.searchParams.set('page', String(page));
    urlObj.searchParams.set('size', String(size));
    if (endId) {
      urlObj.searchParams.set('end_id', endId);
    }
    const url = urlObj.toString();
    try {
      const resp = await firstValueFrom(this.httpService.get(url));
      if (resp.data.retcode !== 0) {
        const retcode = resp.data.retcode;
        let errorMsg = `retcode=${retcode}`;
        switch (retcode) {
          case -100:
            errorMsg = '请求参数错误: 检查URL中是否缺少必填参数或参数格式错误';
            break;
          case -101:
            errorMsg = '认证失败: authkey无效/过期，请登录游戏打开抽卡记录页面获取最新的authkey';
            break;
          case -102:
            errorMsg = '账号权限异常或封禁: 请检查账号安全状态';
            break;
          case -103:
            errorMsg = '接口访问频率过高: 请稍后重试';
            break;
          case -104:
            errorMsg = '服务器维护或临时故障: 请稍后重试';
            break;
          case -105:
            errorMsg = '数据解析失败: 可能是游戏版本更新导致';
            break;
          case -106:
            errorMsg = '请求超时: 请检查网络连接';
            break;
          case -107:
            errorMsg = '请求路径错误: 确认接口URL是否更新';
            break;
          case -108:
            errorMsg = '客户端版本过低: 请更新游戏客户端';
            break;
          case -110:
            errorMsg = '系统内部错误: 服务器端异常';
            break;
        }
        console.error(`获取抽卡记录失败: ${errorMsg}`);
        throw new Error(errorMsg);
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
     * 根据 URL 从网络抓取指定记录、存库去重
     */
  public async fetchAndStoreLogsByUrl(url: string, gameType: 'starrail' | 'zenless' = 'starrail'): Promise<string> {
    let base: string;
    try {
      base = this.getGachaUrl(url, gameType);
    } catch (err) {
      throw new BadRequestException('你不是在乱填吧？');
    }

    const pools = gameType === 'zenless' ? [
      { key: '2002', name: '独家频段' },
      { key: '3002', name: '音擎频段' },
      { key: '1001', name: '常驻频段' },
      { key: '5001', name: '邦布频段' }
    ] : [
      { key: '11', name: '角色活动跃迁' },
      { key: '12', name: '光锥活动跃迁' },
      { key: '1', name: '常驻跃迁' },
      { key: '2', name: '新手跃迁' },
    ];

    const toInsert: GachaLog[] = [];
    let uid: string | null = null;

    for (const p of pools) {
      let page = 1;
      let endId = '0';
      let hasMore = true;

      while (hasMore) {
        let fetchResult: any;
        try {
          fetchResult = await this.fetchGachaPage(
            base, p.key, p.name, page, 20, endId
          );
        } catch (err) {
          console.error(`获取 ${p.name} 第 ${page} 页记录失败:`, err);
          break;
        }

        // 安全提取 list
        let list: GachaLog[] = fetchResult.list || [];
        if (list.length === 0) break;

        // For zenless, map rank_type from 2,3,4 to 3,4,5
        if (gameType === 'zenless') {
          list = list.map(item => {
            const rankMap: Record<string, string> = { '2': '3', '3': '4', '4': '5' };
            const rankType = String(item.rank_type);
            return {
              ...item,
              rank_type: rankMap[rankType] || rankType
            };
          });
        }

        // 从首条记录中提取 uid
        const fetchedUid = list[0].uid;
        if (!uid) {
          uid = fetchedUid;
          console.log(`提取到 UID: ${uid}`);
        }

        // 拿到该 UID 在数据库已有的最新时间
        const maxTime = await this.getLatestTimestamp(uid, p.key);

        const newItems: GachaLog[] = [];
        for (const item of list) {
          if (maxTime && item.time <= maxTime) {
            hasMore = false;
            break;
          }
          newItems.push(item);
        }

        if (newItems.length === 0) break;

        // 累积待插入数据
        for (const item of newItems) {
          toInsert.push({
            id: item.id,
            uid: item.uid,
            gacha_type: item.gacha_type,
            name: item.name,
            rank_type: item.rank_type,
            time: item.time,
            item_id: item.item_id,
          });
        }

        if (newItems.length < list.length) {
          hasMore = false;
        } else {
          endId = list[list.length - 1].id;
          page++;
        }
      }
    }

    if (!uid) {
      throw new BadRequestException('无法从记录中提取用户ID');
    }

    try {
      if (toInsert.length) {
        await this.logRepo
          .createQueryBuilder()
          .insert()
          .values(toInsert)
          .orIgnore()
          .execute();
      }
      return uid;
    } catch (err) {
      console.error('保存抽卡记录失败:', err);
      throw new InternalServerErrorException('保存抽卡记录失败');
    }
  }


  /**
   * 根据 UID 从网络抓取所有记录、存库去重
   */
  public async fetchAndStoreLogs(uid: string, gameType: 'starrail' | 'zenless' = 'starrail'): Promise<void> {
    const base = this.getGachaUrl(undefined, gameType);
    const pools = gameType === 'zenless' ? [
      { key: '2002', name: '独家频段' },
      { key: '3002', name: '音擎频段' },
      { key: '1001', name: '常驻频段' },
      { key: '5001', name: '邦布频段' }
    ] : [
      { key: '11', name: '角色活动跃迁' },
      { key: '12', name: '光锥活动跃迁' },
      { key: '1', name: '常驻跃迁' },
      { key: '2', name: '新手跃迁' },
    ];

    const toInsert: GachaLog[] = [];

    for (const p of pools) {
      const maxTime = await this.getLatestTimestamp(uid, p.key);
      console.log(`获取 ${p.name} 记录, 开始时间: ${maxTime || '无限制'}`);
      let page = 1;
      let endId = '0';
      let hasMore = true;

      while (hasMore) {
        const data = await this.fetchGachaPage(base, p.key, p.name, page, 20, endId);
        let list = data.list ?? [];
        if (list.length === 0) {
          hasMore = false;
          break;
        }

        // For zenless, map rank_type from 2,3,4 to 3,4,5
        if (gameType === 'zenless') {
          list = list.map(item => {
            const rankMap: Record<string, string> = { '2': '3', '3': '4', '4': '5' };
            const rankType = String(item.rank_type);
            return {
              ...item,
              rank_type: rankMap[rankType] || rankType
            };
          });
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
            item_id: item.item_id
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
