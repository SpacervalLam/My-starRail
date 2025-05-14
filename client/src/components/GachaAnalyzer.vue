<template>
  <div>
    <button @click="loadData">开始分析</button>
    <div v-if="loading">加载中...</div>
    <div v-else>
      <p>总记录数：{{ total }}</p>
      <table>
        <thead>
          <tr><th>时间</th><th>名称</th><th>类型</th><th>稀有度</th></tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log.id">
            <td>{{ log.time }}</td>
            <td>{{ log.name }}</td>
            <td>{{ log.gacha_type }}</td>
            <td>{{ log.rank_type }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { fetchGachaLogs } from '../api/gacha';

export default defineComponent({
  setup() {
    const logs = ref<any[]>([]);
    const total = ref(0);
    const loading = ref(false);

    async function loadData() {
      loading.value = true;
      try {
        // 调用 API
        const dataObj = await fetchGachaLogs();
        console.log('[GachaAnalyzer] fetchGachaLogs returned:', dataObj);

        // 如果不是对象，直接置空
        if (!dataObj || typeof dataObj !== 'object') {
          logs.value = [];
          total.value = 0;
          return;
        }

        // 扁平化所有池子的记录数组
        const allLogs = Object.values(dataObj).flat();
        logs.value = allLogs;
        total.value = allLogs.length;
      } catch (e) {
        console.error('加载抽卡记录失败', e);
        logs.value = [];
        total.value = 0;
      } finally {
        loading.value = false;
      }
    }

    return { logs, total, loading, loadData };
  }
});
</script>

<style scoped>
table { width: 100%; border-collapse: collapse; }
th, td { border: 1px solid #ccc; padding: 0.5rem; }
button { margin-bottom: 1rem; }
</style>