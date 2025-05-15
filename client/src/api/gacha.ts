// client/src/api/gacha.ts

import axios from 'axios';

const API = axios.create({
  baseURL: '/api', // Vite dev 时代理到后端
});

/**
 * 触发后端拉取最新抽卡记录并存库
 */
export async function refreshGachaLogs(): Promise<void> {
  await API.post('/gacha/refresh');
}

/**
 * 从本地数据库读取已存抽卡记录
 * @param uid 用户的 Genshin UID
 * @param pool 可选的卡池类型（'11'|'12'|'1'|'2'）
 */
export async function fetchGachaLogs(
  uid: string,
  pool?: string
): Promise<Record<string, any[]>> {
  const res = await API.get('/gacha/logs', {
    params: { uid, pool },
  });
  return res.data;
}
