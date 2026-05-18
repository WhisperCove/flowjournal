<template>
  <div class="book-sheet" :class="animClass" @animationend="onAnimEnd">
    <div class="paper-texture">
      <div class="page-header">
        <span>{{ headerLeft }}</span>
        <span style="font-variant-numeric: tabular-nums;">{{ headerRight }}</span>
      </div>
      <div class="page-content" ref="contentRef">
        <slot />
      </div>
      <div class="page-number">{{ headerRight }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'

const props = defineProps({
  direction: { type: String, default: null },
  headerLeft: { type: String, default: '手账' },
  headerRight: { type: String, default: 'I' }
})

const emit = defineEmits(['ready'])
const contentRef = ref(null)
const animClass = ref('')
const animDone = ref(false)

onMounted(() => {
  const dir = props.direction || uni.$flipDirection

  if (dir === 'next') { animClass.value = 'anim-next' }
  else if (dir === 'prev') { animClass.value = 'anim-prev' }
  else {
    // 首次加载：直接就绪（ink-in CSS 动画会自动播放）
    animDone.value = true
    emit('ready')
  }

  uni.$flipDirection = null
})

function onAnimEnd() {
  if (animDone.value) return
  animDone.value = true
  emit('ready')
}
</script>

<style lang="scss" scoped>
.book-sheet {
  position: absolute;
  inset: 0;
  border-radius: 2px 12px 12px 2px;
  opacity: 1;
  pointer-events: all;
  z-index: 10;
  box-shadow:
    inset -2px 0 4px rgba(0,0,0,.02),
    2px 0 8px rgba(0,0,0,.03);

  &.anim-next {
    animation: flipInNext 1.0s cubic-bezier(0.4,0,0.2,1);
  }
  &.anim-prev {
    animation: flipInPrev 1.0s cubic-bezier(0.4,0,0.2,1);
  }
}
@keyframes flipInNext {
  from { transform: rotateY(160deg); opacity: 0; }
  to   { transform: rotateY(0deg);   opacity: 1; }
}
@keyframes flipInPrev {
  from { transform: rotateY(-160deg); opacity: 0; }
  to   { transform: rotateY(0deg);    opacity: 1; }
}

.paper-texture {
  position: absolute; inset: 0;
  background-color: #FDFCF8;
  background-image:
    radial-gradient(circle at 50% 50%, transparent 60%, rgba(0,0,0,.015) 100%),
    url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
  border-radius: 2px 12px 12px 2px; overflow: hidden;
  &::after {
    content: ''; position: absolute; inset: 0;
    box-shadow: inset 0 0 60px rgba(139,126,102,.04);
    pointer-events: none;
  }
}

.page-header {
  position: absolute; top: 0; left: 32px; right: 32px; height: 48px;
  display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1px solid rgba(0,0,0,.04);
  font-family: 'Noto Serif SC','Songti SC','STSong',serif;
  font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
  color: #8C8C83; z-index: 5; pointer-events: none;
}

.page-content {
  position: relative; height: 100%; overflow-y: auto; overflow-x: hidden;
  padding: 48px 32px 100px; scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}

.page-number {
  position: absolute; bottom: 76px; left: 0; right: 0; text-align: center;
  font-family: 'Noto Serif SC','Songti SC','STSong',serif;
  font-size: 10px; letter-spacing: 3px;
  color: rgba(0,0,0,.12); pointer-events: none; z-index: 5;
}

:deep(.drop-cap::first-letter) {
  font-family: 'Noto Serif SC','Songti SC','STSong',serif;
  font-size: 3.2em; float: left; line-height: .8;
  margin-right: 8px; margin-top: 4px; color: #C4B9A8;
}

:deep(.ink-in) {
  animation: inkReveal 0.7s cubic-bezier(0.22,1,0.36,1) forwards;
  opacity: 0;
}
@keyframes inkReveal {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

:deep(.stamp-in) {
  animation: stamp 0.5s cubic-bezier(0.22,1,0.36,1) forwards;
}
@keyframes stamp {
  0%   { transform: scale(1.6) rotate(-12deg); opacity: 0; }
  60%  { transform: scale(.95) rotate(-1deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
</style>
