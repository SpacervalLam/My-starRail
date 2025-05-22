<template>
  <div class="gacha-analyzer"> <!-- 游戏类型选择器 -->
    <div class="game-type-selector">
      <div class="type-card" :class="{ active: gameType === GameType.StarRail }" @click="gameType = GameType.StarRail">
        <img :src="`${baseUrl}assets/icon/star-rail-icon.png`" alt="Star Rail">
        <span>{{ t('gameTypes.starrail') }}</span>
      </div>
      <div class="type-card" :class="{ active: gameType === GameType.Zenless }" @click="gameType = GameType.Zenless">
        <img :src="`${baseUrl}assets/icon/zenless-icon.png`" alt="Zenless">
        <span>{{ t('gameTypes.zenless') }}</span>
      </div>
    </div>

    <!-- 控制区：UID/URL 切换与输入 -->
    <div class="control-cards-container">
      <div class="control-card" :class="{ active: queryMode === 'uid', flipped: queryMode === 'url' }">
        <!-- FRONT: UID 模式 -->
        <div class="card-face card-front">
          <label class="input-group">
            <span @click="queryMode = QueryMode.URL">{{ t('controls.uidLabel') }}</span>
            <input list="uidList" v-model="uid" :placeholder="t('controls.uidPlaceholder')" maxlength="9"
              @input="onUidInput" @change="handleDatalistSelect" @keydown.enter="handleEnterKey" @click.stop
              :disabled="loading" />
          </label>
          <datalist id="uidList">
            <option v-for="stored in storedUids" :key="stored" :value="stored" />
          </datalist>
        </div>
        <!-- BACK: URL 模式 -->
        <div class="card-face card-back">
          <label class="input-group">
            <span @click="queryMode = QueryMode.UID">{{ t('controls.urlLabel') }}</span>
            <input v-model="gachaUrl" :placeholder="t('controls.urlPlaceholder')" @keydown.enter="handleEnterKey"
              @click.stop :disabled="loading" />
          </label>
        </div>
      </div>
      <!-- 分析按钮 -->
      <button class="btn analyze-btn" :disabled="loading || (queryMode === 'uid' ? !canAnalyze : !gachaUrl)"
        @click="runAnalysis">
        <template v-if="loading">
          <i class="icon-loading"></i> {{ t('controls.analyzing') }}
        </template>
        <template v-else>
          <i class="icon-play"></i> {{ t('controls.analyze') }}
        </template>
      </button>
    </div>

    <!-- 全局 Loading 显示 -->
    <div v-if="loading" class="loading-container">
      <img :src="`${baseUrl}assets/gif/loading.gif`" alt="Loading" class="loading-gif">
      <span class="loading-text">{{ t('controls.loading') }}</span>
    </div>


    <div v-else>
      <!-- 全局统计卡片 -->
      <div v-if="hasAnyLogs" class="summary-cards">
        <div class="card summary-item">
          <h3>🏆 {{ t('summary.totalPulls') }}</h3>
          <div class="value">{{ totalPulls }}</div>
        </div>
        <div class="card summary-item">
          <h3>⭐ {{ t('summary.fiveStar') }}</h3>
          <div class="value">{{ totalFiveStar }}</div>
        </div>
        <div class="card summary-item">
          <h3>🔋 {{ t('summary.currentPity') }}</h3>
          <div class="value">{{ maxCurrentPity }}</div>
        </div>
      </div>

      <!-- 卡池标签页 -->
      <div v-if="hasAnyLogs" class="pool-tabs">
        <button v-for="entry in entries" :key="entry.poolId"
          :class="['tab-btn', { active: activeTab === entry.poolId }]" @click="activeTab = entry.poolId">
          {{ t(`gamePools.${gameType}.${entry.poolId}`) }}
        </button>
      </div>

      <!-- 卡池概览 -->
      <template v-for="entry in entries" :key="entry.poolId">
        <div v-if="activeTab === entry.poolId && entry.logs.length" class="pool-section card">
          <h2>{{ t(`gamePools.${gameType}.${entry.poolId}`) }}</h2>
          <p class="overview">
            {{ t('overview', {
              total: entry.analysis.total,
              fiveStar: entry.analysis.fiveStarCount,
              avg: entry.analysis.averagePity
            }) }}
          </p>
        </div>
      </template>

      <!-- 无数据提示 -->
      <div v-if="!hasAnyLogs" class="no-data muted message">
        {{ uid
          ? t('controls.noData')
          : t('controls.inputModeTip')
        }}
      </div>

      <!-- 卡池详情 -->
      <template v-for="entry in entries" :key="entry.poolId">
        <div v-if="activeTab === entry.poolId && entry.logs.length" class="pool-detail card">
          <!-- 五星详情 -->
          <div class="five-star-section">
            <div class="five-star-grid">
              <div v-for="item in entry.analysis.fiveStarDetails" :key="item.name" class="five-star-card"
                :class="{ highlight: isNewestFiveStar(item, entry) }">
                <img class="avatar" :src="`${baseUrl}assets/avatars/${item.item_id}.png`" :alt="item.name" />
                <div class="detail">
                  <div class="name">{{ item.name }}</div>
                  <div class="stats">
                    <span class="badge">
                      {{ t('records', {
                        count: item.count,
                        avg: avgPity(item.pulls)
                      }) }}
                    </span>
                  </div>

                </div>
              </div>
            </div>
          </div>

          <!-- 展开记录列表 -->
          <div class="expandable-section">
            <div class="header" @click="expanded = !expanded">
              <span>{{ t('expand.expandRecords', { count: entry.logs.length }) }}</span>
              <i :class="['icon', expanded ? 'icon-chevron-down' : 'icon-chevron-right']"></i>
            </div>
            <div v-if="expanded" class="content">
              <div class="record-filter">
                <label class="filter-item">
                  <input type="checkbox" v-model="show5StarOnly" /> {{ t('filter.only5') }}
                </label>
                <button class="btn-sm" @click="showCount += 50">{{ t('filter.loadMore') }}</button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  refreshGachaLogs,
  fetchGachaLogs,
  fetchAllUids,
  refreshGachaLogsFromUrl,
} from '../api/gacha';
import {
  analyzeGachaLogs,
  GachaLogItem,
  PoolEntry,
  GachaAnalysis,
} from '../utils/analyzeGacha';
import { format } from 'date-fns';

