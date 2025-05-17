import { Entity, Column, PrimaryColumn, Index } from 'typeorm';

@Entity()
@Index(['uid', 'id'], { unique: true })
export class GachaLog {
  @PrimaryColumn()
  id!: string;        // 抽卡记录的唯一 ID

  @Column()
  uid!: string;       // 用户 ID

  @Column()
  gacha_type!: string;

  @Column()
  name!: string;

  @Column()
  rank_type!: string;

  @Column()
  time!: string;      // 时间戳或 ISO 字符串
}
