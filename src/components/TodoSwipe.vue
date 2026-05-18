<template>
  <view
    class="todo-row"
    :class="{ completed: todo.completed, swiping: isSwiping, 'just-done': showStamp }"
    :style="swipeStyle"
    @touchstart="onPointerStart"
    @touchmove="onPointerMove"
    @touchend="onPointerEnd"
    @mousedown="onPointerStart"
    @mousemove="onPointerMove"
    @mouseup="onPointerEnd"
    @mouseleave="onPointerEnd"
  >
    <!-- 滑动背景 -->
    <view class="swipe-bg">
      <view class="swipe-action swipe-complete" :style="{ opacity: swipeRightOpacity }">
        <text>✓ 完成</text>
      </view>
      <view class="swipe-action swipe-delete" :style="{ opacity: swipeLeftOpacity }">
        <text>✕ 删除</text>
      </view>
    </view>

    <!-- 主内容 -->
    <view class="todo-content" @tap="handleToggle">
      <view class="todo-check">
        <svg v-if="todo.completed" width="12" height="12" viewBox="0 0 24 24"
          fill="none" stroke="white" stroke-width="3"
          stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </view>
      <text class="todo-text">{{ todo.text }}</text>
    </view>

    <!-- DONE 印章（完成瞬间闪现） -->
    <view v-if="showStamp" class="done-stamp">DONE</view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({ todo: { type: Object, required: true } })
const emit = defineEmits(['toggle', 'delete'])

// 拖拽状态
let startX = 0, startY = 0, currentDeltaX = 0, isDragging = false
const isSwiping = ref(false)
const translateX = ref(0)
const MAX_SWIPE = 120
const THRESHOLD = 80

// 印章动画
const showStamp = ref(false)

const swipeRightOpacity = computed(() =>
  translateX.value <= 0 ? 0 : Math.min(1, translateX.value / THRESHOLD))
const swipeLeftOpacity = computed(() =>
  translateX.value >= 0 ? 0 : Math.min(1, Math.abs(translateX.value) / THRESHOLD))
const swipeStyle = computed(() => ({ '--tx': `${translateX.value}px` }))

function getXY(e) {
  const t = e.changedTouches?.[0] || e.touches?.[0]
  return t ? [t.clientX, t.clientY] : [e.clientX || 0, e.clientY || 0]
}

function onPointerStart(e) {
  [startX, startY] = getXY(e)
  currentDeltaX = 0; isDragging = false; isSwiping.value = false
}
function onPointerMove(e) {
  const [cx, cy] = getXY(e)
  const dx = cx - startX, dy = cy - startY
  if (!isDragging && Math.abs(dy) > Math.abs(dx)) return
  isDragging = true
  currentDeltaX = dx
  isSwiping.value = true
  const max = props.todo.completed ? 0 : MAX_SWIPE
  translateX.value = Math.max(-MAX_SWIPE, Math.min(max, dx))
}
function onPointerEnd() {
  if (!isDragging) { translateX.value = 0; return }
  const dx = currentDeltaX
  if (dx > THRESHOLD) {
    translateX.value = MAX_SWIPE
    setTimeout(() => { translateX.value = 0; isSwiping.value = false; isDragging = false; handleToggle() }, 180)
  } else if (dx < -THRESHOLD) {
    translateX.value = -MAX_SWIPE
    setTimeout(() => { translateX.value = 0; isSwiping.value = false; isDragging = false; handleDelete() }, 180)
  } else {
    translateX.value = 0; isSwiping.value = false; isDragging = false
  }
}

function handleToggle() {
  if (!props.todo.completed) {
    // 触发印章动画
    showStamp.value = true
    setTimeout(() => { showStamp.value = false }, 600)
  }
  emit('toggle', props.todo)
  try { uni.vibrateShort({ type: 'medium' }) } catch (e) { /**/ }
}

function handleDelete() {
  emit('delete', props.todo)
  try { uni.vibrateShort({ type: 'heavy' }) } catch (e) { /**/ }
}
</script>

<style lang="scss" scoped>
.todo-row {
  position: relative; min-height: 48px; overflow: hidden;
  user-select: none; -webkit-tap-highlight-color: transparent;

  &.completed {
    opacity: .45;
    .todo-text { text-decoration: line-through; text-decoration-color: #C4B9A8; text-decoration-thickness: 1px; }
  }
}

/* 滑动背景 */
.swipe-bg {
  position: absolute; inset: 0; display: flex; border-radius: 4px; overflow: hidden;
}
.swipe-action {
  flex: 1; display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 500; letter-spacing: 1px;
  transition: opacity 0.15s ease; opacity: 0;
}
.swipe-complete { background: rgba(180,210,170,.65); color: #3A5A3A; }
.swipe-delete  { background: rgba(210,170,170,.65); color: #6B3A3A; }

/* 主内容 */
.todo-content {
  position: relative; display: flex; align-items: flex-start; gap: 16px;
  padding: 12px 0; background: transparent;
  transform: translateX(var(--tx, 0px)); z-index: 2; cursor: pointer;
  transition: transform 0.4s cubic-bezier(0.22,1,0.36,1);
}

/* 复选框 */
.todo-check {
  width: 20px; height: 20px; border: 1.5px solid #8C8C83; border-radius: 50%;
  flex-shrink: 0; margin-top: 2px; margin-left: 10px;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.5s cubic-bezier(0.34,1.56,0.64,1); background: transparent;
}
.todo-row.completed .todo-check {
  background: #C4B9A8; border-color: #C4B9A8; transform: scale(1.1);
}

.todo-text { flex: 1; font-size: 15px; line-height: 1.6; padding-top: 1px; transition: all 0.3s ease; }

/* DONE 印章 */
.done-stamp {
  position: absolute; right: 6px; top: 50%; transform: translateY(-50%) rotate(-8deg);
  font-family: 'Noto Serif SC', serif; font-size: 18px; font-weight: 600;
  color: rgba(196,160,140,.5); letter-spacing: 4px;
  pointer-events: none; z-index: 5;
  animation: stampPop 0.6s cubic-bezier(0.22,1,0.36,1) forwards;
}
@keyframes stampPop {
  0%   { opacity: 0; transform: translateY(-50%) rotate(-8deg) scale(2); }
  40%  { opacity: .7; transform: translateY(-50%) rotate(-2deg) scale(.9); }
  100% { opacity: .35; transform: translateY(-50%) rotate(-2deg) scale(1); }
}
</style>
