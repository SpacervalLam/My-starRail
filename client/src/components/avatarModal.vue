<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="avatar-modal" ref="modalRef">
      <button class="close-button" @click="closeModal">×</button>
      
      <div class="modal-content">
        <div class="character-basic">
          <h3>{{ getCharacterName(character.avatarId) }}</h3>
          <p>Lv.{{ character.propMap['4001']?.val }}</p>
        </div>
        
        <div class="character-details">
          <div class="character-stats">
            <h4>属性</h4>
            <div class="stat-grid">
              <div 
                v-for="(value, key) in character.fightPropMap" 
                :key="key" 
                class="stat-item"
              >
                <span class="stat-name">{{ getPropName(key) }}</span>
                <span class="stat-value">{{ formatStatValue(key, value) }}</span>
              </div>
            </div>
          </div>
          
          <div class="character-equipment">
            <div 
              v-for="equip in character.equipList" 
              :key="equip.itemId" 
              class="equip-item"
            >
              <h4>{{ getEquipName(equip.flat.nameTextMapHash) }}</h4>
              <p v-if="equip.weapon">武器等级: Lv.{{ equip.weapon.level }}</p>
              <p v-if="equip.reliquary">圣遗物等级: +{{ equip.reliquary.level }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import characters from '../dict/characters.json';
import loc from '../dict/loc.json';

type LocJson = {
  [lang: string]: {
    [key: string]: string;
  };
};

export default defineComponent({
  name: 'AvatarModal',
  props: {
    character: {
      type: Object,
      required: true
    }
  },
  setup(props, { emit }) {
    const { t } = useI18n();

    const getPropName = (key: string | number) => {
      const keyStr = String(key);
      return t(`props.${keyStr}`) || keyStr;
    };

    const formatStatValue = (key: string | number, value: number) => {
      const keyStr = String(key);
      if (['20', '22', '23', '26', '28', '40', '41', '42', '43', '44', '45', '46', '50'].includes(keyStr)) {
        return (value * 100).toFixed(1) + '%';
      }
      return Math.round(value);
    };

    const getEquipName = (hash: string) => {
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
      return equipNameMap[hash] || hash;
    };

    const getCharacterName = (avatarId: string) => {
      const character = characters[avatarId as keyof typeof characters];
      if (!character) return avatarId;
      
      const nameTextMapHash = character.NameTextMapHash;
      const zhName = (loc as LocJson)['zh-cn'][String(nameTextMapHash)];
      return zhName || avatarId;
    };

    const modalRef = ref<HTMLElement | null>(null);

    const closeModal = () => {
      if (modalRef.value) {
        modalRef.value.classList.add('closing');
        const onAnimationEnd = () => {
          modalRef.value?.removeEventListener('animationend', onAnimationEnd);
          emit('close');
        };
        modalRef.value.addEventListener('animationend', onAnimationEnd);
      } else {
        emit('close');
      }
    };

    return {
      getCharacterName,
      getPropName,
      formatStatValue,
      getEquipName,
      closeModal,
      modalRef
    };
  }
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

.avatar-modal {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  width: 85%;
  max-width: 650px;
  max-height: 85vh;
  overflow-y: scroll;
  position: relative;
  transform: translateY(20px);
  opacity: 0;
  animation: modalIn 0.3s 0.1s ease-out forwards;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.avatar-modal::-webkit-scrollbar {
  display: none;
}

.close-button {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(0, 0, 0, 0.1);
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  color: #555;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: rgba(0, 0, 0, 0.2);
  transform: scale(1.1);
}

.modal-content {
  padding: 40px;
}

.character-basic {
  text-align: center;
  margin-bottom: 30px;
}

.character-basic h3 {
  margin: 0;
  font-size: 24px;
  color: #2c3e50;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.character-basic p {
  margin-top: 8px;
  color: #7f8c8d;
  font-size: 16px;
}

.character-details {
  margin-top: 30px;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(255,255,255,0.8), rgba(245,245,245,0.9));
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: transform 0.2s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
}

.stat-name {
  color: #34495e;
  font-weight: 500;
}

.stat-value {
  font-weight: 600;
  color: #3498db;
}

.equip-item {
  margin-top: 20px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(240,240,240,0.95));
  border-radius: 12px;
  box-shadow: 0 3px 10px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
}

.equip-item:hover {
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

.equip-item h4 {
  color: #2c3e50;
  margin-bottom: 8px;
  font-weight: 600;
}

.equip-item p {
  color: #7f8c8d;
  margin: 6px 0;
  font-size: 14px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes modalIn {
  from { 
    transform: translateY(20px) scale(0.98);
    opacity: 0;
  }
  to { 
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.closing {
  animation: modalOut 0.3s ease-out forwards;
}

@keyframes modalOut {
  from { 
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  to { 
    transform: translateY(40px) scale(0.95);
    opacity: 0;
  }
}
</style>
