// src/utils/analyzeGacha.ts

export interface GachaAnalysis {
  total: number;                // 总抽卡次数
  fiveStarCount: number;        // 五星数量
  fourStarCount: number;        // 四星数量
  fiveStarDetails: {            // 五星详情
    name: string;
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
  // 1. 确保按时间升序
  const logs = Array.isArray(logsInput)
    ? [...logsInput].sort((a, b) => Date.parse(a.time) - Date.parse(b.time))
    : [];

  const total = logs.length;
  let fiveStarCount = 0;
  let fourStarCount = 0;

  // Map 用于统计每个五星角色/光锥
  const fiveStarMap = new Map<
    string,
    { count: number; pulls: number[]; lastTime: string }
  >();

  // pity 相关
  let sinceLast = 0;
  const pityRecords: number[] = [];

  // 时间线
  const timeline = logs.map(log => ({
    time: log.time,
    name: log.name,
    rank: log.rank_type,
  }));

  // 2. 遍历日志，计算各项指标
  for (const log of logs) {
    sinceLast++;

    if (log.rank_type === '5') {
      fiveStarCount++;
      // 推入间隔
      pityRecords.push(sinceLast);

      // 更新详情
      const entry = fiveStarMap.get(log.name) || { count: 0, pulls: [], lastTime: '' };
      entry.count++;
      entry.pulls.push(sinceLast);
      entry.lastTime = log.time;
      fiveStarMap.set(log.name, entry);

      sinceLast = 0; // 重置保底
    } else if (log.rank_type === '4') {
      fourStarCount++;
    }
  }

  // 3. 构造 fiveStarDetails
  const fiveStarDetails = Array.from(fiveStarMap.entries()).map(
    ([name, data]) => ({
      name,
      count: data.count,
      // 按最新到最早排序
      pulls: data.pulls.slice().reverse(),
      lastTime: data.lastTime,
    })
  );

  // 4. 计算 currentPity、maxPity、averagePity
  const currentPity = sinceLast;
  const maxPity =
    pityRecords.length > 0
      ? Math.max(...pityRecords, currentPity)
      : currentPity;
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
    timeline, // 已按升序
  };
}
