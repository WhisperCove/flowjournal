<template>
  <view class="app-root">
    <!-- 全局粒子层（fixed 全屏，始终渲染） -->
    <ParticleCanvas ref="particleCanvasRef" />

    <!-- 书壳背景（固定层，所有页面下方） -->
    <view class="book-stage">
      <view class="book">
        <view class="book-cover"></view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLaunch } from '@dcloudio/uni-app'
import ParticleCanvas from '@/components/ParticleCanvas.vue'

// ========== 全局状态 ==========
const particleCanvasRef = ref(null)

// 全局翻页方向
uni.$flipDirection = null

// 全局情绪状态
uni.$appState = {
  currentMood: '🍃',
  composeOpen: false
}

// ========== 提供 ParticleCanvas 触发方法 ==========
// 墨滴爆发
uni.$spawnInkBurst = (x, y, color) => {
  if (particleCanvasRef.value) {
    particleCanvasRef.value.spawnInkBurst(x, y, color)
  }
}

// 书签粒子
uni.$spawnBookmarkDust = (x, y, mood) => {
  if (particleCanvasRef.value) {
    particleCanvasRef.value.spawnBookmarkDust(x, y, mood)
  }
}

// ========== 生命周期 ==========
onLaunch(() => {
  console.log('[App] 启动中...')
  if (uni.$db) {
    uni.$db.init().then(() => {
      console.log('[App] 数据库就绪')
    }).catch(err => {
      console.error('[App] 数据库初始化失败:', err)
    })
  }
})

// 监听粒子触发事件（跨组件通信）
uni.$on('particle:inkBurst', (data) => {
  uni.$spawnInkBurst(data.x, data.y, data.color)
})

uni.$on('particle:bookmarkDust', (data) => {
  uni.$spawnBookmarkDust(data.x, data.y, data.mood)
})

// 监听呼吸缩放事件
uni.$on('breath:scaleUpdate', (scale) => {
  if (particleCanvasRef.value) {
    particleCanvasRef.value.setBreathScale(scale)
  }
})

uni.$on('breath:reset', () => {
  if (particleCanvasRef.value) {
    particleCanvasRef.value.resetBreathScale()
  }
})
</script>

<style lang="scss">
/* ========== 字体声明（可选，安装字体后取消注释） ========== */
/* 字体文件下载地址: https://fonts.google.com/specimen/Noto+Serif+SC */
/* 将 .woff2 文件放入 static/fonts/ 目录后取消下方注释即可启用 */
/* 
@font-face {
  font-family: 'Noto Serif SC';
  src: url('@/static/fonts/NotoSerifSC-Light.woff2') format('woff2');
  font-weight: 300;
  font-display: swap;
}
@font-face {
  font-family: 'Noto Serif SC';
  src: url('@/static/fonts/NotoSerifSC-Regular.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: 'Noto Serif SC';
  src: url('@/static/fonts/NotoSerifSC-SemiBold.woff2') format('woff2');
  font-weight: 600;
  font-display: swap;
}
*/

/* ========== 全局样式 ========== */
.app-root {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

/* 书壳背景层（位于所有页面下方） */
.book-stage {
  position: fixed;
  inset: 0;
  z-index: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: radial-gradient(circle at 50% 30%, #F0EDE6 0%, #E8E4DC 100%);
  pointer-events: none;
}

.book {
  width: 100%;
  max-width: 480px;
  height: 92vh;
  max-height: 860px;
  position: relative;
  transform-style: preserve-3d;
  perspective: 2000px;
}

.book-cover {
  position: absolute;
  inset: -8px;
  background: linear-gradient(105deg, #E6E2DA 0%, #D8D4CC 50%, #E6E2DA 100%);
  border-radius: 8px 16px 16px 8px;
  box-shadow:
    0 20px 50px rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 0;
  transform: translateZ(-20px);

  &::before {
    content: '';
    position: absolute;
    left: 24px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.06), transparent);
  }
}
</style>
