<template>
  <view class="page-container" @touchstart="swipe.onTouchStart" @touchend="swipe.onTouchEnd">
    <view class="book-stage">
      <view class="book">
        <!-- 书壳 -->
        <view class="book-cover"></view>

        <!-- 书页 -->
        <BookPage
          ref="bookPageRef"
          :direction="pageDirection"
          headerLeft="呼吸"
          headerRight="IV"
        >
          <!-- 居中布局 -->
          <view class="breathe-page-content">
            <!-- 标题区 -->
            <view class="title-section">
              <h1 class="chapter-title ink-in" style="font-size: 22px;">吐纳</h1>
              <p class="chapter-sub ink-in" style="margin-bottom: 0;">让气息回归本源节奏</p>
            </view>

            <!-- 呼吸球 -->
            <BreathOrb
              ref="breathOrbRef"
              @scaleChange="onBreathScaleChange"
              @activeChange="onBreathActiveChange"
            />

            <!-- 提示文字 -->
            <view class="breathe-hint ink-in" style="animation-delay: 0.3s">
              <text>吾心安谧</text>
              <text>暮云晓月，方觉晚秋...</text>
            </view>
          </view>
        </BookPage>
      </view>
    </view>

    <NavSpine :current="'breathe'" />
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onShow, onHide } from '@dcloudio/uni-app'
import BookPage from '@/components/BookPage.vue'
import NavSpine from '@/components/NavSpine.vue'
import BreathOrb from '@/components/BreathOrb.vue'
import { useSwipeNav } from '@/utils/swipeNav.js'

const swipe = useSwipeNav('breathe')

// ========== 状态 ==========
const pageDirection = ref(uni.$flipDirection || null)
const breathOrbRef = ref(null)
const isBreathActive = ref(false)

// ========== 呼吸事件处理 ==========
function onBreathScaleChange(scale) {
  // 同步呼吸缩放比例到粒子系统
  uni.$emit('breath:scaleUpdate', scale)
}

function onBreathActiveChange(active) {
  isBreathActive.value = active
  if (!active) {
    // 停止时重置粒子缩放
    uni.$emit('breath:reset')
  }
}

// ========== 生命周期 ==========
onMounted(() => {
  // 消费翻页方向
  pageDirection.value = uni.$flipDirection
  uni.$flipDirection = null
})

onShow(() => {
  // 页面显示时确保粒子处于正常状态
  if (!isBreathActive.value) {
    uni.$emit('breath:reset')
  }
})

onHide(() => {
  // 页面隐藏时重置粒子
  uni.$emit('breath:reset')
  isBreathActive.value = false
})
</script>

<style lang="scss" scoped>
.page-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

/* 书台背景 */
.book-stage {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: radial-gradient(circle at 50% 30%, #F0EDE6 0%, #E8E4DC 100%);
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

/* 呼吸页内容居中 */
.breathe-page-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-bottom: 40px;
}

/* 标题区域 */
.title-section {
  text-align: center;
  margin-bottom: 50px;
}

.chapter-title {
  font-family: 'Noto Serif SC', 'Songti SC', 'STSong', serif;
  font-size: 26px;
  font-weight: 300;
  letter-spacing: 2px;
  margin-bottom: 8px;
  line-height: 1.4;
}

.chapter-sub {
  font-size: 13px;
  color: #8C8C83;
  letter-spacing: 1px;
  font-weight: 400;
}

/* 提示文字 */
.breathe-hint {
  margin-top: 30px;
  text-align: center;
  font-size: 13px;
  color: #8C8C83;
  line-height: 2;
  letter-spacing: 1px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 响应式 */
@media (max-height: 700px) {
  .chapter-title {
    font-size: 22px;
  }
}
</style>
