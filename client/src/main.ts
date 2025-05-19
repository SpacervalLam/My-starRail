import { createApp } from 'vue';
import { createI18n } from 'vue-i18n';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faChartPie, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import App from './App.vue';
import router from './router';
import en from './i18n/en.json';
import zhCN from './i18n/zh-CN.json';
import ja from './i18n/ja.json';

// 添加图标到库
library.add(faChartPie, faUser);
const messages = {
  en,
  'zh-CN': zhCN,
  ja
};

// 注册Font Awesome组件

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: 'zh-CN',
  fallbackLocale: 'en',
  messages
});

const app = createApp(App);
app.use(i18n);
app.use(router);
app.component('font-awesome-icon', FontAwesomeIcon);
app.mount('#app');
