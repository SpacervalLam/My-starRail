import axios, { AxiosInstance, AxiosError } from 'axios';
import type { EnkaData } from '@/type/genshin';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export class ApiError extends Error {
  public code: number;
  constructor(message: string, code: number) {
    super(message);
    this.code = code;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

const api: AxiosInstance = axios.create({
  baseURL: 'http://localhost:3168/api/',
  headers: { 'Content-Type': 'application/json' },
  timeout: 100000
});

function getErrorMessage(code: number): string {
  const messages: Record<number, string> = {
    400: 'UID 格式不正确。',
    404: '玩家不存在或未公开信息。',
    424: '游戏维护中或更新后服务暂不可用。',
    429: '请求过于频繁，请稍后重试。',
    500: '服务器内部错误，请联系管理员。',
    503: '服务暂时不可用，请稍后再试。',
  };
  return messages[code] ?? '超时';
  ;
}

// 从数据库读取缓存数据
export async function getCachedData(uid: string): Promise<EnkaData> {
  const res = await api.get<EnkaData>(`genshin/data`, { params: { uid } });
  return res.data;
}

export async function fetchGenshinData(uid: string): Promise<EnkaData> {
  try {
    console.log(`Fetching data for ${uid}...`);
    await api.post<ApiResponse<null>>('genshin/refresh', { uid });
    const dataRes = await api.get<EnkaData>('genshin/data', { params: { uid } });
    return dataRes.data;
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const code = e.response?.status ?? 0;
      throw new ApiError(getErrorMessage(code), code);
    }
    throw e;
  }
}

export async function fetchAllUids(): Promise<string[]> {
  try {
    const res = await api.get<ApiResponse<string[]>>('genshin/uids');
    return res.data.data;
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const code = e.response?.status ?? 0;
      throw new ApiError(getErrorMessage(code), code);
    }
    throw e;
  }
}

export async function fetchZZZData(uid: string): Promise<any> {
  try {
    const res = await api.post<ApiResponse<any>>('genshin/zzz', { uid });
    return res.data.data;
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const code = e.response?.status ?? 0;
      throw new ApiError(getErrorMessage(code), code);
    }
    throw e;
  }
}