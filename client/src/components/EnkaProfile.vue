<template>
  <div class="enka-profile">
    <h2>{{ t('enka.title') }}</h2>
    
    <div class="input-group">
      <label for="uid-input">{{ t('controls.uidLabel') }}:</label>
      <input
        id="uid-input"
        v-model="uid"
        type="text"
        :placeholder="t('enka.uidPlaceholder')"
        class="uid-input"
      />
    </div>

    <div class="button-group">
      <button 
        @click="startGenshin" 
        class="action-button genshin-button"
        :disabled="isLoading"
      >
        {{ t('enka.fetchGenshin') }}
      </button>
      <button 
        @click="startGenshinFCVa" 
        class="action-button fcv-button"
        :disabled="isLoading"
      >
        {{ t('enka.fetchFCVa') }}
      </button>
    </div>

    <div v-if="isLoading" class="loading-container">
      <img src="/assets/gif/loading.gif" alt="Loading" class="loading-gif">
      <span class="loading-text">{{ t('controls.loading') }}</span>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="data" class="data-display">
      <h3>{{ t('enka.playerInfo') }}</h3>
      <div class="player-info">
        <p><strong>{{ t('enka.nickname') }}:</strong> {{ data.playerInfo.nickname }}</p>
        <p><strong>{{ t('enka.level') }}:</strong> {{ data.playerInfo.level }}</p>
        <p><strong>{{ t('enka.signature') }}:</strong> {{ data.playerInfo.signature }}</p>
        <p><strong>{{ t('enka.worldLevel') }}:</strong> {{ data.playerInfo.worldLevel }}</p>
        <p v-if="data.playerInfo.finishAchievementNum"><strong>{{ t('enka.achievements') }}:</strong> {{ data.playerInfo.finishAchievementNum }}</p>
              <p v-if="data.playerInfo.towerFloorIndex && data.playerInfo.towerLevelIndex">
                <strong>{{ t('enka.spiralAbyss') }}:</strong> 
                {{ t('enka.floorLabel', [data.playerInfo.towerFloorIndex]) }} {{ t('enka.chamberLabel', [data.playerInfo.towerLevelIndex]) }}
              </p>
      </div>

      <h3>{{ t('enka.characterList') }}</h3>
      <div class="character-list">
        <div class="character-grid">
          <div 
            v-for="character in data.avatarInfoList" 
            :key="character.avatarId"
            class="character-card"
            @click="openModal(character)"
          >
            <div class="character-basic">
              <p><strong>{{ t('enka.characterName') }}:</strong> {{ getCharacterName(character.avatarId) }}</p>
              <p><strong>{{ t('enka.level') }}:</strong> Lv.{{ character.propMap['4001']?.val }}</p>
            </div>
          </div>
          
          <AvatarModal 
            v-if="showModal"
            :character="currentCharacter"
            @close="closeModal"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { fetchGenshinData, fetchFCVaData } from '../api/enka';
import type { GenshinData, FCVaData } from '../api/enka';
import AvatarModal from './avatarModal.vue';
import characters from '../dict/characters.json';
import loc from '../dict/loc.json';

type LocJson = {
  [lang: string]: {
    [key: string]: string;
  };
};

