<template>
  <div class="enka-profile">
    <!-- 游戏切换 Tabs -->
    <div class="game-tabs">
      <button class="game-tab" :class="{ active: selectedGame === 'genshin' }" @click="selectedGame = 'genshin'">
        <span class="tab-label">{{ t('gameTypes.genshin') }}</span>
        <div class="tab-decoration"></div>
      </button>
      <button class="game-tab" :class="{ active: selectedGame === 'zzz' }" @click="selectedGame = 'zzz'">
        <span class="tab-label">{{ t('gameTypes.zenless') }}</span>
        <div class="tab-decoration"></div>
      </button>
    </div>

    <div class="header">
      <h2>{{ t('enka.playerProfile') }}</h2>
    </div>

    <!-- 输入 UID 和查询 -->
    <div class="controls">
      <div class="input-wrapper">
        <label for="uid-input">{{ t('controls.uidLabel') }}:</label>
        <input list="uid-list" v-model="uid" :placeholder="t('controls.uidPlaceholder')" @input="onUidInput"
          @change="handleDatalistSelect" @keydown.enter.prevent="handleEnterKey"
          :maxlength="selectedGame === 'zzz' ? 8 : 9" class="uid-input" />
        <datalist id="uid-list">
          <option v-for="u in storedUids" :key="u" :value="u" />
        </datalist>
      </div>
      <button @click="runAnalysis" :disabled="isLoading" class="btn-query">
        <span v-if="!isLoading">{{ queryButtonText }}</span>
        <span v-else class="loader"></span>
      </button>
    </div>

    <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

    <!-- 展示资料卡片 -->
    <div v-if="data" class="data-section">
      <div class="profile-card">
        <h3>{{ t('enka.playerInfo') }}</h3>
        <ul>
          <li><strong>{{ t('enka.nickname') }}:</strong> {{ data.playerInfo.nickname }}</li>
          <li><strong>{{ t('enka.level') }}:</strong> {{ data.playerInfo.level }}</li>
          <li><strong>{{ t('enka.worldLevel') }}:</strong> {{ data.playerInfo.worldLevel }}</li>
          <li v-if="data.playerInfo.finishAchievementNum">
            <strong>{{ t('enka.achievements') }}:</strong> {{ data.playerInfo.finishAchievementNum }}
          </li>
          <li v-if="data.playerInfo.towerFloorIndex">
            <strong>{{ t('enka.abyssHighest') }}:</strong>
            {{ data.playerInfo.towerFloorIndex }}-{{ data.playerInfo.towerLevelIndex }}
          </li>
        </ul>
      </div>

      <!-- 角色网格 -->
      <div class="characters-grid">
        <div v-for="character in data.avatarInfoList" :key="character.avatarId" class="char-card"
          @click="openModal(character)">
          <div class="char-img">
            <img :src="getAvatarSrc(character.avatarId)" :alt="getCharacterName(character.avatarId)" />
          </div>
          <div class="char-info">
            <span class="char-name">{{ getCharacterName(character.avatarId) }}</span>
            <span class="char-level">Lv.{{ getCharacterLevel(character) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 角色详情模态框 -->
    <AvatarModal v-if="showModal" :character="currentCharacter" @close="closeModal" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, nextTick, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  fetchGenshinData,
  fetchZZZData,
  getCachedData,
} from '../api/enka';
import type { EnkaData } from '../type/genshin';
import AvatarModal from './AvatarModal.vue';
import characters from '../dict/characters.json';

export default defineComponent({
  name: 'EnkaProfile',
  components: { AvatarModal },
  setup() {
    const { t } = useI18n();
    const uid = ref('');
    const storedUids = ref<string[]>([]);
    const isLoading = ref(false);
    const errorMsg = ref('');
    const data = ref<EnkaData | null>(null);
    const showModal = ref(false);
    const currentCharacter = ref<any>(null);
    const uidInput = ref<HTMLInputElement>();
    const selectedGame = ref<'genshin' | 'zzz'>('genshin');

    const gameStorageKey = computed(() => `storedUids_${selectedGame.value}`);

    const queryButtonText = computed(() =>
      selectedGame.value === 'genshin'
        ? t('enka.genshinArchive')
        : t('enka.zenlessArchive')
    );

    onMounted(() => {
      const stored = localStorage.getItem(gameStorageKey.value);
      storedUids.value = JSON.parse(stored || '[]');
    });

    watch(selectedGame, (newVal) => {
      uid.value = '';
      const key = `storedUids_${newVal}`;
      const stored = localStorage.getItem(key);
      storedUids.value = JSON.parse(stored || '[]');
    });

    const onUidInput = () => {
      uid.value = uid.value.replace(/[^0-9]/g, '');
      const maxLength = selectedGame.value === 'zzz' ? 8 : 9;
      if (uid.value.length > maxLength) {
        uid.value = uid.value.slice(0, maxLength);
      }
    };

    const handleDatalistSelect = (e: Event) => {
      const input = e.target as HTMLInputElement;
      nextTick(() => {
        input.blur();
        const required = selectedGame.value === 'zzz' ? 8 : 9;
        if (input.value.length === required) {
          runAnalysis();
        }
      });
    };

    const handleEnterKey = () => {
      const required = selectedGame.value === 'zzz' ? 8 : 9;
      if (/^\d+$/.test(uid.value) && uid.value.length === required) {
        runAnalysis();
      }
    };

    const getCharacterName = (avatarId: string | number) => {
      const char = (characters as any)[String(avatarId)];
      return char
        ? t(`characters.${char.NameTextMapHash}`, String(avatarId))
        : String(avatarId);
    };

    const getCharacterLevel = (c: any) => {
      return c.propMap?.['4001']?.val ?? '?';
    };

    const getAvatarSrc = (id: number | string) => {
      const character = (characters as any)[String(id)];
      if (character && character.SideIconName) {
        return `https://enka.network/ui/${character.SideIconName}.png`;
      }
      return `/assets/avatars/${id}.png`;
    };

    const runAnalysis = async () => {
      if (isLoading.value) return;

      await nextTick();
      uidInput.value?.blur();
      isLoading.value = true;
      errorMsg.value = '';

      try {
        if (selectedGame.value === 'genshin') {
          try {
            data.value = await getCachedData(uid.value);
          } catch {
            data.value = null;
          }
          data.value = await fetchGenshinData(uid.value);
        } else {
          data.value = await fetchZZZData(uid.value);
        }

        if (!storedUids.value.includes(uid.value)) {
          storedUids.value.unshift(uid.value);
          storedUids.value = storedUids.value.slice(0, 10);
          localStorage.setItem(gameStorageKey.value, JSON.stringify(storedUids.value));
        }
      } catch (e: any) {
        errorMsg.value = e.message || t('errors.generic');
      } finally {
        isLoading.value = false;
      }
    };

    const openModal = (c: any) => {
      currentCharacter.value = c;
      showModal.value = true;
    };

    const closeModal = () => {
      showModal.value = false;
    };

    return {
      t,
      uid,
      storedUids,
      isLoading,
      errorMsg,
      data,
      showModal,
      currentCharacter,
      uidInput,
      selectedGame,
      queryButtonText,
      onUidInput,
      runAnalysis,
      openModal,
      closeModal,
      getCharacterName,
      getCharacterLevel,
      getAvatarSrc,
      handleDatalistSelect,
      handleEnterKey,
    };
  },
});
</script>

<style scoped>
.enka-profile {
  max-width: 1600px;
  margin: 2rem auto;
  padding: 0 2rem;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  box-sizing: border-box;
}

.game-tabs {
  position: fixed;
  top: 50%;
  right: -2rem;
  transform: translateY(-50%);
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-right: 0.5rem;
  filter: drop-shadow(-2px 0 4px rgba(0, 0, 0, 0.1));
}

.game-tab {
  position: relative;
  background: #fff;
  border: none;
  width: 52px;
  height: 130px;
  padding: 0;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow:
    -6px 6px 16px rgba(0, 0, 0, 0.1),
    inset -3px 0 6px rgba(0, 0, 0, 0.08);
  border-radius: 12px 0 0 12px;
  overflow: hidden;
  transform-origin: right center;
}

.game-tab:hover {
  width: 68px;
  transform: translateX(-12px) rotateZ(-3deg);
  box-shadow:
    -8px 8px 20px rgba(0, 0, 0, 0.15),
    inset -3px 0 6px rgba(0, 0, 0, 0.1);
}

.game-tab.active {
  width: 72px;
  transform: translateX(-18px) rotateZ(-5deg);
  background: linear-gradient(45deg, #6366F1, #4F46E5);
  box-shadow:
    -8px 8px 24px rgba(0, 0, 0, 0.2),
    inset -3px 0 6px rgba(255, 255, 255, 0.1);
}

.game-tab.active .tab-label {
  color: white;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.tab-label {
  position: absolute;
  writing-mode: vertical-rl;
  text-orientation: upright;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-weight: 700;
  font-size: 1.1rem;
  color: #4b5563;
  transition: all 0.3s ease;
  letter-spacing: 2px;
}

.tab-decoration {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: 28px;
  height: 4px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 2px;
  opacity: 0.8;
  filter: blur(1px);
}

.controls {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 1rem;
  gap: 1rem;
}

.btn-query {
  padding: 0.8rem 2.2rem;
  background: linear-gradient(45deg, #3B82F6, #6366F1);
  color: white;
  border: none;
  border-radius: 1rem;
  font-weight: 600;
  font-size: 1.1rem;
  box-shadow:
    0 6px 12px -2px rgba(0, 0, 0, 0.15),
    0 4px 8px -2px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.2s ease;

}

.btn-query:hover:not(:disabled) {
  transform: translateY(-3px) scale(1.05);
  box-shadow:
    0 12px 24px -4px rgba(0, 0, 0, 0.2),
    0 6px 12px -4px rgba(0, 0, 0, 0.1);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-secondary {
  background: #10B981;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-1px);
}

.loader {
  display: inline-block;
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid rgba(255, 255, 255, 0.6);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-msg {
  color: #EF4444;
  margin: 1rem 0;
  text-align: center;
  font-weight: 500;
}

.data-section {
  margin-top: 2rem;
}

.profile-card {
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.profile-card h3 {
  font-size: 1.5rem;
  color: #1E3A8A;
  margin-bottom: 1rem;
}

.profile-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.75rem;
}

.profile-card li {
  font-size: 1rem;
  display: flex;
  gap: 0.5rem;
}

.profile-card strong {
  color: #1E3A8A;
  min-width: 100px;
}

.characters-grid {
  display: grid;
  gap: 2rem;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
}

.char-card {
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.char-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px -1px rgba(0, 0, 0, 0.15);
}

.char-img {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  border: 2px solid #e2e8f0;
  overflow: hidden;
  position: relative;
}

.char-img img {
  width: 100%;
  height: auto;
  transform: scale(1.2);
  transform-origin: 50% 100%;
}

.char-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  text-align: left;
}

.char-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: #1e293b;
  line-height: 1.2;
}

.char-level {
  font-size: 0.8rem;
  color: #64748b;
}

@media (max-width: 768px) {
  .game-tabs {
    top: auto;
    bottom: 0;
    right: 50%;
    transform: translateX(50%);
    flex-direction: row;
    padding: 0.8rem;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(8px);
    border-radius: 24px 24px 0 0;
    box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.15);
    gap: 1rem;
  }

  .game-tab {
    width: 100px;
    height: 52px;
    border-radius: 16px 16px 0 0;
    transform-origin: center bottom;
  }

  .game-tab:hover {
    width: 110px;
    transform: translateY(-10px) rotateZ(3deg);
  }

  .game-tab.active {
    width: 120px;
    transform: translateY(-15px) rotateZ(5deg);
  }

  .tab-label {
    writing-mode: horizontal-tb;
    font-size: 1rem;
    letter-spacing: normal;
  }

  .characters-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }

  .char-card {
    flex-direction: row;
    padding: 1.5rem;
    gap: 1.5rem;
  }

  .char-img {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 2px solid #e2e8f0;
    overflow: hidden;
    position: relative;
  }

  .char-img img {
    width: 100%;
    height: auto;
    transform: scale(1.5);
    transform-origin: 50% 70%;
  }
}

/* 添加错误提示动画 */
.error-msg {
  animation: shake 0.4s ease-in-out;
}

@keyframes shake {

  0%,
  100% {
    transform: translateX(0);
  }

  20% {
    transform: translateX(-10px);
  }

  40% {
    transform: translateX(10px);
  }

  60% {
    transform: translateX(-7px);
  }

  80% {
    transform: translateX(7px);
  }
}
</style>