import axios from 'axios';
import { group } from 'console';

const API = axios.create({
  baseURL: 'http://localhost:3168/api/',
});

export async function refreshGachaLogs(uid: string): Promise<void> {
  console.log('发送请求：gacha/refresh', uid);
  await API.post('gacha/refresh', { uid });
}

export async function fetchGachaLogs(uid: string, pool?: string): Promise<Record<string, any[]>> {
  console.log('发送请求：gacha/logs', uid, pool);
  const res = await API.get('gacha/logs', {
    params: { uid, pool },
  });
  const groupedLogs: Record<string, any[]> = res.data.reduce((acc: { [key: string]: any[] }, log: { gacha_type: string }) => {
    const type = log.gacha_type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(log);
    return acc;
  }, {} as Record<string, any[]>);
  return groupedLogs;
}

export async function refreshGachaLogsFromUrl(url: string): Promise<string> {
  console.log('发送请求：gacha/refresh/url', url);
  const res = await API.post('gacha/refresh/url', { url });
  if (!res.data.success) {
    throw new Error(res.data.message || res.data.error || '你不是在乱填吧？');
  }
  return res.data.uid;
}

export async function fetchAllUids(): Promise<string[]> {
  console.log('发送请求：gacha/uids');
  const res = await API.get('gacha/uids');
  return res.data;
}
