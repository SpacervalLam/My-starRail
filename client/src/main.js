import { createApp } from 'vue';
import { createI18n } from 'vue-i18n';
import App from './App.vue';
import en from './i18n/en.json';
import zhCN from './i18n/zh-CN.json';
import ja from './i18n/ja.json'; // 添加日语语言包

const messages = {
  en,
  'zh-CN': zhCN,
  ja
};

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: 'zh-CN',
  fallbackLocale: 'en',
  messages
});

const app = createApp(App);
app.use(i18n);
app.mount('#app');
