import axios from 'axios';
import { group } from 'console';

// const API = axios.create({
//   baseURL: '/api',
//   headers: {
//     'Content-Type': 'application/json', // 确保所有 POST 请求自动设置 JSON 头
//   },
// });

const API = axios.create({
  baseURL: 'http://localhost:3168/api/',
});

/**
 * 触发后端更新指定用户的抽卡记录
 * @param uid 用户的游戏 UID
 */
export async function refreshGachaLogs(uid: string): Promise<void> {
  console.log('发送请求：gacha/refresh', uid);
  await API.post('gacha/refresh', { uid });
}

/**
 * 从本地数据库读取指定用户的抽卡记录
 * @param uid （必填）用户 UID
 * @param pool （可选）卡池类型
 * @return 一个 Promise，其 resolve 函数返回一个对象，其 key 是卡池名称，value 是该卡池的抽卡记录数组
 */
export async function fetchGachaLogs(
  uid: string,
  pool?: string
): Promise<Record<string, any[]>> {
  console.log('发送请求：gacha/logs', uid, pool);
  const res = await API.get('gacha/logs', {
    params: { uid, pool },
  });
  const groupedLogs: Record<string, any[]> = res.data.reduce((acc: { [x: string]: any[]; }, log: { gacha_type: any; }) => {
    const type = log.gacha_type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(log);
    return acc;
  }, {} as Record<string, any[]>);
  console.log('收到响应：', groupedLogs);
  return groupedLogs;
}

export async function fetchAllUids(): Promise<string[]> {
  console.log('发送请求：gacha/uids');
  const res = await API.get('gacha/uids');
  return res.data;
}