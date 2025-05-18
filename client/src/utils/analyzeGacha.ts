export interface GachaAnalysis {
  total: number;                // 总抽卡次数
  fiveStarCount: number;        // 五星数量
  fourStarCount: number;        // 四星数量
  fiveStarDetails: {            // 五星详情
    name: string;
    item_id: string;
    count: number;
    pulls: number[];            // 每次出货的抽数间隔
    lastTime: string;
  }[];
  currentPity: number;          // 当前保底计数
  maxPity: number;              // 最大抽数间隔
  averagePity: number;          // 平均出货抽数
  timeline: {                   // 抽卡时间线
    time: string;
    name: string;
    rank: string;
  }[];
}

export interface GachaLogItem {
  id: string;
  uid: string;
  item_id: string;
  gacha_type: string;
  name: string;
  rank_type: string;
  time: string;  // ISO 字符串
}

export interface PoolEntry {
  poolId: string;
  logs: GachaLogItem[];
  analysis: GachaAnalysis;
}

export function analyzeGachaLogs(logsInput: GachaLogItem[]): GachaAnalysis {
  // 1. 按时间升序
  const logs = Array.isArray(logsInput)
    ? [...logsInput].sort((a, b) => Date.parse(a.time) - Date.parse(b.time))
    : [];

  const total = logs.length;
  let fiveStarCount = 0;
  let fourStarCount = 0;

  // 2. 用 name 做 key，每个 entry 里带上对应的 item_id
  const fiveStarMap = new Map<
    string,
    { item_id: string; count: number; pulls: number[]; lastTime: string }
  >();

  let sinceLast = 0;
  const pityRecords: number[] = [];

  // 3. 构造时间线
  const timeline = logs.map(log => ({
    time: log.time,
    name: log.name,
    rank: log.rank_type,
  }));

  // 4. 遍历日志
  for (const log of logs) {
    sinceLast++;

    if (log.rank_type === '5') {
      fiveStarCount++;
      pityRecords.push(sinceLast);

      const name = log.name;
      // 如果是第一次见到这个 name，就用当前 log 的 item_id 初始化
      const entry = fiveStarMap.get(name) || {
        item_id: log.item_id,
        count: 0,
        pulls: [],
        lastTime: '',
      };

      entry.count++;
      entry.pulls.push(sinceLast);
      entry.lastTime = log.time;

      fiveStarMap.set(name, entry);
      sinceLast = 0;  // 重置保底
    } else if (log.rank_type === '4') {
      fourStarCount++;
    }
  }

  // 5. 构造 fiveStarDetails，保证 item_id 与 name 一一对应
  const fiveStarDetails = Array.from(fiveStarMap.entries()).map(([name, data]) => ({
    name,
    item_id: data.item_id,
    count: data.count,
    pulls: data.pulls.slice().reverse(),  // 最新到最早
    lastTime: data.lastTime,
  }));

  // 6. 计算 pity 相关指标
  const currentPity = sinceLast;
  const maxPity =
    pityRecords.length > 0 ? Math.max(...pityRecords, currentPity) : currentPity;
  const averagePity =
    pityRecords.length > 0
      ? Math.round(
          (pityRecords.reduce((sum, v) => sum + v, 0) + currentPity) /
            (pityRecords.length + 1)
        )
      : 0;

  return {
    total,
    fiveStarCount,
    fourStarCount,
    fiveStarDetails,
    currentPity,
    maxPity,
    averagePity,
    timeline,
  };
}
