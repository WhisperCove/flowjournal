<template>
  <view class="breathe-stage">
    <view class="breathe-orb">
      <view class="orb-core" :style="coreStyle"></view>
      <view class="orb-ring" :style="ring1Style" style="inset:-20px;opacity:.3"></view>
      <view class="orb-ring" :style="ring2Style" style="inset:-40px;opacity:.15"></view>
      <text class="breathe-label">{{ breathLabel }}</text>
    </view>

    <view class="breathe-hint">
      <text>四秒吸气 · 四秒屏息 · 四秒呼气</text>
      <text>粒子随你一同涨落</text>
    </view>

    <view class="btn-solid" @tap="toggleBreath">
      <text>{{ isActive ? '停止练习' : '开始练习' }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onBeforeUnmount, watch } from 'vue'

const emit = defineEmits(['scaleChange', 'activeChange'])

const isActive = ref(false)
let breathStartTime = 0
let breathTimer = null

const CYCLE = 12 // 秒
const INHALE = 4
const HOLD = 8

const breathLabel = ref('就绪')
const currentScale = ref(1)

const coreStyle = computed(() => ({ transform: `scale(${currentScale.value})` }))
const ring1Style = computed(() => ({ transform: `scale(${1 + (currentScale.value - 1) * 0.6})` }))
const ring2Style = computed(() => ({ transform: `scale(${1 + (currentScale.value - 1) * 0.3})` }))

function breatheTick() {
  if (!isActive.value) return

  const elapsed = (Date.now() - breathStartTime) / 1000
  const t = elapsed % CYCLE
  let scale, label

  if (t < INHALE) {
    scale = 0.6 + (t / INHALE) * 0.9
    label = '吸气'
  } else if (t < HOLD) {
    scale = 1.5
    label = '屏息'
  } else {
    scale = 1.5 - ((t - HOLD) / (CYCLE - HOLD)) * 0.9
    label = '呼气'
  }

  currentScale.value = scale
  if (breathLabel.value !== label) breathLabel.value = label
  emit('scaleChange', scale)
}

function startBreath() {
  isActive.value = true
  breathStartTime = Date.now()
  currentScale.value = 1
  breathLabel.value = '吸气'
  emit('activeChange', true)
  breathTimer = setInterval(breatheTick, 30)
}

function stopBreath() {
  isActive.value = false
  if (breathTimer) { clearInterval(breathTimer); breathTimer = null }
  currentScale.value = 1
  breathLabel.value = '就绪'
  emit('scaleChange', 1)
  emit('activeChange', false)
}

function toggleBreath() {
  isActive.value ? stopBreath() : startBreath()
}

onBeforeUnmount(() => {
  if (breathTimer) clearInterval(breathTimer)
})
</script>

<style lang="scss" scoped>
.breathe-stage {
  height: 100%;
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; position: relative; padding-bottom: 60px;
}
.breathe-orb {
  position: relative; width: 220px; height: 220px;
  display: flex; align-items: center; justify-content: center; margin-bottom: 40px;
}
.orb-core {
  position: absolute; inset: 0; border-radius: 50%;
  background: radial-gradient(circle at 38% 38%,
    rgba(220,200,180,.5) 0%,
    rgba(200,185,170,.35) 30%,
    rgba(180,195,210,.25) 65%,
    rgba(200,210,195,.15) 100%);
  box-shadow:
    0 0 80px rgba(212,196,176,.25),
    0 0 40px rgba(255,255,255,.4) inset,
    0 0 20px rgba(196,185,168,.15);
}
.orb-ring {
  position: absolute; border-radius: 50%;
  border: 1px solid rgba(196,185,168,.3);
}
.breathe-label {
  position: relative; z-index: 10;
  font-family: 'Noto Serif SC','Songti SC','STSong',serif;
  font-size: 22px; font-weight: 300; letter-spacing: 8px; color: #2C2C2C;
}
.breathe-hint {
  margin-bottom: 40px; text-align: center; font-size: 13px;
  color: #8C8C83; line-height: 2; letter-spacing: 1px;
  display: flex; flex-direction: column; gap: 4px;
}
.btn-solid {
  background: #2C2C2C; color: #FDFCF8; border: none;
  padding: 12px 28px; border-radius: 24px;
  font-family: -apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif;
  font-size: 14px; letter-spacing: 1px;
  transition: transform 0.2s ease;
}
</style>
