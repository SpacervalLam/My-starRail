<template>
  <div class="gacha-analyzer">
    <div class="controls card">
      <label class="input-group">
        <span>UID</span>
        <input list="uidList" v-model="uid" placeholder="选择或输入 UID" maxlength="9" @input="onUidInput"
          @change="handleDatalistSelect" :disabled="loading" /></label>
      <datalist id="uidList">
        <option v-for="stored in storedUids" :key="stored" :value="stored" />
      </datalist>
      <button class="btn" :disabled="!canAnalyze" @click="runAnalysis">
        <template v-if="loading"><i class="icon-loading"></i> 分析中... </template>
        <template v-else><i class="icon-play"></i> 开始分析 </template>
      </button>
    </div>

    <div v-if="loading" class="loading"><i class="icon-spinner"></i> 加载中…</div>

    <div v-else>
      <!-- 全局统计卡片 -->
      <div v-if="hasAnyLogs" class="summary-cards">
        <div class="card summary-item">
          <h3>🏆 总抽卡次数</h3>
          <div class="value">{{ totalPulls }}</div>
        </div>
        <div class="card summary-item">
          <h3>⭐ 五星总数</h3>
          <div class="value">{{ totalFiveStar }}</div>
        </div>
        <div class="card summary-item">
          <h3>🔋 当前最大保底</h3>
          <div class="value">{{ maxCurrentPity }}</div>
        </div>
      </div>

      <!-- 卡池标签页 -->
      <div v-if="hasAnyLogs" class="pool-tabs">
        <button v-for="entry in entries" :key="entry.poolId"
          :class="['tab-btn', { active: activeTab === entry.poolId }]" @click="activeTab = entry.poolId">
          {{ poolNames[entry.poolId] }}
        </button>
      </div>

      <!-- 卡池概览 -->
      <template v-for="entry in entries" :key="entry.poolId">
        <div v-if="activeTab === entry.poolId && entry.logs.length" class="pool-section card">
          <h2>{{ poolNames[entry.poolId] }}</h2>
          <p class="overview">
            总抽卡：<strong>{{ entry.analysis.total }}</strong> 次
            | 五星：<strong>{{ entry.analysis.fiveStarCount }}</strong> 次
            | 平均出货间隔：<strong>{{ entry.analysis.averagePity }}</strong> 抽
          </p>
        </div>
      </template>

      <!-- 无数据提示 -->
      <div v-if="!hasAnyLogs" class="no-data muted">
        {{ uid ? '未找到该 UID 的记录' : '请输入 UID 后点击分析' }}
      </div>
    </div>

    <!-- 卡池详情 -->
    <template v-for="entry in entries" :key="entry.poolId">
      <div v-if="activeTab === entry.poolId && entry.logs.length" class="pool-detail card">

        <!-- 五星卡详情 -->
        <div class="five-star-section">
          <div class="five-star-grid">
            <div v-for="item in entry.analysis.fiveStarDetails" :key="item.name" class="five-star-card"
              :class="{ 'highlight': isNewestFiveStar(item, entry) }">
              <div class="avatar"></div>
              <div class="detail">
                <div class="name">{{ item.name }}</div>
                <div class="stats">
                  <span class="badge">获得 {{ item.count }} 次</span>
                  <span class="badge">平均 {{ avgPity(item.pulls) }} 抽</span>
                </div>
                <div class="timeline">
                  <div v-for="(pull, index) in item.pulls" :key="index" class="timeline-item" :style="{ flex: pull }">
                    <span class="tooltip">{{ pull }} 抽</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 记录列表 -->
        <div class="expandable-section">
          <div class="header" @click="expanded = !expanded">
            <span>展开详细抽卡记录（{{ entry.logs.length }} 条）</span>
            <i :class="['icon', expanded ? 'icon-chevron-down' : 'icon-chevron-right']"></i>
          </div>
          <div v-if="expanded" class="content">
            <div class="record-filter">
              <label class="filter-item">
                <input type="checkbox" v-model="show5StarOnly" /> 仅显示五星
              </label>
              <button class="btn-sm" @click="showCount += 50">加载更多</button>
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
import { ref, computed, onMounted, nextTick } from 'vue';
import { refreshGachaLogs, fetchGachaLogs, fetchAllUids } from '../api/gacha';
import { analyzeGachaLogs, GachaLogItem, PoolEntry, GachaAnalysis } from '../utils/analyzeGacha';
import { format } from 'date-fns';

