<template>
  <view class="nav-bar">
    <view
      v-for="tab in tabs"
      :key="tab.id"
      class="nav-tag"
      :class="{ active: current === tab.id }"
    >
      <image class="tag-icon" :src="current === tab.id ? tab.icon2 : tab.icon" mode="aspectFit" />
      <view v-if="current === tab.id" class="tag-dot"></view>
      <!-- 透明点击层 -->
      <view class="nav-hit" @touchstart="handleTabClick(tab)" @click="handleTabClick(tab)"></view>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({ current: { type: String, default: 'home' } })

const tabs = [
  { id: 'home',   icon: '/static/tabbar/手账.png',  icon2: '/static/tabbar/手账2.png',  label: '手账', route: '/pages/home/index' },
  { id: 'todos',  icon: '/static/tabbar/待办.png',  icon2: '/static/tabbar/待办2.png',  label: '待办', route: '/pages/todos/index' },
  { id: 'stats',  icon: '/static/tabbar/足迹.png',  icon2: '/static/tabbar/足迹2.png',  label: '足迹', route: '/pages/stats/index' },
  { id: 'breathe',icon: '/static/tabbar/冥想.png',  icon2: '/static/tabbar/冥想2.png',  label: '吐纳', route: '/pages/breathe/index' }
]

let lock = false

function handleTabClick(tab) {
  if (tab.id === props.current || lock) return
  lock = true
  const order = uni.$pageOrder || ['home','todos','stats','breathe']
  const curIdx = order.indexOf(props.current)
  const newIdx = order.indexOf(tab.id)
  uni.$flipDirection = newIdx > curIdx ? 'next' : 'prev'
  uni.reLaunch({ url: tab.route })
  setTimeout(() => { lock = false }, 500)
}
</script>

<style lang="scss" scoped>
.nav-bar {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  height: 56px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 1000;
  background: #E8E0D0;
  border-top: 1px dashed #D0C8B8;
  border-radius: 24px 24px 0 0;
  box-shadow: 0 -4px 12px rgba(62,39,35,.06);
}

.nav-tag {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 56px;
  height: 48px;
}

.tag-icon {
  width: 30px; height: 30px;
  display: block;
  object-fit: contain;
  pointer-events: none;
  transition: transform 0.3s ease;
}
.nav-tag.active .tag-icon { transform: translateY(-3px) scale(1.08); }

/* 透明点击层盖住整个标签区域 */
.nav-hit {
  position: absolute;
  inset: -4px;
  z-index: 10;
  cursor: pointer;
}

.tag-dot {
  position: absolute;
  bottom: 1px;
  left: 50%;
  transform: translateX(-50%);
  width: 16px;
  height: 2.5px;
  border-radius: 2px;
  background: rgba(143,188,143,.5);
  animation: lineIn 0.3s ease-out;
  pointer-events: none;
}
@keyframes lineIn {
  0%   { transform: translateX(-50%) scaleX(0); opacity: 0; }
  100% { transform: translateX(-50%) scaleX(1); opacity: 1; }
}
</style>
