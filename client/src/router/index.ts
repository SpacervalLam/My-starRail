import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import EnkaProfile from '../components/EnkaProfile.vue';
import GachaAnalyzer from '../components/GachaAnalyzer.vue';

declare module 'vue-router' {
  interface RouteMeta {
    // 可以添加路由元信息类型
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/enka-profile',
    name: 'EnkaProfile',
    component: EnkaProfile
  },
  {
    path: '/gacha-analysis',
    name: 'GachaAnalyzer',
    component: GachaAnalyzer
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
