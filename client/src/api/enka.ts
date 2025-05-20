import axios from 'axios';

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
    throw new Error(res.data.message || '获取zzz数据失败');
  }
  return res.data.data;
}
