import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3168/api/',
});

interface PlayerInfo {
  nickname: string;
  level: number;
  signature: string;
  worldLevel: number;
}

interface AvatarInfo {
  avatarId: number;
  propMap: Record<string, { type: number; val: string }>;
  fightPropMap: Record<string, number>;
}

export interface GenshinData {
  playerInfo: PlayerInfo;
  avatarInfoList: AvatarInfo[];
}

export interface FCVaData {
  // FCVa数据结构定义
  [key: string]: any;
}

export async function fetchGenshinData(uid: string): Promise<GenshinData> {
  console.log('发送请求：enka/genshin', uid);
  const res = await API.post('enka/genshin', { uid });
  if (!res.data.success) {
    throw new Error(res.data.message || '获取Genshin数据失败');
  }
  return res.data.data;
}

export async function fetchFCVaData(uid: string): Promise<FCVaData> {
  console.log('发送请求：enka/genshin/fcva', uid);
  const res = await API.post('enka/genshin/fcva', { uid });
  if (!res.data.success) {
    throw new Error(res.data.message || '获取FCVa数据失败');
  }
  return res.data.data;
}
