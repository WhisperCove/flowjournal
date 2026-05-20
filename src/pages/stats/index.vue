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
          headerLeft="统计"
          headerRight="II"
        >
          <!-- 章节标题 -->
          <h1 class="chapter-title ink-in">数字足迹</h1>
          <p class="chapter-sub ink-in" style="animation-delay: 0.1s">看见时间的厚度</p>

          <!-- 统计块 -->
          <view class="stats-container">
            <!-- 日记数 -->
            <view class="stat-block ink-in" style="animation-delay: 0.2s">
              <text class="stat-number">{{ animDiaryCount }}</text>
              <text class="stat-caption">篇日记 · 思想的切片</text>
            </view>

            <!-- 完成数 -->
            <view class="stat-block ink-in" style="animation-delay: 0.3s; border-color: #B8C9D1;">
              <text class="stat-number">{{ animTodoDone }}</text>
              <text class="stat-caption">件完成 · 行动的印记</text>
            </view>

            <!-- 连续天数 -->
            <view class="stat-block ink-in" style="animation-delay: 0.4s; border-color: #C8D4B8;">
              <text class="stat-number">{{ animStreak }}</text>
              <text class="stat-caption">天连续 · 习惯的根系</text>
            </view>
          </view>

          <!-- 引言 -->
          <view
            class="quote-block ink-in"
            style="animation-delay: 0.5s"
          >
            <text class="quote-line">"平静不是避开车马喧嚣，</text>
            <text class="quote-line">而是在心中修篱种菊。"</text>
          </view>
        </BookPage>
      </view>
    </view>

    <NavSpine :current="'stats'" />
  </view>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import BookPage from '@/components/BookPage.vue'
import NavSpine from '@/components/NavSpine.vue'
import { useSwipeNav } from '@/utils/swipeNav.js'

const swipe = useSwipeNav('stats')

// ========== 状态 ==========
const pageDirection = ref(uni.$flipDirection || null)

// 实际数据
const diaryCount = ref(0)
const todoDone = ref(0)
const streak = ref(1)

// 动画显示的数字
const animDiaryCount = ref(0)
const animTodoDone = ref(0)
const animStreak = ref(1)

// ========== 数字滚动动画 ==========
function animateNumber(refObj, target, duration = 800) {
  const start = parseInt(refObj.value) || 0
  if (start === target) { refObj.value = target; return }
  const startTime = Date.now()

  function step() {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    const ease = 1 - Math.pow(1 - progress, 3)
    refObj.value = Math.round(start + (target - start) * ease)
    if (progress < 1) {
      setTimeout(step, 16)
    } else {
      refObj.value = target
    }
  }
  step()
}

// ========== 数据加载 ==========
async function loadStats() {
  try {
    const stats = await uni.$db.getStats()
    diaryCount.value = stats.diaryCount || 0
    todoDone.value = stats.todoDone || 0
    streak.value = stats.streak || 1

    // 触发数字动画
    // 首次加载使用较长的持续时间
    const duration = animDiaryCount.value === 0 ? 1000 : 500
    animateNumber(animDiaryCount, diaryCount.value, duration)
    animateNumber(animTodoDone, todoDone.value, duration)
    animateNumber(animStreak, streak.value, duration)
  } catch (err) {
    console.error('[Stats] 加载统计数据失败:', err)
  }
}

// ========== 生命周期 ==========
onMounted(() => {
  loadStats()

  // 消费翻页方向
  pageDirection.value = uni.$flipDirection
  uni.$flipDirection = null
})

onShow(() => {
  loadStats()
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

/* 章节标题 */
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
  margin-bottom: 32px;
  font-weight: 400;
}

/* 统计容器 */
.stats-container {
  margin-top: 40px;
}

/* 统计块 - 活字印刷风格 */
.stat-block {
  margin-bottom: 36px;
  position: relative;
  padding-left: 24px;
  border-left: 2px solid #C4B9A8;
}

.stat-number {
  font-family: 'Noto Serif SC','Songti SC','STSong',serif;
  font-size: 44px;
  font-weight: 300;
  letter-spacing: -2px;
  line-height: 1;
  margin-bottom: 8px;
  color: #2C2C2C;
  display: block;
  font-variant-numeric: tabular-nums;
}

.stat-caption {
  font-size: 13px;
  color: #8C8C83;
  letter-spacing: 2px;
  font-weight: 400;
}

/* 引言 — 夹页便签风格 */
.quote-block {
  margin-top: 56px;
  padding: 28px 24px;
  background: #FBF9F2;
  border-radius: 3px;
  font-family: 'Noto Serif SC','Songti SC','STSong',serif;
  font-size: 14px;
  line-height: 2.2;
  color: #7A7A70;
  display: flex;
  flex-direction: column;
  gap: 2px;
  position: relative;
  box-shadow:
    0 2px 8px rgba(0,0,0,.03),
    1px 3px 12px rgba(0,0,0,.05);

  /* 模拟纸张错位 */
  &::before {
    content: '';
    position: absolute;
    inset: -6px -4px 6px 4px;
    background: rgba(196,185,168,.06);
    border-radius: 2px;
    z-index: -1;
    transform: rotate(0.5deg);
  }
}

.quote-line::before {
  content: '“';
  font-size: 22px;
  color: #C4B9A8;
  margin-right: 2px;
}

/* 响应式 */
@media (max-height: 700px) {
  .chapter-title {
    font-size: 22px;
  }
  .stat-number {
    font-size: 36px;
  }
}
</style>