const uid = ref('');
const loading = ref(false);
const groupedLogs = ref<Record<string, GachaLogItem[]>>({});
const analysisResults = ref<Record<string, GachaAnalysis>>({});
const storedUids = ref<string[]>([]);
const loadingUids = ref(false);
const activeTab = ref('11');
const showCount = ref(50);
const expanded = ref(false);
const show5StarOnly = ref(false);

const poolOrder = ['11', '12', '1', '2'];
const poolNames: Record<string, string> = {
  '11': '角色活动跃迁',
  '12': '光锥活动跃迁',
  '1': '常驻跃迁',
  '2': '新手跃迁',
};

const entries = computed(() =>
  poolOrder.map(poolId => {
    const logs = groupedLogs.value[poolId] || [];
    const analysis = analysisResults.value[poolId] || analyzeGachaLogs([]);
    return { poolId, logs, analysis } as PoolEntry;
  })
);
const handleDatalistSelect = (e: Event) => {
  const target = e.target as HTMLInputElement | null
  if (!target) return
  
  nextTick(() => {
    target.blur()
    // 可选：添加边界检查
    if (target.value.length === 9) {
      runAnalysis()
    }
  })
}

const isNewestFiveStar = (item: { name: string; lastTime: string }, entry: PoolEntry) =>
  item.lastTime === entry.analysis.fiveStarDetails[0]?.lastTime;

const avgPity = (pulls: number[]) =>
  Math.round(pulls.reduce((a, b) => a + b, 0) / pulls.length || 0);

const filteredLogs = (logs: GachaLogItem[]) =>
  [...logs]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .filter(log => !show5StarOnly.value || log.rank_type === '5')
    .slice(0, showCount.value);

const hasAnyLogs = computed(() => entries.value.some(e => e.logs.length));

onMounted(async () => {
  loadingUids.value = true;
  try {
    storedUids.value = await fetchAllUids();
  } catch {
    alert('无法获取历史 UID 列表');
  } finally {
    loadingUids.value = false;
  }
});

function onUidInput() {
  uid.value = uid.value.replace(/\D/g, '');
}

async function runAnalysis() {
  if (!/^[1-9]\d{8}$/.test(uid.value)) {
    return alert('请输入有效的 UID（9位数字，不以0开头）');
  }
  loading.value = true;
  try {
    await refreshGachaLogs(uid.value);
    const data = await fetchGachaLogs(uid.value);
    groupedLogs.value = data || {};
    analysisResults.value = Object.fromEntries(
      poolOrder.map(poolId => [poolId, analyzeGachaLogs(data?.[poolId] || [])])
    );
  } catch (e: any) {
    let errorMsg = e.message;
    // 尝试解析retcode错误
    const retcodeMatch = e.message.match(/retcode=(-?\d+)/);
    if (retcodeMatch) {
      const retcode = parseInt(retcodeMatch[1]);
      switch (retcode) {
        case -100:
          errorMsg = '请求参数错误: 检查URL中是否缺少必填参数或参数格式错误';
          break;
        case -101:
          errorMsg = '认证失败: authkey无效/过期，请登录游戏打开抽卡记录页面获取最新的authkey';
          break;
        case -102:
          errorMsg = '账号权限异常或封禁: 请检查账号安全状态';
          break;
        case -103:
          errorMsg = '接口访问频率过高: 喵的别一直点';
          break;
        case -104:
          errorMsg = '服务器维护或临时故障: 请稍后重试';
          break;
        case -105:
          errorMsg = '数据解析失败: 可能是游戏版本更新导致';
          break;
        case -106:
          errorMsg = '请求超时: 请检查网络连接';
          break;
        case -107:
          errorMsg = '请求路径错误: 确认接口URL是否更新';
          break;
        case -108:
          errorMsg = '客户端版本过低: 请更新游戏客户端';
          break;
        case -110:
          errorMsg = '系统内部错误: 服务器端异常';
          break;
        default:
          errorMsg = '未知错误: 请联系作者spacervallam@gmail.com';
      }
    }
    alert(`操作失败：${errorMsg}`);
    groupedLogs.value = {};
    analysisResults.value = {};
  } finally {
    loading.value = false;
  }
}

