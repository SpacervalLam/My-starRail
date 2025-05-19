import axios, { AxiosResponse } from 'axios';

// 类型定义
interface ZZZCharacter {
  id: string;
  name: string;
  rarity: number;
  level: number;
  promotion: number;
  skills: {
    id: string;
    level: number;
  }[];
  equipment?: {
    id: string;
    level: number;
    promotion: number;
  };
  stats: {
    [key: string]: number;
  };
}

interface ZZZPlayerData {
  uid: string;
  nickname: string;
  level: number;
  characters: ZZZCharacter[];
  updatedAt: string;
}

// 获取数据的异步函数
export async function fetchZZZData(uid: string): Promise<ZZZPlayerData | null> {
  const url = `https://api.enka.network/zzz/uid/${uid}/`;
  try {
    const response: AxiosResponse<ZZZPlayerData> = await axios.get(url, {
      headers: { 
        'User-Agent': 'ZZZApp/1.0',
        'Accept-Language': 'zh-CN'
      }
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      console.error(`HTTP 错误: ${status} - ${error.message}`);
      if (status === 404) console.log('UID 不存在或未公开信息');
      if (status === 429) console.log('请求过于频繁，请稍后重试');
    } else {
      console.error('请求失败:', error);
    }
    return null;
  }
}

// 美观打印函数
function prettyPrintZZZData(data: ZZZPlayerData): void {
  // 属性映射表
  const statMap: { [key: string]: string } = {
    'ATK': '攻击力',
    'DEF': '防御力',
    'HP': '生命值',
    'CRIT_RATE': '暴击率',
    'CRIT_DMG': '暴击伤害',
    'ENERGY_RECOVERY': '能量回复',
    'ANOMALY_MASTERY': '异常精通'
  };

  console.log("=".repeat(50));
  console.log(`玩家名称: ${data.nickname} (UID: ${data.uid})`);
  console.log(`等级: ${data.level}`);
  console.log(`数据更新时间: ${new Date(data.updatedAt).toLocaleString()}`);
  console.log("=".repeat(50) + "\n");

  data.characters.forEach(char => {
    console.log("■".repeat(50));
    console.log(`角色名称: ${char.name} [${'★'.repeat(char.rarity)}]`);
    console.log(`等级: Lv.${char.level} (突破等级 ${char.promotion})`);
    
    // 显示核心属性
    console.log("\n【核心属性】");
    Object.entries(char.stats).forEach(([key, value]) => {
      const name = statMap[key] || key;
      console.log(`${name.padEnd(8)}: ${value.toLocaleString()}`);
    });

    // 显示技能信息
    console.log("\n【技能等级】");
    char.skills.forEach(skill => {
      console.log(`${skill.id}: Lv.${skill.level}`);
    });

    // 显示装备信息
    if (char.equipment) {
      console.log("\n【装备信息】");
      console.log(`${char.equipment.id} (Lv.${char.equipment.level})`);
      console.log(`突破等级: ${char.equipment.promotion}`);
    }

    console.log("■".repeat(50) + "\n");
  });
}

// 使用示例
async function main() {
  const uid = "11033315"; // 替换为实际UID
  const data = await fetchZZZData(uid);
  
  if (data) {
    prettyPrintZZZData(data);
  } else {
    console.log("未能获取数据");
  }
}

main().catch(console.error);