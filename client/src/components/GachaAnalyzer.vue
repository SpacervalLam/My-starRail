<template>
  <div class="gacha-analyzer">
    <div class="controls">
      <label>UID：<input v-model="uid" placeholder="输入 UID" /></label>
      <button :disabled="!uid || loading" @click="runAnalysis">开始分析</button>
    </div>

    <div v-if="loading" class="loading">加载中…</div>

    <div v-else>
      <!-- 遍历各个卡池数据 -->
      <template v-for="entry in entries" :key="entry.poolId">
        <div v-if="entry.logs.length" class="pool-section">
          <h2>{{ poolNames[entry.poolId] }}</h2>
          <p>
            总抽卡：{{ entry.analysis.total }} 次，
            五星：{{ entry.analysis.fiveStarCount }} 次，
            平均出货间隔：{{ entry.analysis.averagePity }} 抽
          </p>
          <div class="five-star-details">
            <div v-for="d in entry.analysis.fiveStarDetails" :key="d.name">
              <strong>{{ d.name }}</strong>：{{ d.count }} 次 / 抽数 {{ d.pulls.join('，') }}
            </div>
          </div>
          <table>
            <thead>
              <tr><th>时间</th><th>名称</th><th>稀有度</th></tr>
            </thead>
            <tbody>
              <tr v-for="log in entry.logs" :key="log.id">
                <td>{{ log.time }}</td>
                <td>{{ log.name }}</td>
                <td>{{ log.rank_type }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <!-- 没有任何记录时显示 -->
      <div v-if="!hasAnyLogs" class="no-data">
        没有记录，请先点击 “开始分析”
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { refreshGachaLogs, fetchGachaLogs } from '../api/gacha';
import { analyzeGachaLogs, GachaLogItem, GachaAnalysis } from '../utils/analyzeGacha';

// 1. 状态
const uid = ref('');
const loading = ref(false);
const groupedLogs = ref<Record<string, GachaLogItem[]>>({});
const analysisResults = ref<Record<string, GachaAnalysis>>({});

// 2. 卡池元数据
const poolOrder = ['11','12','1','2'];
const poolNames: Record<string,string> = {
  '11': '角色活动跃迁',
  '12': '光锥活动跃迁',
  '1': '常驻跃迁',
  '2': '新手跃迁',
};

// 3. 组合成模板方便用的 entries 数组
const entries = computed(() =>
  poolOrder.map(poolId => {
    const logs = groupedLogs.value[poolId] || [];
    const analysis = analysisResults.value[poolId] || analyzeGachaLogs([]);
    return { poolId, logs, analysis } as {
      poolId: string;
      logs: GachaLogItem[];
      analysis: GachaAnalysis;
    };
  })
);

// 4. 判断有没有数据
const hasAnyLogs = computed(() => entries.value.some(e => e.logs.length > 0));

// 5. 核心逻辑
async function runAnalysis() {
  if (!uid.value) return;
  loading.value = true;
  try {
    // 拉取并存库
    await refreshGachaLogs();
    // 读取
    const data = await fetchGachaLogs(uid.value);
    groupedLogs.value = data;
    // 分析
    const res: Record<string, GachaAnalysis> = {};
    for (const poolId of poolOrder) {
      res[poolId] = analyzeGachaLogs(data[poolId] || []);
    }
    analysisResults.value = res;
  } catch (e) {
    console.error(e);
    groupedLogs.value = {};
    analysisResults.value = {};
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.gacha-analyzer { padding:1rem; }
.controls { margin-bottom:1rem; }
.controls input { width:180px; margin-right:0.5rem; }
button { padding:0.5rem 1rem; }
.loading { font-style:italic; color:#666; }
.pool-section { margin-bottom:2rem; }
.pool-section h2 { margin:0.5rem 0; }
.five-star-details { margin-bottom:1rem; }
table { width:100%; border-collapse:collapse; margin-bottom:1rem; }
th,td { border:1px solid #ccc; padding:0.5rem; }
.no-data { color:#999; font-style:italic; }
</style>