const baseUrl = import.meta.env.BASE_URL;

const { t } = useI18n({
  useScope: 'global',
  inheritLocale: true
})

enum GameType {
  StarRail = 'starrail',
  Zenless = 'zenless'
}

enum QueryMode {
  UID = 'uid',
  URL = 'url'
}

const uid = ref('');
const gachaUrl = ref('');
const queryMode = ref<QueryMode>(QueryMode.UID);
const gameType = ref<GameType>(GameType.StarRail);
const loading = ref(false);
const groupedLogs = ref<Record<string, GachaLogItem[]>>({});
const analysisResults = ref<Record<string, GachaAnalysis>>({});
const storedUids = ref<string[]>([]);
const loadingUids = ref(false);
const activeTab = ref('11');
const showCount = ref(50);
const expanded = ref(false);
const show5StarOnly = ref(false);

const poolOrder = computed<string[]>(() => gameType.value === GameType.StarRail
  ? ['11', '12', '1', '2']
  : ['2002', '3002', '1001', '5001']);

const entries = computed<PoolEntry[]>(() =>
  poolOrder.value.map((poolId: string) => {
    const logs = groupedLogs.value[poolId] || [];
    const analysis = analysisResults.value[poolId] || analyzeGachaLogs([]);
    return { poolId, logs, analysis };
  })
);

const handleDatalistSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  nextTick(() => {
    target.blur();
    if (target.value.length === 9) runAnalysis();
  });
};

const avgPity = (pulls: number[]) =>
  Math.round(pulls.reduce((a, b) => a + b, 0) / pulls.length || 0);

const filteredLogs = (logs: GachaLogItem[]) =>
  [...logs]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .filter((log) => !show5StarOnly.value || log.rank_type === '5')
    .slice(0, showCount.value);

const hasAnyLogs = computed(() =>
  entries.value.some((e) => e.logs.length)
);

