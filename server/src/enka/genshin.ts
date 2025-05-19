import axios, { AxiosResponse } from 'axios';

// 类型定义
interface PropMap {
    [key: string]: {
        type: number;
        ival: string;
        val?: string;
    };
}

interface FightPropMap {
    [key: string]: number;
}

interface Weapon {
    level: number;
    promoteLevel: number;
    affixMap: {
        [key: string]: number;
    };
}

interface Reliquary {
    level: number;
    mainPropId: number;
    appendPropIdList: number[];
}

interface Flat {
    nameTextMapHash: string;
    rankLevel: number;
    itemType: string;
    icon: string;
    equipType?: string;
    setId?: number;
    setNameTextMapHash?: string;
    reliquarySubstats?: Array<{
        appendPropId: string;
        statValue: number;
    }>;
    reliquaryMainstat?: {
        mainPropId: string;
        statValue: number;
    };
    weaponStats?: Array<{
        appendPropId: string;
        statValue: number;
    }>;
}

interface Equip {
    itemId: number;
    weapon?: Weapon;
    reliquary?: Reliquary;
    flat: Flat;
}

interface AvatarInfo {
    avatarId: number;
    propMap: PropMap;
    fightPropMap: FightPropMap;
    equipList: Equip[];
}

interface PlayerInfo {
    nickname: string;
    level: number;
    signature: string;
    worldLevel: number;
    towerFloorIndex: number;
    towerLevelIndex: number;
    finishAchievementNum: number;
}

interface EnkaData {
    playerInfo: PlayerInfo;
    avatarInfoList: AvatarInfo[];
    uid: string;
    ttl: number;
}

// 获取数据的异步函数
export async function fetchGenshinData(uid: string): Promise<EnkaData | null> {
    const url = `https://enka.network/api/uid/${uid}/`;
    try {
        const response: AxiosResponse<EnkaData> = await axios.get(url, {
            headers: { 'User-Agent': 'GenshinApp/1.0' }
        });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(`HTTP 错误: ${error.response?.status} ${error.message}`);
        } else {
            console.error('请求失败:', error);
        }
        return null;
    }
}
