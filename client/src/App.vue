<template>
  <div class="layout">
    <Sidebar />
    <div class="main-content">
      <NavBar />
      <router-view v-slot="{ Component }">
        <component :is="Component" v-if="$route.path !== '/'"/>
        <div v-else class="welcome-page">
          <div class="welcome-content">
            <img src="/assets/logo.png" alt="App Logo" class="welcome-logo">
            <h1>{{ t('welcome.title') }}</h1>
            <p class="subtitle">{{ t('welcome.subtitle') }}</p>
            <div class="features">
              <div class="feature-card" @click="$router.push('/gacha-analysis')">
                <div class="feature-icon">🎮</div>
                <h3>{{ t('welcome.gachaAnalysis') }}</h3>
                <p>{{ t('welcome.gachaAnalysisDesc') }}</p>
              </div>
              <div class="feature-card" @click="$router.push('/enka-profile')">
                <div class="feature-icon">👤</div>
                <h3>{{ t('welcome.profile') }}</h3>
                <p>{{ t('welcome.profileDesc') }}</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon">⚙️</div>
                <h3>{{ t('welcome.moreFeatures') }}</h3>
                <p>{{ t('welcome.moreFeaturesDesc') }}</p>
              </div>
            </div>
          </div>
        </div>
      </router-view>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useI18n } from 'vue-i18n';
import Sidebar from './components/Sidebar.vue';
import NavBar from './components/NavBar.vue';

export default defineComponent({
  components: {
    Sidebar,
    NavBar,
  },
  setup() {
    const { t } = useI18n({
      inheritLocale: true,
      useScope: 'global'
    });
    return { t };
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

.welcome-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.welcome-content {
  text-align: center;
  max-width: 800px;
  padding: 2rem;
}

.welcome-logo {
  width: 120px;
  height: 120px;
  margin-bottom: 1.5rem;
}

h1 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 1rem;
}

.subtitle {
  font-size: 1.2rem;
  color: #7f8c8d;
  margin-bottom: 3rem;
}

.features {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 2rem;
}

.feature-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  width: 220px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  font-size: 1.2rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.feature-card p {
  font-size: 0.9rem;
  color: #7f8c8d;
}
</style>
