<template>
  <div class="gacha-analyzer">
    <div class="controls">
      <!-- UID 选择下拉框 -->
      <div class="uid-selector">
        <select 
          v-model="selectedUid" 
          @change="onUidSelect"
          :disabled="loading"
        >
          <option value="">选择已有 UID</option>
          <option 
            v-for="uid in storedUids" 
            :key="uid" 
            :value="uid"
          >
            {{ uid }}
          </option>
        </select>
        <span class="or">或</span>
      </div>

      <label>UID：<input 
  v-model="uid" 
  placeholder="输入 UID"
  maxlength="9"
  @input="uid = uid.replace(/\D/g, '')"
/></label>
      <button :disabled="!canAnalyze" @click="runAnalysis">{{ loading ? '分析中...' : '开始分析' }}</button>
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
        {{ uid ? '未找到该 UID 的记录' : '请输入 UID 后点击分析' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { refreshGachaLogs, fetchGachaLogs, fetchAllUids } from '../api/gacha';
import { analyzeGachaLogs, GachaLogItem, GachaAnalysis } from '../utils/analyzeGacha';

// 1. 状态
const uid = ref('');
const loading = ref(false);
const groupedLogs = ref<Record<string, GachaLogItem[]>>({});
const analysisResults = ref<Record<string, GachaAnalysis>>({});
const storedUids = ref<string[]>([]);
const selectedUid = ref('');
const loadingUids = ref(false);
const isValidUid = computed(() => /^[1-9]\d{8}$/.test(uid.value));// UID 有效性校验

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

// 判断有没有数据
const hasAnyLogs = computed(() => entries.value.some(e => e.logs.length > 0));

// 组件挂载时加载 UID 列表
onMounted(async () => {
  try {
    loadingUids.value = true;
    storedUids.value = await fetchAllUids();
  } catch (err) {
    console.error('加载 UID 列表失败:', err);
    alert('无法获取历史 UID 列表');
  } finally {
    loadingUids.value = false;
  }
});

// 当下拉框选择时更新输入框
function onUidSelect(event: Event) {
  const target = event.target as HTMLSelectElement;
  uid.value = target.value;
}

// 核心逻辑
async function runAnalysis() {
  if (!isValidUid.value) {
    alert('请输入有效的 UID（9位数字，不以0开头）');
    return;
  }
  loading.value = true;
  try {
    // 拉取并存库
    await refreshGachaLogs(uid.value);
    // 读取
    const data = await fetchGachaLogs(uid.value);
    groupedLogs.value = data || {};
    // 分析
    const res = Object.fromEntries(
      poolOrder.map(poolId => [
        poolId,
        analyzeGachaLogs((data?.[poolId] as GachaLogItem[]) || [])
      ])
    );
    analysisResults.value = res;
    
  } catch (e: any) {
    console.error(e);
    alert(`操作失败：${e.response?.data?.message || e.message}`);
    groupedLogs.value = {};
    analysisResults.value = {};
  } finally {
    loading.value = false;
  }
}

// 按钮禁用逻辑
const canAnalyze = computed(() => 
  isValidUid.value && !loading.value && !loadingUids.value
);
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
.error { color: #c00; margin-top: 0.5rem; }
</style>
