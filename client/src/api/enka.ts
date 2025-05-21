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

});

api.interceptors.response.use(
  res => res,
  (error: AxiosError) => {
    const status = error.response?.status ?? 0;
    const messages: Record<number, string> = {
      400: 'UID格式不正确，请检查后重试',
      404: '玩家不存在或未公开角色信息',
      424: '游戏正在维护中，请稍后再试',
      429: '请求过于频繁，请30分钟后重试',
      500: '服务器内部错误，请联系客服',
      503: '服务暂时不可用，请稍后再试',
      504: '请求超时，请检查网络后重试'
    };
    const msg = messages[status] ?? `服务异常，错误码: ${status}`;
    return Promise.reject(new Error(msg));
  }
);

export async function getCachedData(uid: string): Promise<EnkaData> {
  try {
    const res = await api.get<EnkaData>(`genshin/data`, { params: { uid } });
    return res.data;
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const code = e.response?.status ?? 0;
      throw e;
    }
    console.error('获取缓存数据时发生未知错误:', e);
    throw new ApiError('未知错误', 0);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}


export async function fetchGenshinData(uid: string): Promise<EnkaData> {
  await api.post('genshin/refresh', { uid });
  for (let i = 0; i < 3; i++) {
    try {
      const resp = await api.get<EnkaData>('genshin/data', { params: { uid } });
      return resp.data;
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 400) {
        // 等 500ms 再试
        await sleep(500);
        continue;
      }
      throw e;
    }
  }
  throw new ApiError('多次获取数据失败，请稍后重试', 500);
}

export async function fetchAllUids(): Promise<string[]> {
  try {
    const res = await api.get<ApiResponse<string[]>>('genshin/uids');
    return res.data.data;
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const code = e.response?.status ?? 0;
      throw e;
    }
    console.error('获取UID列表时发生未知错误:', e);
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
      throw e;
    }
    console.error('获取ZZZ数据时发生未知错误:', e);
    throw new ApiError('未知错误', 0);
  }
}
