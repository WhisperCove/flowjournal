<template>
  <view
    class="diary-entry"
    :class="{ 'stamp-in': isNew, archived: archived, deleting: deleting }"
    :style="entryStyle"
    @touchstart="onStart"
    @touchmove="onMove"
    @touchend="onEnd"
    @mousedown="onStart"
    @mousemove="onMove"
    @mouseup="onEnd"
  >
    <!-- 右滑：归档提示 -->
    <view class="swipe-label swipe-archive" :style="{ opacity: archiveOpacity }">归档</view>

    <!-- 再右滑：删除提示 -->
    <view class="swipe-label swipe-delete" :style="{ opacity: deleteOpacity }">
      删除
    </view>

    <!-- 左滑：恢复提示 -->
    <view class="swipe-label swipe-restore" :style="{ opacity: restoreOpacity }" v-if="archived">恢复</view>

    <!-- 卡片体 -->
    <view class="card-inner" :style="{ transform: 'translateX(' + swipeX + 'px)' }"
      :class="{ dimmed: archived }">
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

const emit = defineEmits(['delete', 'tap-card'])

// 状态
const archived = ref(false)
const deleting = ref(false)
const swipeX = ref(0)

// 计算提示透明度
const archiveOpacity = computed(() => {
  if (archived.value) return 0
  return swipeX.value > 0 ? Math.min(1, Math.max(0, (swipeX.value - 30) / 50)) : 0
})
const deleteOpacity = computed(() => {
  if (!archived.value) return 0
  return swipeX.value > 0 ? Math.min(1, Math.max(0, (swipeX.value - 30) / 50)) : 0
})
const restoreOpacity = computed(() => {
  if (!archived.value) return 0
  return swipeX.value < 0 ? Math.min(1, Math.abs(swipeX.value) / 50) : 0
})

// 滑动变量
let startX = 0, deltaX = 0, dragging = false, processed = false
const THRESH_ARCHIVE = 30, THRESH_DELETE = 50, MAX = 120

function gx(e) {
  const t = e.changedTouches?.[0] || e.touches?.[0]
  return t ? t.clientX : (e.clientX || 0)
}
function onStart(e) { startX = gx(e); deltaX = 0; dragging = false; processed = false }
function onMove(e) {
  const dx = gx(e) - startX
  if (!dragging && Math.abs(dx) < 6) return
  dragging = true; deltaX = dx
  if (!archived.value) { swipeX.value = Math.max(0, Math.min(MAX, dx)) }
  else { swipeX.value = Math.max(-MAX, Math.min(MAX, dx)) }
}
function onEnd() {
  if (processed) return
  processed = true
  if (!dragging) { emit('tap-card', props.diary); return }
  if (!archived.value) {
    // 第一次右滑
    if (deltaX > THRESH_ARCHIVE) {
      archived.value = true
      swipeX.value = 0
      try { uni.vibrateShort({ type: 'light' }) } catch (e) { /**/ }
    } else { swipeX.value = 0 }
  } else {
    if (deltaX > THRESH_DELETE) {
      // 第二次右滑 → 删除
      deleting.value = true
      try { uni.vibrateShort({ type: 'heavy' }) } catch (e) { /**/ }
      setTimeout(() => emit('delete', props.diary), 500)
    } else if (deltaX < -THRESH_ARCHIVE) {
      // 左滑 → 恢复
      archived.value = false
      swipeX.value = 0
      try { uni.vibrateShort({ type: 'light' }) } catch (e) { /**/ }
    } else {
      swipeX.value = 0
    }
  }
  dragging = false
}

const entryStyle = computed(() => {
  const seed = ((props.diary.id || props.index) * 7 + 13) % 31
  const deg = (seed - 15) / 10
  return { transform: `rotate(${deg}deg)` }
})
</script>

<style lang="scss" scoped>
.diary-entry {
  position: relative; margin-bottom: 20px; border-radius: 2px;
  user-select: none; overflow: hidden;

  &.archived { opacity: .45; .card-inner { filter: grayscale(.5); } }
  &.deleting { animation: paperRoll 0.5s cubic-bezier(.55,.055,.675,.19) forwards; }
}
@keyframes paperRoll {
  0%   { transform: scale(1) rotate(0deg); opacity: 1; }
  50%  { transform: scale(.9) rotate(-5deg); opacity: .5; }
  100% { transform: scale(0) rotate(-15deg); opacity: 0; }
}

/* 滑动提示文字 */
.swipe-label {
  position: absolute; top: 50%; transform: translateY(-50%);
  font-size: 13px; font-weight: 600; letter-spacing: 2px;
  z-index: 1; pointer-events: none;
}
.swipe-archive { left: 16px; color: rgba(139,115,85,.5); }
.swipe-delete  { right: 16px; color: rgba(180,100,100,.5); }
.swipe-restore { left: 16px; color: rgba(139,180,139,.6); }

/* 卡片体 */
.card-inner {
  position: relative; z-index: 2;
  background: #FFFEF9; padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,.04), 0 4px 12px rgba(0,0,0,.02),
    inset 0 0 0 1px rgba(0,0,0,.02);
  border-radius: 2px;
  transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), filter 0.3s ease;
  cursor: pointer;

  &:nth-child(odd)  { background: #FFFEFA; }
  &:nth-child(even) { background: #FFFAF5; }
}

.entry-tape {
  position: absolute; top: -9px; left: 50%;
  transform: translateX(-50%) rotate(-2deg);
  width: 48px; height: 18px;
  background: linear-gradient(180deg, rgba(212,200,170,.55) 0%, rgba(212,200,170,.25) 40%, rgba(212,200,170,.45) 100%);
  border-radius: 2px; box-shadow: 0 1px 1px rgba(0,0,0,.08); z-index: 3;
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

.stamp-in { animation: stamp 0.5s cubic-bezier(0.22,1,0.36,1) forwards; }
@keyframes stamp {
  0%   { transform: scale(1.6) rotate(-12deg); opacity: 0; }
  60%  { transform: scale(.95) rotate(-1deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
</style>
