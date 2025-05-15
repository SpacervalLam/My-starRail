<template>
  <div class="gacha-analyzer">
    <div class="controls">
      <!-- UID 选择下拉框 -->
      <div class="uid-selector">
        <select v-model="selectedUid" @change="onUidSelect" :disabled="loading">
          <option value="">选择已有 UID</option>
          <option v-for="uid in storedUids" :key="uid" :value="uid">
            {{ uid }}
          </option>
        </select>
        <span class="or">或</span>
      </div>

      <label>UID：<input v-model="uid" placeholder="输入 UID" maxlength="9"
          @input="uid = uid.replace(/\D/g, '')" /></label>
      <button :disabled="!canAnalyze" @click="runAnalysis">{{ loading ? '分析中...' : '开始分析' }}</button>
    </div>

    <div v-if="loading" class="loading">加载中…</div>

    <div v-else>
      <!-- 全局统计卡片 -->
      <div v-if="hasAnyLogs" class="summary-cards"></div>
      <div v-if="hasAnyLogs" class="summary-cards">
        <div class="card">
          <h3>🏆 总抽卡次数</h3>
          <div class="value">{{ totalPulls }}</div>
        </div>
        <div class="card">
          <h3>⭐ 五星总数</h3>
          <div class="value">{{ totalFiveStar }}</div>
        </div>
      </div>


      <!-- 卡池标签页 -->
      <div v-if="hasAnyLogs" class="pool-tabs"></div>
      <div v-if="hasAnyLogs" class="pool-tabs">
        <button v-for="entry in entries" :key="entry.poolId" :class="{ active: activeTab === entry.poolId }"
          @click="activeTab = entry.poolId">
          {{ poolNames[entry.poolId] }}
        </button>
      </div>

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
        </div>
      </template>

      <!-- 没有任何记录时显示 -->
      <div v-if="!hasAnyLogs" class="no-data">
        {{ uid ? '未找到该 UID 的记录' : '请输入 UID 后点击分析' }}
      </div>
    </div>

    <!-- 卡池详情 -->
    <template v-for="entry in entries" :key="entry.poolId">
      <div v-if="activeTab === entry.poolId && entry.logs.length" class="pool-detail">
        <!-- 卡池统计 -->
        <div class="pool-stats">
          <div class="stat-item">
            <span class="label">抽卡总数</span>
            <span class="value">{{ entry.analysis.total }}</span>
          </div>
          <div class="stat-item">
            <span class="label">五星数量</span>
            <span class="value highlight">{{ entry.analysis.fiveStarCount }}</span>
          </div>
          <div class="stat-item">
            <span class="label">平均出货</span>
            <span class="value">{{ entry.analysis.averagePity }} 抽</span>
          </div>
        </div>

        <!-- 五星详情增强 -->
        <div class="five-star-section">
          <h3>五星角色/光锥（共 {{ entry.analysis.fiveStarCount }} 个）</h3>
          <div class="five-star-grid">
            <div v-for="item in entry.analysis.fiveStarDetails" :key="item.name" class="five-star-card"
              :class="{ 'newest-item': isNewestFiveStar(item, entry) }">
              <div class="avatar"></div> <!-- 可替换为实际图片 -->
              <div class="detail">
                <div class="name">{{ item.name }}</div>
                <div class="stats">
                  <span class="badge">获得 {{ item.count }} 次</span>
                  <span class="badge">平均 {{ avgPity(item.pulls) }} 抽</span>
                </div>
                <div class="timeline">
                  <div v-for="(pull, index) in item.pulls" :key="index" class="timeline-item"
                    :style="{ width: `${pull}%` }">
                    <span class="tooltip">{{ pull }} 抽</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- 折叠式详细记录 -->
        <div class="expandable-section">
          <div class="header" @click="expanded = !expanded">
            <span>详细抽卡记录（{{ entry.logs.length }} 条）</span>
            <span class="icon">{{ expanded ? '▼' : '▶' }}</span>
          </div>
          <div v-if="expanded" class="content">
            <div class="record-filter">
              <label>
                <input type="checkbox" v-model="show5StarOnly" /> 仅显示五星
              </label>
              <button @click="showCount += 50">加载更多</button>
            </div>
            <div class="compact-records">
              <div v-for="log in filteredLogs(entry.logs)" :key="log.id" class="record-item"
                :class="`rank-${log.rank_type}`">
                <span class="time">{{ formatTime(log.time) }}</span>
                <span class="name">{{ log.name }}</span>
                <span class="rank">★{{ log.rank_type }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { refreshGachaLogs, fetchGachaLogs, fetchAllUids } from '../api/gacha';
import { analyzeGachaLogs, GachaLogItem, PoolEntry, GachaAnalysis } from '../utils/analyzeGacha';
import { format } from 'date-fns';
import { LineChart } from 'vue-chart-3';
import { Chart, registerables, ChartData } from 'chart.js';
Chart.register(...registerables);



// 1. 状态
const uid = ref('');
const loading = ref(false);
const groupedLogs = ref<Record<string, GachaLogItem[]>>({});
const analysisResults = ref<Record<string, GachaAnalysis>>({});
const storedUids = ref<string[]>([]);
const selectedUid = ref('');
const loadingUids = ref(false);
const isValidUid = computed(() => /^[1-9]\d{8}$/.test(uid.value));// UID 有效性校验
const activeTab = ref('11'); // 默认显示角色活动跃迁
const showCount = ref(50);
const sortKey = ref<'time' | 'name' | 'rank'>('time');
const sortOrder = ref<'asc' | 'desc'>('desc');
const expanded = ref(false);
const show5StarOnly = ref(false);

// 2. 卡池元数据
const poolOrder = ['11', '12', '1', '2'];
const poolNames: Record<string, string> = {
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

const latestFiveStar = (entry: PoolEntry): string | undefined => {
  return entry.analysis.fiveStarDetails[0]?.lastTime;
};

const isNewestFiveStar = (item: { name: string; lastTime: string }, entry: PoolEntry): boolean =>
  item.lastTime === latestFiveStar(entry);

const avgPity = (pulls: number[]) =>
  Math.round(pulls.reduce((a, b) => a + b, 0) / pulls.length || 0)

const filteredLogs = (logs: GachaLogItem[]): GachaLogItem[] => {
  const sorted = sortedLogs(logs);    // 直接调用函数
  return sorted
    .filter(log => !show5StarOnly.value || log.rank_type === '5')
    .slice(0, showCount.value);
};

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
      poolOrder.map(poolId => {
        const logs = Array.isArray(data?.[poolId]) ? data[poolId] : [];

        return [poolId, analyzeGachaLogs(logs)];
      })
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

const formatTime = (t: string) => format(new Date(t), 'yyyy-MM-dd HH:mm');

const chartData = (entry: PoolEntry): ChartData<'line'> => ({
  labels: entry.analysis.timeline.map(t => formatTime(t.time)),
  datasets: [
    {
      label: '抽卡分布',
      data: entry.analysis.timeline.map((_, i) => i + 1),
      backgroundColor: '#007bff33',
      borderColor: '#007bff',
      borderWidth: 2,
      pointRadius: 4,
      pointBackgroundColor: entry.analysis.timeline.map(t =>
        t.rank === '5' ? '#ffd700' : t.rank === '4' ? '#b57edc' : '#6c757d'
      )
    }
  ]
});

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: (ctx: any) => `第 ${ctx.parsed.y} 抽 - ${ctx.dataset.pointBackgroundColor[ctx.dataIndex]}星`
      }
    }
  },
  scales: {
    x: {
      display: false
    },
    y: {
      title: {
        display: true,
        text: '累计抽数'
      }
    }
  }
};


