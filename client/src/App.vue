<template>
  <div id="app">
    <h1>StarRail 抽卡分析工具</h1>
    <GachaAnalyzer />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import GachaAnalyzer from './components/GachaAnalyzer.vue';

export default defineComponent({
  components: { GachaAnalyzer }
});
</script>

<style scoped>
h1 {
  text-align: center;
  margin: 1rem;
}
</style>