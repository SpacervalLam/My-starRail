import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Type } from 'class-transformer';
import { AvatarInfo, PlayerInfo } from './type/genshin';

@Entity('genshin_data')
export class GenshinData {
  @PrimaryColumn('text')
  uid?: string;  

  @Column('simple-json', { name: 'player_info' })
  @Type(() => Object)
  playerInfo?: PlayerInfo;  

  @Column('simple-json', { name: 'avatar_info_list' })
  @Type(() => Object)
  avatarInfoList?: AvatarInfo[];

  @Column('int')
  ttl?: number;  

  @CreateDateColumn({ type: 'datetime', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt?: Date;  

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt?: Date;  

  // 辅助方法
  setPlayerInfo(info: any) {
    this.playerInfo = info;
  }

  setAvatarInfoList(list: any[]) {
    this.avatarInfoList = list;
  }
}
