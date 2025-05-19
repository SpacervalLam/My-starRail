<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="avatar-modal">
      <button class="close-button" @click="closeModal">×</button>
      
      <div class="modal-content">
        <div class="character-basic">
          <h3>{{ character.avatarId }}</h3>
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
import { defineComponent } from 'vue';
import { useI18n } from 'vue-i18n';

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

    const closeModal = () => {
      emit('close');
    };

    return {
      getPropName,
      formatStatValue,
      getEquipName,
      closeModal
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
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

.avatar-modal {
  background-color: white;
  border-radius: 12px;
  width: 80%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  transform: translateY(20px);
  opacity: 0;
  animation: modalIn 0.3s 0.1s ease-out forwards;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.modal-content {
  padding: 30px;
}

.character-basic {
  text-align: center;
  margin-bottom: 20px;
}

.character-basic h3 {
  margin: 0;
  color: #333;
}

.character-details {
  margin-top: 20px;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.stat-name {
  color: #666;
}

.stat-value {
  font-weight: bold;
}

.equip-item {
  margin-top: 15px;
  padding: 12px;
  background-color: #f0f2f5;
  border-radius: 8px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes modalIn {
  from { 
    transform: translateY(20px);
    opacity: 0;
  }
  to { 
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
