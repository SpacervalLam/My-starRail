import axios from 'axios';

interface CustomError extends Error {
  code?: number | string;
}

const API = axios.create({
  baseURL: 'http://localhost:3168/api/',
});

interface Flat {
  nameTextMapHash: string;
  rankLevel: number;
  itemType: string;
  icon: string;
  equipType?: string;
  setId?: number;
  setNameTextMapHash?: string;
}

interface Weapon {
  level: number;
  promoteLevel: number;
  affixMap: Record<string, number>;
}

interface Reliquary {
  level: number;
  mainPropId: number;
  appendPropIdList: number[];
}

export interface Equip {
  itemId: number;
  weapon?: Weapon;
  reliquary?: Reliquary;
  flat: Flat;
}

interface PlayerInfo {
  nickname: string;
  level: number;
  signature: string;
  worldLevel: number;
  nameCardId?: number;
  finishAchievementNum?: number;
  towerFloorIndex?: number;
  towerLevelIndex?: number;
}

interface AvatarInfo {
  avatarId: number;
  propMap: Record<string, { type: number; val: string }>;
  fightPropMap: Record<string, number>;
  equipList: Equip[];
}

export interface GenshinData {
  playerInfo: PlayerInfo;
  avatarInfoList: AvatarInfo[];
}

export interface FCVaData {
  [key: string]: any;
}

export async function fetchGenshinData(uid: string): Promise<GenshinData> {
  try {
    // 先刷新数据
    const refreshRes = await API.post('genshin/refresh', { uid });
    if (!refreshRes.data.success) {
      throw new Error(refreshRes.data.message || '刷新数据失败') as CustomError;
    }

    // 再获取数据
    const res = await API.get('genshin/data', { params: { uid } });
    if (!res.data) {
      throw new Error('获取Genshin数据失败') as CustomError;
    }
    return res.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const error = new Error(getErrorMessage(err.response?.status || 500)) as CustomError;
      error.code = err.response?.status || 500;
      throw error;
    }
    throw err;
  }
}

function getErrorMessage(code: number): string {
  const messages: Record<number, string> = {
    400: 'UID是不是填错了？？',
    404: '玩家不存在（米哈游说的）或未公开信息',
    424: '游戏维护中/更新后服务不可用', 
    429: '别一直点',
    500: '服务器内部错误',
    503: '服务暂时不可用'
  };
  return messages[code] || '获取数据失败';
}

export async function fetchFCVaData(uid: string): Promise<FCVaData> {
  console.log('发送请求：enka/genshin/fcva', uid);
  const res = await API.post('enka/genshin/fcva', { uid });
  if (!res.data.success) {
    throw new Error(res.data.message || '获取zzz数据失败');
  }
  return res.data.data;
}

export async function fetchAllUids(): Promise<string[]> {
  try {
    const res = await API.get('genshin/uids');
    return res.data || [];
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const error = new Error(getErrorMessage(err.response?.status || 500)) as CustomError;
      error.code = err.response?.status || 500;
      throw error;
    }
    throw err;
  }
}

