// src/utils/analyzeGacha.ts

export interface GachaLogItem {
  id: string;
  uid?: string;
  gacha_type: string;
  name: string;
  rank_type: string;
  time: string;
}

export interface GachaAnalysis {
  total: number;
  fiveStarCount: number;
  averagePity: number;
  fiveStarDetails: {
    name: string;
    count: number;
    pulls: number[];
  }[];
}

/**
 * 对日志进行分析，统计出五星角色的平均间隔、各角色的五星次数、各角色的五星间隔分布
 * @param logsInput 日志数组
 * @returns 分析结果
 */
export function analyzeGachaLogs(logsInput: any): GachaAnalysis {
  // 如果 logsInput 不是数组，就改为空数组
  const logs: GachaLogItem[] = Array.isArray(logsInput)
    ? logsInput
    : [];

  const total = logs.length;
  // 只保留五星
  const fiveStarLogs = logs.filter(log => log.rank_type === '5');

  let pullsSinceLast = 0;
  const pityList: number[] = [];
  const detailMap: Map<string, { count: number; pulls: number[] }> = new Map();

  for (const log of logs) {
    pullsSinceLast++;
    if (log.rank_type === '5') {
      // 本次五星间隔
      pityList.push(pullsSinceLast);

      // 更新该角色/光锥的计数
      const entry = detailMap.get(log.name) || { count: 0, pulls: [] };
      entry.count++;
      entry.pulls.push(pullsSinceLast);
      detailMap.set(log.name, entry);

      pullsSinceLast = 0;
    }
  }

  const fiveStarCount = fiveStarLogs.length;
  const averagePity =
    pityList.length > 0
      ? Math.round(pityList.reduce((sum, v) => sum + v, 0) / pityList.length)
      : 0;

  const fiveStarDetails = Array.from(detailMap.entries()).map(
    ([name, { count, pulls }]) => ({ name, count, pulls }),
  );

  return {
    total,
    fiveStarCount,
    averagePity,
    fiveStarDetails,
  };
}
