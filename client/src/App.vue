<template>
  <div id="app">
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