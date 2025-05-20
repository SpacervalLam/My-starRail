import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenshinData } from './entities/genshin-data.entity';
import { fetchGenshinData } from './services/genshin';

@Injectable()
export class GenshinService {

  constructor(
    @InjectRepository(GenshinData)
    private readonly dataRepo: Repository<GenshinData>,
  ) {}

  public async fetchAndStoreData(uid: string): Promise<GenshinData> {
  console.log(`开始获取UID ${uid} 的原神数据`);
  const data = await fetchGenshinData(uid);
  if (!data) {
    console.error(`UID ${uid} 不存在或未公开信息`);
    throw new Error('UID不存在或未公开信息');
  }

  console.log(`开始存储UID ${uid} 的原神数据`);
  let record = await this.dataRepo.findOne({ where: { uid } });
  console.log(`查询到 ${record ? '已有' : '无'} UID ${uid} 的数据`);

  if (record) {
    console.log(`更新UID ${uid} 的已有数据`);
    record.setPlayerInfo(data.playerInfo);
    record.setAvatarInfoList(data.avatarInfoList);
    record.ttl = data.ttl;
    const updated = await this.dataRepo.save(record);
    console.log(`UID ${uid} 数据更新成功`);
    return updated;
  }

  console.log(`创建UID ${uid} 的新数据记录`);
  const newData = this.dataRepo.create({
    uid,
    playerInfo: data.playerInfo,
    avatarInfoList: data.avatarInfoList,
    ttl: data.ttl,
  });
  const saved = await this.dataRepo.save(newData);
  console.log(`UID ${uid} 数据创建成功`);
  return saved;
}


  public async getDataFromDb(uid: string): Promise<GenshinData | null> {
    console.log(`查询UID ${uid} 的数据库记录`);
    return this.dataRepo.findOne({ where: { uid } });
  }

  public async getAllUids(): Promise<string[]> {
    console.log('获取所有UID列表');
    const records = await this.dataRepo.find({ select: ['uid'] });
    console.log(`共找到 ${records.length} 个UID`);
    return records.map(r => r.uid).filter((uid): uid is string => uid !== undefined);
  }
}
