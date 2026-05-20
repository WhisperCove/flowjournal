<template>
  <view class="mood-sidebar">
    <view class="mood-label">心情</view>
    <view
      v-for="m in moods"
      :key="m.id"
      class="mood-item"
      :class="{ active: modelValue === m.emoji }"
      @tap="selectMood(m)"
    >
      <text class="mood-emoji">{{ m.emoji }}</text>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({ modelValue: { type: String, default: '🍃' } })
const emit = defineEmits(['update:modelValue'])
const moods = [
  { id: 'calm',  emoji: '🍃', label: '平静' },
  { id: 'happy', emoji: '☀️', label: '愉悦' },
  { id: 'sad',   emoji: '🌧️', label: '忧郁' },
  { id: 'wow',   emoji: '✨', label: '惊喜' },
  { id: 'tired', emoji: '🌙', label: '疲倦' }
]

function selectMood(mood) {
  emit('update:modelValue', mood.emoji)
  try { uni.vibrateShort({ type: 'light' }) } catch (e) { /**/ }
}
</script>

<style lang="scss" scoped>
.mood-sidebar {
  position: absolute;
  right: 0;
  top: 35%;
  transform: translateY(-50%);
  width: 34px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 20;
  pointer-events: auto;
  background: rgba(245,240,232,.85);
  border-radius: 17px 0 0 17px;
  padding: 12px 4px;
  box-shadow: -1px 2px 8px rgba(0,0,0,.04);
}

.mood-label {
  font-size: 8px;
  color: #B0ADA0;
  letter-spacing: 2px;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  margin-bottom: 2px;
}

.mood-item {
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.34,1.56,0.64,1);

  &:active {
    transform: scale(0.85);
  }

  &.active {
    transform: scale(1.25);
    background: rgba(255,255,255,.5);
    box-shadow: 0 1px 4px rgba(0,0,0,.06);
  }
}

.mood-emoji {
  font-size: 18px;
  line-height: 1;
  pointer-events: none;
  transition: transform 0.3s ease;
}
.mood-item.active .mood-emoji {
  transform: scale(1.2);
}
</style>
