/** 首页展示的角色预览 */
export interface ShowAvatarInfo {
  avatarId: number;
  level: number;
  talentLevel: number;
  energyType: number;
}

/** 玩家基础信息 */
export interface PlayerInfo {
  nickname: string;
  level: number;
  signature?: string;
  worldLevel: number;
  nameCardId: number;
  finishAchievementNum: number;
  towerFloorIndex: number;
  towerLevelIndex: number;
  showAvatarInfoList: ShowAvatarInfo[];
  showNameCardIdList: number[];
  profilePicture: { id: number };
  towerAct?: number;             // 深境螺旋章节（旧字段）
  theaterModeIndex?: number;     // 合众剧场模式索引
  theaterActIndex?: number;      // 合众剧场章节索引
  theaterStarIndex?: number;     // 合众剧场星级
  isShowAvatarTalent?: boolean;  // 是否展示天赋
  fetterCount?: number;          // 羁绊等级
  towerStarIndex?: number;       // 深渊星级
}

/** 原始属性条目 */
export interface PropEntry {
  type: number;
  ival: string;
  val?: string;
}

/** 面板资质属性映射 */
export type PropMap = Record<string, PropEntry>;

/** 战斗属性映射 */
export type FightPropMap = Record<string, number>;

/** 武器详情 */
export interface Weapon {
  level: number;
  promoteLevel: number;
  affixMap: Record<string, number>;
}

/** 圣遗物详情 */
export interface Reliquary {
  level: number;
  mainPropId: number;
  appendPropIdList: number[];
}

/** 基础扁平化数据 */
export interface Flat {
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

/** 装备（圣遗物或武器） */
export interface Equip {
  itemId: number;
  weapon?: Weapon;
  reliquary?: Reliquary;
  flat: Flat;
  [key: string]: any;
}

/** 单个角色的完整信息 */
export interface AvatarInfo {
  avatarId: number;
  propMap: PropMap;
  talentIdList?: number[];
  fightPropMap: FightPropMap;
  skillDepotId: number;
  inherentProudSkillList: number[];
  proudSkillExtraLevelMap?: Record<string, number>;
  skillLevelMap: Record<string, number>;
  equipList: Equip[];
  fetterInfo?: { expLevel: number };
  energyType?: number;
  talentLevel?: number;
}

/** Enka API 最外层返回 */
export interface EnkaData {
  playerInfo: PlayerInfo;
  avatarInfoList: AvatarInfo[];
  uid: string;
  ttl: number;
  [key: string]: any;
}
