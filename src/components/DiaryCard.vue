<template>
  <view
    class="diary-entry"
    :class="{ 'stamp-in': isNew, dimmed: dimmed, deleting: deleting }"
    :style="entryStyle"
    @touchstart="onStart"
    @touchmove="onMove"
    @touchend="onEnd"
    @mousedown="onStart"
    @mousemove="onMove"
    @mouseup="onEnd"
    @mouseleave="onEnd"
  >
    <!-- 滑动时露出的删除按钮 -->
    <view class="swipe-reveal" :style="{ opacity: revealOpacity }">
      <view class="del-btn" @tap.stop="confirmDelete">删除</view>
    </view>

    <!-- 卡片主体 -->
    <view class="card-body" :style="{ transform: 'translateX(' + swipeX + 'px)' }">
      <view class="entry-tape"></view>
      <view class="entry-date">
        <text>{{ diary.fullDate || diary.date }}</text>
      </view>
      <view class="entry-body drop-cap">{{ diary.text }}</view>
      <text class="entry-mood">{{ diary.mood }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  diary: { type: Object, required: true },
  index: { type: Number, default: 0 },
  isNew: { type: Boolean, default: false }
})

const emit = defineEmits(['delete', 'tap'])

// 状态
const dimmed = ref(false)       // 变灰
const deleting = ref(false)     // 删除动画中
const swipeX = ref(0)           // 滑动偏移
const revealOpacity = ref(0)    // 删除按钮透明度
const hovered = ref(false)      // 是否悬停（露按钮状态）

let startX = 0, deltaX = 0, isDragging = false
const THRESH = 70, MAX = 110

function getX(e) {
  const t = e.changedTouches?.[0] || e.touches?.[0]
  return t ? t.clientX : (e.clientX || 0)
}
function onStart(e) { startX = getX(e); deltaX = 0; isDragging = false }
function onMove(e) {
  if (hovered.value) return  // 已悬停，不再滑动
  const dx = getX(e) - startX
  if (!isDragging && Math.abs(dx) < 6) return
  isDragging = true; deltaX = dx
  const max = Math.min(MAX, dx)
  swipeX.value = Math.max(0, max)  // 只允许右滑
  revealOpacity.value = Math.min(1, Math.abs(dx) / THRESH)
}
function onEnd() {
  if (hovered.value) return
  if (!isDragging) { emit('tap', props.diary); return }
  if (deltaX > THRESH) {
    // 悬停：露按钮
    hovered.value = true
    dimmed.value = true
    swipeX.value = MAX
    revealOpacity.value = 1
  } else {
    swipeX.value = 0
    revealOpacity.value = 0
  }
}

function confirmDelete() {
  deleting.value = true
  try { uni.vibrateShort({ type: 'heavy' }) } catch (e) { /**/ }
  setTimeout(() => {
    emit('delete', props.diary)
  }, 500)
}

// 随机旋转
const entryStyle = computed(() => {
  const seed = ((props.diary.id || props.index) * 7 + 13) % 31
  const deg = (seed - 15) / 10
  return { transform: `rotate(${deg}deg)` }
})
</script>

<style lang="scss" scoped>
.diary-entry {
  position: relative;
  margin-bottom: 20px;
  border-radius: 2px;
  user-select: none;
  overflow: hidden;

  &.dimmed {
    opacity: .5;
    .card-body { filter: grayscale(.6); }
  }

  &.deleting {
    animation: whoosh 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards;
  }
}

@keyframes whoosh {
  0%   { transform: scale(1) rotate(0deg); opacity: 1; }
  100% { transform: scale(0.85) translateX(60px); opacity: 0; }
}

/* 滑动露出的删除按钮 */
.swipe-reveal {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: flex-end;
  padding-right: 8px; z-index: 1;
}
.del-btn {
  background: rgba(180,100,100,.85); color: #FFF;
  padding: 8px 20px; border-radius: 16px;
  font-size: 13px; letter-spacing: 1px;
  cursor: pointer; z-index: 10;
}

/* 卡片主体 */
.card-body {
  position: relative; z-index: 2;
  background: #FFFEF9; padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,.04), 0 4px 12px rgba(0,0,0,.02), inset 0 0 0 1px rgba(0,0,0,.02);
  border-radius: 2px;
  transition: transform 0.4s cubic-bezier(0.22,1,0.36,1);
  cursor: pointer;

  &:nth-child(odd)  { background: #FFFEFA; }
  &:nth-child(even) { background: #FFFAF5; }
}

.entry-tape {
  position: absolute; top: -9px; left: 50%;
  transform: translateX(-50%) rotate(-2deg);
  width: 48px; height: 18px;
  background: linear-gradient(180deg, rgba(212,200,170,.55) 0%, rgba(212,200,170,.25) 40%, rgba(212,200,170,.45) 100%);
  border-radius: 2px; box-shadow: 0 1px 1px rgba(0,0,0,.08);
  z-index: 3;
}
.entry-date {
  font-family: 'Noto Serif SC','Songti SC','STSong',serif;
  font-size: 12px; color: #8C8C83; margin-bottom: 10px;
}
.entry-body {
  font-size: 15px; line-height: 1.8; color: #2C2C2C;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
  overflow: hidden;
}
.entry-mood {
  position: absolute; bottom: 16px; right: 16px;
  font-size: 18px; opacity: .4;
}

.stamp-in {
  animation: stamp 0.5s cubic-bezier(0.22,1,0.36,1) forwards;
}
@keyframes stamp {
  0%   { transform: scale(1.6) rotate(-12deg); opacity: 0; }
  60%  { transform: scale(.95) rotate(-1deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
</style>
