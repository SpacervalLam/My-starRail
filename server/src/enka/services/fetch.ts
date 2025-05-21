import axios, { AxiosResponse } from 'axios';
import { EnkaData } from '../entities/type/genshin';
import { ZZZPlayerData } from '../entities/type/zzz';

const ENKA_API = 'https://enka.network/api/uid';
const MICROGG_API = 'https://profile.microgg.cn/api/uid';
const ZZZ_API = 'https://enka.network/api/zzz/uid';

export async function fetchGenshinData(uid: string): Promise<EnkaData | null> {
  const apiBase = ['1', '2', '5'].includes(uid.charAt(0)) ? MICROGG_API : ENKA_API;
  const url = `${apiBase}/${uid}/`;
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
    if (axios.isAxiosError(error)) {
      if (error.response?.status) {
        throw error; // Propagate the error with status code
      }
      throw new Error('Network error');
    }
    throw new Error('Unknown error');
  }
}

export async function fetchZZZData(uid: string): Promise<ZZZPlayerData | null> {
  const url = `${ZZZ_API}/${uid}/`;
  console.log(`Fetching ZZZ data for UID ${uid} from ${url}`);
  try {
    const response: AxiosResponse<ZZZPlayerData> = await axios.get(url, {
      headers: { 
        'User-Agent': 'ZZZApp/1.0',
        'Accept-Language': 'zh-CN'
      },
    });
    
    // Transform response to match our type structure
    const data: ZZZPlayerData = {
      PlayerInfo: response.data.PlayerInfo,
      uid: response.data.uid,
      ttl: response.data.ttl
    };
    
    console.log(`ZZZ data for UID ${uid} fetched successfully`);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        console.log(`UID ${uid} not found for ZZZ data`);
        console.error(`UID ${uid} 不存在或未公开信息`);
      } else {
        console.error(`HTTP 错误: ${error.response?.status} - ${error.message}`);
      }
    } else {
      console.error('请求失败:', error);
    }
    if (axios.isAxiosError(error)) {
      if (error.response?.status) {
        throw error;
      }
      throw new Error('Network error');
    }
    throw new Error('Unknown error');
  }
}