export default defineComponent({
  name: 'EnkaProfile',
  components: {
    AvatarModal
  },
  setup() {
    const getCharacterName = (avatarId: string) => {
      const character = characters[avatarId as keyof typeof characters];
      if (!character) return avatarId;
      
      const nameTextMapHash = character.NameTextMapHash;
      const zhName = (loc as LocJson)['zh-cn'][String(nameTextMapHash)];
      return zhName || avatarId;
    };
    const { t } = useI18n();
    const uid = ref('');
    const isLoading = ref(false);
    const error = ref('');
    const data = ref<GenshinData | FCVaData | null>(null);
    const showModal = ref(false);
    const currentCharacter = ref<any>(null);

    const validateUid = (uid: string) => {
      return /^\d{9}$/.test(uid);
    };

    const getPropName = (key: string | number) => {
      const keyStr = String(key);
      return t(`props.${keyStr}`) || keyStr;
    };

    const equipNameMap: Record<string, string> = {
      '375145': t('equip.weapon_sword_01'),
      '378571': t('equip.weapon_sword_02'),
      '128302': t('equip.weapon_claymore_01'),
      '342196': t('equip.weapon_bow_01'),
      '389022': t('equip.artifact_flower_01'),
      '389023': t('equip.artifact_plume_01'),
      '389024': t('equip.artifact_sands_01'),
      '389025': t('equip.artifact_goblet_01'),
      '389026': t('equip.artifact_circlet_01')
    };

    const getEquipName = (hash: string) => {
      return equipNameMap[hash] || hash;
    };

    const formatStatValue = (key: string | number, value: number) => {
      const keyStr = String(key);
      const percentKeys = ['20','22','23','26','28','40','41','42','43','44','45','46','50'];
      if (percentKeys.includes(keyStr)) {
        return (value * 100).toFixed(1) + '%';
      }
      return Math.round(value);
    };

    const openModal = (character: any) => {
      currentCharacter.value = character;
      showModal.value = true;
    };

    const closeModal = () => {
      showModal.value = false;
    };

    const startGenshin = async () => {
      if (!validateUid(uid.value)) {
        error.value = t('enka.invalidUid');
        return;
      }

      isLoading.value = true;
      error.value = '';
      data.value = null;
      try {
        data.value = await fetchGenshinData(uid.value);
      } catch (err) {
        error.value = err instanceof Error ? err.message : t('enka.fetchGenshin') + t('controls.loading');
      } finally {
        isLoading.value = false;
      }
    };

    const startGenshinFCVa = async () => {
      if (!validateUid(uid.value)) {
        error.value = t('enka.invalidUid');
        return;
      }

      isLoading.value = true;
      error.value = '';
      data.value = null;
      try {
        data.value = await fetchFCVaData(uid.value);
      } catch (err) {
        error.value = err instanceof Error ? err.message : t('enka.fetchFCVa') + t('controls.loading');
      } finally {
        isLoading.value = false;
      }
    };

    return {
      t,
      uid,
      isLoading,
      error,
      data,
      showModal,
      currentCharacter,
      getCharacterName,
      getPropName,
      getEquipName,
      formatStatValue,
      startGenshin,
      startGenshinFCVa,
      openModal,
      closeModal
    };
  }
});
</script>

<style scoped>
.enka-profile {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
}

h2 {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}

.input-group {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.input-group label {
  margin-right: 10px;
  font-weight: bold;
}

.uid-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  flex-grow: 1;
}

.button-group {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.action-button {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
}

.action-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.action-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin: 20px 0;
}

.loading-gif {
  width: 80px;
  height: 80px;
}

.loading-text {
  animation: bounce 0.8s infinite alternate;
  font-size: 18px;
  font-weight: bold;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

.genshin-button {
  background-color: #ff9678;
  color: white;
}

.fcv-button {
  background-color: #78a8ff;
  color: white;
}

.error-message {
  color: #ff4444;
  padding: 10px;
  background-color: #ffeeee;
  border-radius: 4px;
  margin-bottom: 20px;
}

.data-display {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.player-info {
  margin-bottom: 20px;
}

.player-info p {
  margin: 5px 0;
}

.character-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 15px;
}

.character-card {
  background-color: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  overflow: hidden;
  position: relative;
}

.character-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.character-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.character-card:hover::before {
  opacity: 1;
}

.character-basic {
  margin-bottom: 10px;
}

.character-basic p {
  margin: 5px 0;
  font-size: 14px;
}



.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-top: 10px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.stat-name {
  color: #666;
}

.stat-value {
  font-weight: bold;
}

.equip-item {
  margin-top: 15px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.equip-item h4 {
  margin: 0 0 5px 0;
  font-size: 14px;
}

.equip-item p {
  margin: 3px 0;
  font-size: 13px;
  color: #555;
}
</style>
