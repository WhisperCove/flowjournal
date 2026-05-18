<template>
  <view class="page-container">
    <view class="book-stage">
      <view class="book">
        <view class="book-cover"></view>
        <MoodMark v-model="currentMood" />

        <BookPage :direction="pageDirection" :headerLeft="headerDate" :headerRight="headerTime">
          <!-- 往日切换导航 -->
          <view class="date-nav ink-in" style="animation-delay:0.05s">
            <view class="date-arrow" @tap="goPrevDay" hover-class="arrow-tap">〈</view>
            <text class="date-label">{{ dateLabel }}</text>
            <view class="date-arrow" @tap="goNextDay" hover-class="arrow-tap">〉</view>
          </view>

          <h1 class="chapter-title ink-in" style="animation-delay:0.1s">{{ chapterTitle }}</h1>
          <p class="chapter-sub ink-in" style="animation-delay:0.2s">{{ greetingText }}</p>

          <!-- 日记列表 -->
          <view class="ink-in" style="animation-delay:0.3s">
            <view class="diary-section-hd">
              <text class="section-label">纸页记录</text>
              <view class="hd-add" @tap="openCompose">
                <text class="hd-add-icon">+</text>
                <text>新篇</text>
              </view>
            </view>

            <view v-if="filteredDiaries.length === 0" class="empty-leaf">
              <text class="empty-leaf-icon">🍂</text>
              <text class="empty-text">纸页尚新</text>
              <text class="empty-sub">点 + 新篇写下第一行字</text>
            </view>
            <DiaryCard
              v-for="(d, i) in filteredDiaries"
              :key="d.id"
              :diary="d"
              :index="i"
              :isNew="i === 0 && isNewDiary"
              @cross="handleCross"
              @delete="handleDeleteDiary"
              @tap="handleDiaryTap"
            />
          </view>
        </BookPage>

        <NavSpine :current="'home'" />
      </view>
    </view>

    <ComposeSheet v-model:open="composeOpen" :mood="currentMood" @save="handleSaveDiary" />
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow, onHide } from '@dcloudio/uni-app'
import BookPage from '@/components/BookPage.vue'
import MoodMark from '@/components/MoodMark.vue'
import NavSpine from '@/components/NavSpine.vue'
import DiaryCard from '@/components/DiaryCard.vue'
import ComposeSheet from '@/components/ComposeSheet.vue'

const pageDirection = ref(uni.$flipDirection || null)
const currentMood = ref(uni.$appState?.currentMood || '🍃')
const diaries = ref([])
const composeOpen = ref(false)
const isNewDiary = ref(false)
let timeTimer = null, newDiaryTimer = null

// 往日切换
const dayOffset = ref(0)
const dateLabel = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + dayOffset.value)
  if (dayOffset.value === 0) return '今日'
  if (dayOffset.value === -1) return '昨天'
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
})
const chapterTitle = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + dayOffset.value)
  return dayOffset.value === 0
    ? '今日手账'
    : d.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' }) + ' 手账'
})
const greetingText = ref('')
const headerDate = ref('')
const headerTime = ref('')

// 按日期过滤
const filteredDiaries = computed(() => {
  if (dayOffset.value === 0) return diaries.value
  const target = new Date()
  target.setDate(target.getDate() + dayOffset.value)
  const targetStr = target.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  return diaries.value.filter(d => d.date === targetStr)
})

function goPrevDay() { dayOffset.value-- }
function goNextDay() { if (dayOffset.value < 0) dayOffset.value++ }

function updateTime() {
  const now = new Date()
  now.setDate(now.getDate() + dayOffset.value)
  const hrs = now.getHours()
  const g = hrs < 12 ? '晨安' : hrs < 18 ? '日安' : '晚安'
  headerDate.value = now.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
  headerTime.value = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  greetingText.value = `${g}，记录流动的思绪`
}

function openCompose() { composeOpen.value = true }

