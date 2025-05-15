import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json', // 确保所有 POST 请求自动设置 JSON 头
  },
});

/**
 * 触发后端更新指定用户的抽卡记录
 * @param uid 用户的游戏 UID
 */
export async function refreshGachaLogs(uid: string): Promise<void> {
  await API.post('/gacha/refresh', { uid }); 
}

/**
 * 从本地数据库读取指定用户的抽卡记录
 * @param uid 必填的用户 UID
 * @param pool （可选）卡池类型
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

export async function fetchAllUids(): Promise<string[]> {
  const res = await API.get('/gacha/uids');
  return res.data;
}