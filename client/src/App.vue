<template>
  <div class="layout">
    <Sidebar />
    <div class="main-content">
      <NavBar />
      <router-view />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Sidebar from './components/Sidebar.vue';
import NavBar from './components/NavBar.vue';

export default defineComponent({
  components: {
    Sidebar,
    NavBar,
  },
});
</script>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 60px;
}

router-view {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}
</style>