onMounted(async () => {
  loadingUids.value = true;
  try {
    storedUids.value = await fetchAllUids();
  } finally {
    loadingUids.value = false;
  }
});

function onUidInput() {
  uid.value = uid.value.replace(/\D/g, '');
  const maxLength = gameType.value === GameType.Zenless ? 8 : 9;
  if (uid.value.length > maxLength) {
    uid.value = uid.value.slice(0, maxLength);
  }
}

function handleEnterKey() {
  if (canAnalyze.value) {
    runAnalysis();
  }
}

async function runAnalysis() {
  const currentGameType = gameType.value;
  console.debug('[GachaAnalyzer] 开始分析，游戏类型:', currentGameType);
  console.debug('[GachaAnalyzer] 基础URL:', baseUrl);
  
  if (queryMode.value === 'uid') {
    const isStarRail = currentGameType === GameType.StarRail;
    const isValid = isStarRail
      ? /^[1-9]\d{8}$/.test(uid.value)
      : /^[1-9]\d{7}$/.test(uid.value);
    if (!isValid) {
      console.warn('[GachaAnalyzer] 无效的UID:', uid.value);
      return alert(`请输入有效的 UID（${isStarRail ? '9' : '8'} 位数字，不以 0 开头）`);
    }
  }
  if (queryMode.value === 'url' && !gachaUrl.value) {
    console.warn('[GachaAnalyzer] 缺少抽卡记录URL');
    return alert('请输入抽卡记录 URL');
  }

  loading.value = true;
  console.debug('[GachaAnalyzer] 开始加载数据...');
  
  try {
    let data: Record<string, GachaLogItem[]> = {};
    if (queryMode.value === QueryMode.UID) {
      console.debug(`[GachaAnalyzer] 发送UID请求: ${currentGameType}`, {uid: uid.value});
      await refreshGachaLogs(uid.value, currentGameType);
      data = await fetchGachaLogs(uid.value);
      console.debug('[GachaAnalyzer] 获取到抽卡记录数据:', {count: Object.values(data).flat().length});
    } else if (queryMode.value === QueryMode.URL) {
      console.debug(`[GachaAnalyzer] 发送URL请求: ${currentGameType}`, {url: gachaUrl.value});
      const uidFromUrl = await refreshGachaLogsFromUrl(gachaUrl.value, currentGameType);
      data = await fetchGachaLogs(uidFromUrl);
      console.debug('[GachaAnalyzer] 从URL获取到抽卡记录数据:', {uid: uidFromUrl, count: Object.values(data).flat().length});
    }

    groupedLogs.value = data;
    analysisResults.value = Object.fromEntries(
      poolOrder.value.map((poolId: string) => {
        const logs = data[poolId] || [];
        console.debug(`[GachaAnalyzer] 分析卡池 ${poolId}`, {count: logs.length});
        return [poolId, analyzeGachaLogs(logs)];
      })
    );
    console.debug('[GachaAnalyzer] 分析完成', {totalPulls: totalPulls.value});
  } catch (e: any) {
    console.error('[GachaAnalyzer] 分析过程中出错:', e);
    let errorMsg = e.message;
    const retcodeMatch = e.message.match(/retcode=(-?\d+)/);
    if (retcodeMatch) {
      const retcode = parseInt(retcodeMatch[1]);
      console.error('[GachaAnalyzer] 错误码:', retcode);
      
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
    console.error('[GachaAnalyzer] 错误信息:', errorMsg);
    alert(`操作失败：${errorMsg}`);
    groupedLogs.value = {};
    analysisResults.value = {};
  } finally {
    loading.value = false;
    console.debug('[GachaAnalyzer] 加载状态结束');
  }
}

const formatTime = (t: string) => format(new Date(t), 'yyyy-MM-dd HH:mm');

const canAnalyze = computed(() =>
  (queryMode.value === 'uid'
    ? gameType.value === 'zenless'
      ? /^[1-9]\d{7}$/.test(uid.value)
      : /^[1-9]\d{8}$/.test(uid.value)
    : !!gachaUrl.value) &&
  !loading.value &&
  !loadingUids.value
);

const totalPulls = computed(() =>
  entries.value.reduce((sum, e) => sum + e.analysis.total, 0)
);
const totalFiveStar = computed(() =>
  entries.value.reduce((sum, e) => sum + e.analysis.fiveStarCount, 0)
);
const maxCurrentPity = computed(() => {
  const characterEntry = entries.value.find(e => e.poolId === '11');
  return characterEntry ? characterEntry.analysis.currentPity : 0;
});

const isNewestFiveStar = (
  item: { name: string; lastTime: string },
  entry: PoolEntry
) => item.lastTime === entry.analysis.fiveStarDetails[0]?.lastTime;
</script>

<style scoped>
.gacha-analyzer {
  max-width: 900px;
  margin: 2rem auto;
  padding: 0 1rem;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  color: var(--text);
}

.game-type-selector {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin: 1rem 0 2rem;
}

.type-card {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  flex-direction: row;
  /* 横向排列图标和文字 */
  width: auto;
  /* 根据内容自动宽度 */
  height: auto;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  font-size: 14px;
}

.type-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.type-card img {
  width: 20px;
  height: 20px;
}

.type-card span {
  font-weight: 500;
  font-size: 13px;
  color: #000;
}

.type-card.active {
  background: #1f2937;
}

.type-card.active span {
  color: #fff;
}


.type-card.active span {
  color: #fff;
}


.control-cards-container {
  perspective: 1000px;
  margin-bottom: 3rem;
  display: flex;
  justify-content: center;
}

.control-card {
  position: relative;
  width: 220px;
  height: 60px;
  margin: 0 auto 3rem;
  transition: transform 0.6s;
  transform-style: preserve-3d;
  transform-origin: center;
}

.control-card.active {
  transform: rotateY(0deg);
}

.control-card.flipped {
  transform: rotateY(180deg);
}

.card-face {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 1rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  left: 0;
  right: 0;
}

.card-back {
  transform: rotateY(180deg);
}

.input-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.input-group span {
  font-weight: bold;
  cursor: pointer;
}

.input-group input {
  flex: 1;
  padding: 0.4rem 0.6rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.4rem 1rem;
  font-size: 0.95rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.analyze-btn {
  position: absolute;
  bottom: -1.5rem;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(90deg, #4e54c8, #8f94fb);
  color: #fff;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.analyze-btn:hover:not(:disabled) {
  background: linear-gradient(90deg, #3b40a4, #7d82e8);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin: 20px 0;
}

.loading-gif {
  width: 80px;
  height: 80px;
}

.loading-text {
  animation: bounce 0.8s infinite alternate;
  font-size: 18px;
  font-weight: bold;
}

@keyframes bounce {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-3px);
  }
}

.summary-cards {
  display: flex;
  justify-content: space-around;
  margin-bottom: 3rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.summary-item {
  flex: 1;
  min-width: 200px;
  max-width: 300px;
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
  justify-content: center;
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

.pool-section {
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.overview {
  margin: 0.5rem 0;
  font-size: 0.95rem;
  color: var(--text);
  text-align: center;
}

.five-star-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
  place-items: center;
  justify-content: center;
}

.five-star-card {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  width: 100%;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08),
    0 2px 6px rgba(0, 0, 0, 0.05);
  position: relative;
  border: 1px solid rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;
}

.five-star-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12),
    0 3px 8px rgba(0, 0, 0, 0.08);
}

.five-star-card.highlight {
  border: 2px solid var(--rank-5);
  box-shadow: 0 4px 20px rgba(75, 85, 99, 0.15),
    0 2px 6px rgba(75, 85, 99, 0.1);
}

.avatar {
  width: 64px;
  height: 64px;
  background: #dee2e6;
  border-radius: 50%;
  object-fit: contain;
  max-width: 100%;
  max-height: 100%;
}

.detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}


.stats {
  display: flex;
  gap: 0.5rem;
  margin: 0.5rem 0;
  justify-content: center;
}

.badge {
  background: var(--secondary);
  color: #453;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  font-size: 0.85rem;
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
  background: #ccccff;
}

.no-data {
  text-align: center;
  margin-top: 2rem;
  color: var(--secondary);
  white-space: pre-line;
}
</style>
