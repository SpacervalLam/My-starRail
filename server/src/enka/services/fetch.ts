import axios, { AxiosResponse } from 'axios';
import { EnkaData } from '../entities/type/genshin';

const API_BASE = 'https://enka.network/api/uid';

export async function fetchGenshinData(uid: string): Promise<EnkaData | null> {
  const url = `${API_BASE}/${uid}/`;
  console.log(`Fetching data for UID ${uid} from ${url}`);
  try {
    const response: AxiosResponse<EnkaData> = await axios.get(url, {
      headers: { 'User-Agent': 'GenshinApp/1.0' },
    });
    console.log(`Data for UID ${uid} fetched successfully`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        console.log(`UID ${uid} not found on enka.network`);
        console.error(`UID ${uid} 不存在或未公开信息`);
      } else {
        console.error(`HTTP 错误: ${error.response?.status} - ${error.message}`);
      }
    } else {
      console.error('请求失败:', error);
    }
    return null;
  }
}