const formatTime = (t: string) => format(new Date(t), 'yyyy-MM-dd HH:mm');

const canAnalyze = computed(() =>
  /^[1-9]\d{8}$/.test(uid.value) && !loading.value && !loadingUids.value
);

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
:root {  max-width: 1200px;
  margin: 0 auto;
}

.gacha-analyzer {
  padding: 3rem, 5rem;
  background: var(--bg-light);
  color: var(--text);
  font-family: 'Helvetica Neue', Arial, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.card {
  background: #fff;
  border-radius: 12px;
  place-content: center;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.input-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn {
  /* 设置按钮为行内弹性布局，垂直居中对齐 */
  display: inline-flex;
  align-items: center;
  /* 设置按钮的内边距为0.6rem 1.2rem */
  padding: 0.6rem 1.2rem;
  /* 移除边框 */
  border: none;
  /* 设置边框半径为6px，使按钮有圆角 */
  border-radius: 6px;
  /* 设置按钮背景颜色为蓝色 */
  background: #007bff;
  /* 设置按钮文字颜色为白色 */
  color: #fff;
  /* 鼠标悬停时按钮显示为可点击状态 */
  cursor: pointer;
  /* 设置背景颜色过渡时间为0.2秒 */
  transition: background 0.2s;
}

.btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  font-style: italic;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.summary-item {
  text-align: center;
}

.summary-item h3 {
  margin-bottom: 0.5rem;
  font-size: 1rem;
  color: var(--secondary);
}

.value {
  font-size: 2.5rem;
  font-weight: bold;
}

.pool-tabs {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  margin-bottom: 1.5rem;
}

.tab-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  color: #000;
  background: #e9ecef;
  cursor: pointer;
}

.tab-btn.active {
  background: #007bff;
  color: #fff;
}

.overview {
  margin: 0.5rem 0;
  font-size: 0.95rem;
  color: var(--text);
}

.five-star-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.five-star-card {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: relative;
}

.five-star-card.highlight {
  border: 2px solid var(--rank-5);
}

.four-star-card.highlight {
  border: 2px solid var(--rank-4);
}

.avatar {
  width: 60px;
  height: 60px;
  background: #dee2e6;
  border-radius: 50%;
}

.detail {
  flex: 1;
}

.stats {
  display: flex;
  gap: 0.5rem;
  margin: 0.5rem 0;
  place-items: center;
  place-content: center;
}

.badge {
  background: var(--secondary);
  color: #453;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  font-size: 0.85rem;
  place-content: center;
  place-items: center;
}

.timeline {
  display: flex;
  gap: 2px;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.timeline-item {
  position: relative;
}

.tooltip {
  visibility: hidden;
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

.timeline-item:hover .tooltip {
  visibility: visible;
}

.expandable-section {
  margin-top: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f1f3f5;
  border-radius: 6px;
  cursor: pointer;
}

.content {
  margin-top: 1rem;
}

.record-filter {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-sm {
  padding: 0.3rem 0.8rem;
  background: #fff;
  color: #000;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.compact-records {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e9ecef;
  border-radius: 6px;
}

.record-item {
  display: flex;
  justify-content: space-between;
  padding: 0.6rem 1rem;
  border-bottom: 1px solid #e9ecef;
}

.record-item:last-child {
  border-bottom: none;
}

.rank-5 {
  background: #fff3cd;
}

.rank-4 {
  background: #CCCCFF;
}

.no-data {
  text-align: center;
  margin-top: 2rem;
  font-style: italic;
  color: var(--secondary);
}
</style>
