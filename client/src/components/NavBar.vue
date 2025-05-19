<template>
  <nav class="navbar">
    <div class="navbar-content">
      <div class="brand">
        <img src="/assets/logo.png" alt="App Logo" class="logo" :aria-label="t('navbar.logoAlt')" />
        <h1 class="app-title">{{ t('navbar.title') }}</h1>
      </div>

      <div class="menu-wrapper" v-click-outside="closeMenu">
        <button class="menu-trigger" @click.stop="toggleMenu" :aria-expanded="menuOpen ? 'true' : 'false'"
          :aria-label="t('navbar.menuButton')">
          <svg class="icon-dots" viewBox="0 0 24 24">
            <circle cx="12" cy="6" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="18" r="1.5" />
          </svg>
        </button>

        <transition name="dropdown">
          <div v-if="menuOpen" class="dropdown" role="menu">
          <button class="dropdown-item" @click="openSettings" role="menuitem">
              {{ t('navbar.settings') }}
            </button>
          </div>
        </transition>
      </div>
    </div>

    <SettingsModal :show="settingsOpen" @close="settingsOpen = false" />
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import SettingsModal from './SettingsModal.vue';

const { t, locale } = useI18n({
  useScope: 'global',
  inheritLocale: true
})

// 响应式状态
const menuOpen = ref(false);
const settingsOpen = ref(false);

// 菜单操作
const closeMenu = () => menuOpen.value = false;
const toggleMenu = () => menuOpen.value = !menuOpen.value;

// 打开设置
const openSettings = () => {
  settingsOpen.value = true;
  closeMenu();
};

// 点击外部指令实现
const clickOutsideMap = new WeakMap<HTMLElement, (event: MouseEvent) => void>();

const vClickOutside = {
  mounted(el: HTMLElement, binding: any) {
    const handler = (event: MouseEvent) => {
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value(event);
      }
    };
    clickOutsideMap.set(el, handler);
    document.addEventListener('click', handler);
  },
  beforeUnmount(el: HTMLElement) {
    const handler = clickOutsideMap.get(el);
    if (handler) {
      document.removeEventListener('click', handler);
      clickOutsideMap.delete(el);
    }
  }
};
</script>

<style scoped>
:root {
  --navbar-height: 60px;
  --primary-color: #1a73e8;
  --hover-bg: rgba(0, 0, 0, 0.05);
  --transition-duration: 0.2s;
}

.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--navbar-height);
  background: #B0E0E6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.navbar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 20px;
  width: 100%;
  box-sizing: border-box;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  width: 36px;
  height: 36px;
  object-fit: contain;
}

.app-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.menu-wrapper {
  position: relative;
}

.menu-trigger {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  transition: transform var(--transition-duration);
  display: flex;
  align-items: center;
}

.menu-trigger:hover {
  transform: scale(1.1);
}

.icon-dots {
  width: 24px;
  height: 24px;
  fill: currentColor;
}

.dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  min-width: 180px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 1001;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity var(--transition-duration) ease,
    transform var(--transition-duration) ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.dropdown-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  color: #333;
  transition: background-color var(--transition-duration);
  cursor: pointer;
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  font-family: inherit;
}

.dropdown-item:hover {
  background-color: var(--hover-bg);
}

.dropdown-label {
  margin-right: 12px;
  font-size: 0.9em;
  white-space: nowrap;
}
</style>
