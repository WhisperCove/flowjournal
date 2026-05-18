<template>
  <div class="nav-spine">
    <div class="nav-ribbons">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        class="nav-ribbon"
        :class="[`ribbon-${tab.id}`, { active: current === tab.id }]"
        @tap="handleTabClick(tab)"
        hover-class="ribbon-hover"
        :hover-start-time="0"
        :hover-stay-time="120"
      >
        <div class="ribbon-inner">
          <text class="ribbon-icon">{{ tab.icon }}</text>
          <text class="ribbon-label">{{ tab.label }}</text>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  current: { type: String, default: 'home' }
})

const tabs = [
  { id: 'home',   icon: '📖', label: '手账', route: '/pages/home/index' },
  { id: 'todos',  icon: '✓',  label: '待办', route: '/pages/todos/index' },
  { id: 'stats',  icon: '📊', label: '足迹', route: '/pages/stats/index' },
  { id: 'breathe',icon: '🌬️',label: '吐纳', route: '/pages/breathe/index' }
]

let navLock = false

function handleTabClick(tab) {
  if (tab.id === props.current || navLock) return
  navLock = true

  const order = uni.$pageOrder || ['home','todos','stats','breathe']
  const curIdx = order.indexOf(props.current)
  const newIdx = order.indexOf(tab.id)
  uni.$flipDirection = newIdx > curIdx ? 'next' : 'prev'

  uni.reLaunch({ url: tab.route, animationType: 'none' })
  setTimeout(() => { navLock = false }, 300)

  try { uni.vibrateShort({ type: 'light' }) } catch (e) { /* */ }
}
</script>

<style lang="scss" scoped>
.nav-spine {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 64px;
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  pointer-events: none;
}

.nav-ribbons {
  display: flex;
  gap: 0;
  pointer-events: all;
}

.nav-ribbon {
  position: relative;
  width: 80px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.45s cubic-bezier(0.25, 0.8, 0.25, 1.2);
  box-shadow: 0 -2px 8px rgba(0,0,0,.04);
  border-radius: 8px 8px 0 0;
  z-index: 1;

  /* 各 ribbon 配色 */
  &.ribbon-home    { background: #F5F0E6; color: #8C8068; }
  &.ribbon-todos   { background: #EDF2EA; color: #6B8A6B; }
  &.ribbon-stats   { background: #EBF0F3; color: #5E7A8A; }
  &.ribbon-breathe { background: #F0ECF4; color: #7B6E8A; }

  &.active {
    height: 56px;
    z-index: 10;
    box-shadow:
      0 -4px 16px rgba(0,0,0,.06),
      0 1px 0 #FDFCF8;
    &.ribbon-home    { background: #FDFBF7; color: #2C2C2C; }
    &.ribbon-todos   { background: #F2F7F0; color: #2C2C2C; }
    &.ribbon-stats   { background: #F0F5F8; color: #2C2C2C; }
    &.ribbon-breathe { background: #F5F2F9; color: #2C2C2C; }
  }

  &.ribbon-hover {
    height: 48px;
  }
}

.ribbon-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  padding-top: 6px;
}

.ribbon-icon {
  font-size: 16px;
  line-height: 1.4;
  transition: transform 0.3s ease;
  .nav-ribbon.active & {
    transform: translateY(-2px);
  }
}

.ribbon-label {
  font-size: 10px;
  letter-spacing: 2px;
  font-weight: 500;
  font-family: -apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif;
  transition: opacity 0.3s ease;
  opacity: 0.7;
  .nav-ribbon.active & {
    opacity: 1;
  }
}
</style>
