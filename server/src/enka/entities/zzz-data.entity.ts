import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';
import { ZZZPlayerData } from './type/zzz';

@Entity()
export class ZZZData {
  @PrimaryColumn()
  uid?: string;

  @Column({ type: 'simple-json' })
  playerInfo?: ZZZPlayerData['PlayerInfo'];

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt?: Date;  

  @Column({ type: 'int' })
  ttl?: number;
}
