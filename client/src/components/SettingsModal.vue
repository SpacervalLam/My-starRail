<template>
  <transition name="modal">
    <div v-if="show" class="modal-mask" @click.self="handleClose">
      <div class="modal-container">
        <div class="modal-header">
          <h2 class="modal-title">{{ t('settings.title') }}</h2>
          <button class="close-btn" @click="$emit('close')">
            <svg class="icon-close" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div class="modal-content">
          <!-- 主题设置 -->
          <div class="setting-item">
            <div class="setting-info">
              <h3 class="setting-title">{{ t('settings.theme') }}</h3>
              <p class="setting-desc">{{ t('settings.themeDesc') }}</p>
            </div>
            <div class="setting-control">
              <select v-model="selectedTheme" class="theme-select">
                <option value="system">{{ t('settings.system') }}</option>
                <option value="light">{{ t('settings.light') }}</option>
                <option value="dark">{{ t('settings.dark') }}</option>
              </select>
            </div>
          </div>

          <!-- 通知设置 -->
          <div class="setting-item">
            <div class="setting-info">
              <h3 class="setting-title">{{ t('settings.notifications') }}</h3>
              <p class="setting-desc">{{ t('settings.notificationsDesc') }}</p>
            </div>
            <div class="setting-control">
              <label class="switch">
                <input type="checkbox" v-model="notificationsEnabled">
                <span class="slider"></span>
              </label>
            </div>
          </div>

          <!-- 音量控制 -->
          <div class="setting-item">
            <div class="setting-info">
              <h3 class="setting-title">{{ t('settings.volume') }}</h3>
              <p class="setting-desc">{{ t('settings.volumeDesc') }}</p>
            </div>
            <div class="setting-control">
              <input 
                type="range" 
                v-model="volume" 
                min="0" 
                max="100" 
                class="volume-slider"
              >
              <span class="volume-value">{{ volume }}%</span>
            </div>
          </div>

          <!-- 语言选择 -->
          <div class="setting-item">
            <div class="setting-info">
              <h3 class="setting-title">{{ t('settings.language') }}</h3>
              <p class="setting-desc">{{ t('settings.languageDesc') }}</p>
            </div>
            <div class="setting-control">
              <select v-model="selectedLanguage" class="lang-select">
                <option 
                  v-for="(name, key) in locales" 
                  :key="key" 
                  :value="key"
                >
                  {{ name }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-primary" @click="saveSettings">
            {{ t('settings.save') }}
          </button>
          <button class="btn btn-secondary" @click="$emit('close')">
            {{ t('settings.cancel') }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n({ useScope: 'global' })

const props = defineProps({
  show: Boolean
})

const emit = defineEmits(['close'])

const handleClose = () => {
  emit('close')
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    document.body.classList.add('modal-open')
  } else {
    document.body.classList.remove('modal-open')
  }
})


// 支持的语言列表
const locales = {
  en: 'English',
  'zh-CN': '简体中文',
  ja: '日本語'
} as const

// 设置项状态
const selectedTheme = ref<'system' | 'light' | 'dark'>('system')
const notificationsEnabled = ref(true)
const volume = ref(80)
const selectedLanguage = ref(locale.value)

// 初始化设置
onMounted(() => {
  loadSettings()
})

// 加载保存的设置
const loadSettings = () => {
  const savedSettings = localStorage.getItem('app-settings')
  if (savedSettings) {
    try {
      const settings = JSON.parse(savedSettings)
      selectedTheme.value = settings.theme || 'system'
      notificationsEnabled.value = settings.notifications ?? true
      volume.value = settings.volume || 80
      selectedLanguage.value = settings.language || 'zh-CN'
    } catch (e) {
      console.error('Failed to load settings:', e)
    }
  }
}

// 保存设置
const saveSettings = () => {
  const settings = {
    theme: selectedTheme.value,
    notifications: notificationsEnabled.value,
    volume: volume.value,
    language: selectedLanguage.value
  }

  localStorage.setItem('app-settings', JSON.stringify(settings))
  applyTheme(selectedTheme.value)
  locale.value = selectedLanguage.value
  emit('close')
}

// 应用主题
const applyTheme = (theme: string) => {
  document.documentElement.setAttribute('data-theme', theme)
  if (theme === 'system') {
    document.documentElement.removeAttribute('data-theme')
  }
}

// 监听语言变化
watch(selectedLanguage, (newLang) => {
  locale.value = newLang
})

// 更新音量百分比CSS变量
watch(volume, (newVolume) => {
  document.documentElement.style.setProperty('--volume-percent', newVolume.toString())
})

// 初始化音量百分比
onMounted(() => {
  document.documentElement.style.setProperty('--volume-percent', volume.value.toString())
})
</script>

<style scoped>
.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  transition: opacity 0.3s ease;
}

.modal-container {
  width: min(90%, 600px);
  background: var(--modal-bg, rgba(255, 255, 255, 0.9));
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(12px);
  padding: 24px;
  transition: all 0.3s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.close-btn:hover {
  opacity: 0.8;
}

.icon-close {
  width: 24px;
  height: 24px;
  fill: var(--text-secondary);
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 0;
  border-bottom: 1px solid var(--border-color);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info {
  flex: 1;
  margin-right: 24px;
}

.setting-title {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0 0 4px;
}

.setting-desc {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.setting-control {
  min-width: 160px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 28px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #0077cc ;
  transition: 0.4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 24px;
  bottom: 4px;
  background: white;
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .slider {
  background: var(--primary-color);
}

input:checked + .slider:before {
  transform: translateX(-20px);
}

.volume-slider {
  width: 120px;
  height: 4px;
  background: linear-gradient(
    to right,
    var(--primary-color, #0077cc) 0%,
    var(--primary-color, #0077cc) calc((var(--volume-percent, 50%) - 0.1) * 1%),
    var(--slider-track, #e0e0e0) calc((var(--volume-percent, 50%) + 0.1) * 1%),
    var(--slider-track, #e0e0e0) 100%
  );
  border-radius: 2px;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  transition: background 0.2s ease;
}

/* 确保0%和100%时完全正确 */
.volume-slider[value="0"] {
  background: var(--slider-track, #e0e0e0) !important;
}

.volume-slider[value="100"] {
  background: var(--primary-color, #0077cc) !important;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--primary-color, #0077cc);
  border: 2px solid white;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.theme-select,
.lang-select {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--input-bg);
  color: var(--text-primary);
  width: 100%;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-primary {
  background: #0077cc;
  color: white;
}

.btn-secondary {
  background: var(--btn-secondary-bg);
  color: var(--text-primary);
}

/* 过渡动画 */
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transform: scale(0.95);
}
</style>