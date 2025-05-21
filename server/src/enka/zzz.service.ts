import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import axios from 'axios';
import { ZZZData } from './entities/zzz-data.entity';
import { ZZZPlayerData } from './entities/type/zzz';
import { fetchZZZData } from './services/fetch';

@Injectable()
export class ZZZService {
  constructor(
    @InjectRepository(ZZZData)
    private readonly dataRepo: Repository<ZZZData>,
  ) { }

  public async fetchAndStoreData(uid: string): Promise<ZZZData | null> {
    let zzzData: ZZZPlayerData | null;
    try {
      zzzData = await fetchZZZData(uid);
      if (!zzzData) {
        throw new InternalServerErrorException('UID不存在或未公开信息');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status) {
        throw error;
      }
      throw new InternalServerErrorException('获取数据失败');
    }

    try {
      await this.dataRepo.upsert(
        {
          uid,
          playerInfo: zzzData.PlayerInfo,
          updatedAt: new Date(),
          ttl: zzzData.ttl,
        },
        ['uid'],
      );
      return this.dataRepo.findOne({ where: { uid } }) as Promise<ZZZData>;
    } catch (err) {
      if (err instanceof QueryFailedError) {
        throw new InternalServerErrorException('数据库操作异常');
      }
      throw err;
    }
  }

  public async getDataFromDb(uid: string): Promise<ZZZData | null> {
    return this.dataRepo.findOne({ where: { uid } });
  }

  public async getAllUids(): Promise<string[]> {
    const records = await this.dataRepo.find({ select: ['uid'] });
    return records.map(r => r.uid).filter((u): u is string => !!u);
  }
}
