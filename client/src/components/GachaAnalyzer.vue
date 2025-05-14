<template>
  <div>
    <button @click="loadData">开始分析</button>
    <div v-if="loading">加载中...</div>
    <div v-else>
      <p>总记录数：{{ total }}</p>
      <table>
        <thead><tr><th>时间</th><th>名称</th><th>类型</th><th>稀有度</th></tr></thead>
        <tbody>
          <tr v-for="log in logs" :key="log.id">
            <td>{{ log.time }}</td>
            <td>{{ log.name }}</td>
            <td>{{ log.type }}</td>
            <td>{{ log.rank_type }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { getGachaUrl, fetchGachaLogs } from '../api/gacha';

export default defineComponent({
  setup() {
    const logs = ref<any[]>([]);
    const total = ref(0);
    const loading = ref(false);

    async function loadData() {
      loading.value = true;
      try {
        // 可选：先获取 URL
        await getGachaUrl();
        const data = await fetchGachaLogs();
        logs.value = data;
        total.value = data.length;
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
