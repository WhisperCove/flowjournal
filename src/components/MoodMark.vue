<template>
  <view class="bookmark-bar">
    <view
      v-for="m in moods"
      :key="m.emoji"
      class="bookmark"
      :class="[`ribbon-${m.id}`, { active: modelValue === m.emoji }]"
      @tap="selectMood(m)"
      hover-class="bookmark-hover"
      :hover-start-time="0"
      :hover-stay-time="150"
    >
      <text class="bookmark-emoji">{{ m.emoji }}</text>
      <view class="bookmark-tail"></view>
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
.bookmark-bar {
  position: absolute;
  right: -5px; top: 70px;
  display: flex; flex-direction: column; gap: 6px;
  z-index: 20; pointer-events: auto;
}

.bookmark {
  width: 26px; height: 42px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; position: relative;
  transition: all 0.45s cubic-bezier(0.25,0.8,0.25,1.2);
  box-shadow: -1px 2px 6px rgba(0,0,0,.08);
  border-radius: 3px 3px 0 0;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 86%, 0 100%);
  pointer-events: auto;

  &.ribbon-calm  { background: linear-gradient(180deg, #C8D8C0, #A8C0A0); }
  &.ribbon-happy { background: linear-gradient(180deg, #F0DC98, #D8C470); }
  &.ribbon-sad   { background: linear-gradient(180deg, #B8C8D8, #90A8C0); }
  &.ribbon-wow   { background: linear-gradient(180deg, #E8D896, #C8B870); }
  &.ribbon-tired { background: linear-gradient(180deg, #C0C0D0, #9898B0); }

  &.active {
    transform: translateX(-10px) scale(1.12);
    box-shadow: -3px 3px 10px rgba(0,0,0,.12);
    &.ribbon-calm  { background: linear-gradient(180deg, #D8E8D0, #B8D0B0); }
    &.ribbon-happy { background: linear-gradient(180deg, #F8E8A8, #E8D880); }
    &.ribbon-sad   { background: linear-gradient(180deg, #C8D8E8, #A0B8D0); }
    &.ribbon-wow   { background: linear-gradient(180deg, #F0E8A8, #D8C880); }
    &.ribbon-tired { background: linear-gradient(180deg, #D0D0E0, #A8A8C0); }
  }

  &.bookmark-hover {
    transform: translateX(-5px) scale(1.06);
  }
}

.bookmark-emoji {
  font-size: 14px;
  position: relative; z-index: 2;
  transition: filter 0.3s ease;
  .bookmark.active & {
    filter: drop-shadow(0 1px 2px rgba(0,0,0,.2));
  }
}
</style>
