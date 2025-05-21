export interface ZZZEquipment {
  RandomPropertyList: {
    PropertyId: number;
    PropertyValue: number;
    PropertyLevel: number;
  }[];
  MainPropertyList: {
    PropertyId: number;
    PropertyValue: number;
    PropertyLevel: number;
  }[];
  IsAvailable: boolean;
  IsLocked: boolean;
  IsTrash: boolean;
  Id: number;
  Uid: number;
  Level: number;
  BreakLevel: number;
  Exp: number;
}

export interface ZZZWeapon {
  IsAvailable: boolean;
  IsLocked: boolean;
  Id: number;
  Uid: number;
  Level: number;
  BreakLevel: number;
  Exp: number;
  UpgradeLevel?: number;
}

export interface ZZZCharacter {
  TalentToggles: boolean[];
  SkillLevelList: {
    Level: number;
    Index: number;
  }[];
  EquippedList: {
    Slot: number;
    Equipment: ZZZEquipment;
  }[];
  ClaimedRewards: number[];
  WeaponEffectState: number;
  IsFavorite: boolean;
  Id: number;
  Level: number;
  PromotionLevel: number;
  Exp: number;
  SkinId?: number;
  TalentLevel: number;
  CoreSkillEnhancement: number;
  WeaponUid: number;
  ObtainmentTimestamp: number;
  Weapon: ZZZWeapon;
}

export interface MedalInfo {
  Value: number;
  MedalIcon: number;
  MedalType: number;
}

export interface ProfileDetail {
  TitleInfo: {
    HFKHLLBMPHM: any[];
    Title: number;
    ECJPEHHALAO: number;
  };
  Nickname: string;
  AvatarId: number;
  Uid: string;
  Level: number;
  Title: number;
  ProfileId: number;
  PlatformType: number;
  CallingCardId: number;
}

export interface SocialDetail {
  MedalList: MedalInfo[];
  ProfileDetail: ProfileDetail;
  Desc: string;
}

export interface ShowcaseDetail {
  AvatarList: ZZZCharacter[];
}

export interface PlayerInfo {
  ShowcaseDetail: ShowcaseDetail;
  SocialDetail: SocialDetail;
}

export interface ZZZPlayerData {
  PlayerInfo: PlayerInfo;
  uid: string;
  ttl: number;
}