async function handleSaveDiary(content) {
  const now = new Date()
  const diary = {
    text: content,
    mood: currentMood.value,
    date: now.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
    fullDate: now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
    timestamp: now.getTime()
  }
  try {
    const id = await uni.$db.addDiary(diary)
    diary.id = id
    diaries.value.unshift(diary)
    isNewDiary.value = true
    clearTimeout(newDiaryTimer)
    newDiaryTimer = setTimeout(() => { isNewDiary.value = false }, 3000)
    uni.$emit('particle:inkBurst', {
      x: typeof window !== 'undefined' ? window.innerWidth/2 : 187,
      y: typeof window !== 'undefined' ? window.innerHeight/2 : 333,
      color: '180,170,150'
    })
    try { uni.vibrateShort({ type: 'light' }) } catch (e) { /**/ }
  } catch (err) {
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}

function handleCross(diary) { /* 划掉已由 DiaryCard 自管理 */ }
function handleDiaryTap(diary) { /* 保留 */ }

async function handleDeleteDiary(diary) {
  try {
    await uni.$db.deleteDiary(diary.id)
    diaries.value = diaries.value.filter(d => d.id !== diary.id)
    try { uni.vibrateShort({ type: 'heavy' }) } catch (e) { /**/ }
  } catch (e) { uni.showToast({ title: '删除失败', icon: 'none' }) }
}

async function loadData() {
  try {
    const data = await uni.$db.getDiaries()
    diaries.value = data || []
  } catch (e) { console.error('[Home] 加载失败:', e) }
}

onMounted(() => {
  updateTime()
  timeTimer = setInterval(updateTime, 60000)
  loadData()
  pageDirection.value = uni.$flipDirection
  uni.$flipDirection = null
})
onShow(() => { loadData(); updateTime() })
onHide(() => {
  if (timeTimer) { clearInterval(timeTimer); timeTimer = null }
})
</script>

<style lang="scss" scoped>
.page-container { position: relative; width: 100vw; height: 100vh; overflow: hidden; }
.book-stage {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center; padding: 12px;
  background: radial-gradient(circle at 50% 30%, #F0EDE6 0%, #E8E4DC 100%);
}
.book {
  width: 100%; max-width: 480px; height: 92vh; max-height: 860px;
  position: relative; transform-style: preserve-3d; perspective: 2000px;
}
.book-cover {
  position: absolute; inset: -8px;
  background: linear-gradient(105deg,#E6E2DA,#D8D4CC,#E6E2DA);
  border-radius: 8px 16px 16px 8px;
  box-shadow: 0 20px 50px rgba(0,0,0,.15), 0 4px 12px rgba(0,0,0,.1);
  z-index: 0; transform: translateZ(-20px);
}

/* --- 往日导航 --- */
.date-nav {
  display: flex; align-items: center; justify-content: center;
  gap: 16px; margin-bottom: 20px;
}
.date-arrow {
  font-size: 16px; color: #B0ADA0; padding: 4px 10px;
  font-family: 'Noto Serif SC',serif; letter-spacing: 0;
  transition: color 0.2s;
}
.arrow-tap { color: #6A6A60; }
.date-label {
  font-family: 'Noto Serif SC','Songti SC','STSong',serif;
  font-size: 13px; color: #8C8C83; letter-spacing: 2px; min-width: 80px; text-align: center;
}

.chapter-title {
  font-family: 'Noto Serif SC','Songti SC','STSong',serif;
  font-size: 26px; font-weight: 300; letter-spacing: 2px; margin-bottom: 6px;
}
.chapter-sub {
  font-size: 13px; color: #8C8C83; letter-spacing: 1px; margin-bottom: 28px;
}

/* 日记区域标题 */
.diary-section-hd {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;
}
.section-label {
  font-family: 'Noto Serif SC',serif; font-size: 13px; letter-spacing: 2px; color: #8C8C83;
}
.hd-add {
  display: flex; align-items: center; gap: 4px;
  font-size: 13px; color: #8C8C83; padding: 4px 12px; cursor: pointer;
}
.hd-add-icon {
  font-size: 16px; font-weight: 300;
}

.empty-leaf {
  text-align: center; padding: 50px 20px; color: #8C8C83;
  font-family: 'Noto Serif SC',serif;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
}
.empty-leaf-icon { font-size: 28px; margin-bottom: 10px; opacity: .4; }
.empty-text { font-size: 14px; }
.empty-sub { font-size: 12px; opacity: .5; }
</style>