const sortedLogs = (logs: GachaLogItem[]) => {
  return [...logs].sort((a, b) => {
    const modifier = sortOrder.value === 'asc' ? 1 : -1;
    switch (sortKey.value) {
      case 'time':
        return modifier * (new Date(a.time).getTime() - new Date(b.time).getTime());
      case 'name':
        return modifier * a.name.localeCompare(b.name);
      case 'rank':
        return modifier * (parseInt(b.rank_type) - parseInt(a.rank_type));
    }
  }).slice(0, showCount.value);
};

const sortBy = (key: typeof sortKey.value) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'desc';
  }
};

const sortIcon = (key: string) =>
  sortKey.value === key ? (sortOrder.value === 'asc' ? '↑' : '↓') : '';

// 按钮禁用逻辑
const canAnalyze = computed(() =>
  isValidUid.value && !loading.value && !loadingUids.value
);

// 全局统计计算属性
const totalPulls = computed(() =>
  entries.value.reduce((sum, e) => sum + e.analysis.total, 0)
);
const totalFiveStar = computed(() =>
  entries.value.reduce((sum, e) => sum + e.analysis.fiveStarCount, 0)
);
const maxCurrentPity = computed(() =>
  Math.max(...entries.value.map(e => e.analysis.currentPity))
);
</script>

<style scoped>
.gacha-analyzer {
  padding: 1rem;
}

.controls {
  margin-bottom: 1rem;
}

.controls input {
  width: 180px;
  margin-right: 0.5rem;
}

button {
  padding: 0.5rem 1rem;
}

.loading {
  font-style: italic;
  color: #666;
}

.pool-section {
  margin-bottom: 2rem;
}

.pool-section h2 {
  margin: 0.5rem 0;
}

.five-star-details {
  margin-bottom: 1rem;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}

th,
td {
  border: 1px solid #ccc;
  padding: 0.5rem;
}

.no-data {
  color: #999;
  font-style: italic;
}

.error {
  color: #c00;
  margin-top: 0.5rem;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.card {
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card h3 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  color: #666;
}

.card .value {
  font-size: 2rem;
  font-weight: bold;
}

.pool-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.pool-tabs button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: 1px solid #ddd;
  background: #f8f9fa;
}

.pool-tabs button.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.five-star-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}

.five-star-item {
  background: #fff;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.rank-5 td {
  background: #fff3cd !important;
}

.rank-tag {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background: var(--rank-color);
  color: white;
  font-weight: bold;
}

.rank-tag[data-rank="5"] {
  --rank-color: #ffd700;
}

.rank-tag[data-rank="4"] {
  --rank-color: #b57edc;
}

.summary-panel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.summary-item {
  background: var(--card-bg);
  padding: 1rem;
  border-radius: 8px;
}

.five-star-card {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: var(--card-bg);
  border-radius: 8px;
}

.avatar {
  width: 60px;
  height: 60px;
  background: #eee;
  border-radius: 50%;
}

.timeline {
  display: flex;
  height: 4px;
  background: #eee;
  border-radius: 2px;
}

.timeline-item {
  height: 100%;
  background: var(--rank-color);
  position: relative;
}

.tooltip {
  visibility: hidden;
  position: absolute;
  bottom: 100%;
  white-space: nowrap;
}

.timeline-item:hover .tooltip {
  visibility: visible;
}

.expandable-section {
  margin-top: 2rem;
  border: 1px solid #eee;
  border-radius: 8px;
}

.header {
  padding: 1rem;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
}

.compact-records {
  max-height: 400px;
  overflow-y: auto;
}

.record-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #eee;
}

.rank-tag {
  font-size: 0.8em;
  padding: 2px 6px;
}

.muted {
  color: #666;
  font-size: 0.9em;
}
</style>
