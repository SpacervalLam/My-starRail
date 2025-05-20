import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { GenshinData } from './entities/genshin-data.entity';
import { fetchGenshinData } from './services/fetch';

@Injectable()
export class GenshinService {
  constructor(
    @InjectRepository(GenshinData)
    private readonly dataRepo: Repository<GenshinData>,
  ) { }

  public async fetchAndStoreData(uid: string): Promise<GenshinData> {
    const data = await fetchGenshinData(uid);
    if (!data) {
      throw new InternalServerErrorException('UID不存在或未公开信息');
    }
    try {
      await this.dataRepo.upsert(
        {
          uid,
          playerInfo: data.playerInfo,
          avatarInfoList: data.avatarInfoList,
          ttl: data.ttl,
        },
        ['uid'],
      );
      return this.dataRepo.findOne({ where: { uid } }) as Promise<GenshinData>;
    } catch (err) {
      if (err instanceof QueryFailedError) {
        throw new InternalServerErrorException('数据库操作异常');
      }
      throw err;
    }
  }

  public async getDataFromDb(uid: string): Promise<GenshinData | null> {
    return this.dataRepo.findOne({ where: { uid } });
  }

  public async getAllUids(): Promise<string[]> {
    const records = await this.dataRepo.find({ select: ['uid'] });
    console.log("从数据库中找到了以下uid：" + records.map(r => r.uid));
    return records.map(r => r.uid).filter((u): u is string => !!u);
  }
}