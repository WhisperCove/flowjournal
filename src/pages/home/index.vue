<template>
  <view class="page-container" @touchstart="swipe.onTouchStart" @touchend="swipe.onTouchEnd">
    <view class="book-stage">
      <view class="book">
        <view class="book-cover"></view>
        <MoodMark v-model="currentMood" />

        <BookPage :direction="pageDirection" :headerLeft="headerDate" :headerRight="headerWeekday">
          <!-- 日期切换 -->
          <view class="date-nav ink-in" style="animation-delay:0.05s">
            <view class="date-arrow" @click="switchDay(-1)">〈</view>
            <view class="date-label-wrap">
              <text class="date-label" :class="{ sliding: dateSlide }">{{ dateLabel }}</text>
            </view>
            <view class="date-arrow" @click="switchDay(1)">〉</view>
          </view>

          <h1 class="chapter-title ink-in" style="animation-delay:0.1s">{{ chapterTitle }}</h1>
          <p class="chapter-sub ink-in" style="animation-delay:0.2s">{{ greetingText }}</p>

          <!-- 日记列表 -->
          <view class="diary-stage ink-in" style="animation-delay:0.3s">
            <view class="diary-section-hd">
              <text class="section-label">纸页记录</text>
              <view class="hd-add" @click="openCompose">
                <text class="hd-add-icon">+</text>
                <text>新篇</text>
              </view>
            </view>

            <view class="diary-list" :class="{ fading: listFading }">
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
                @delete="handleDeleteDiary"
                @tap-card="handleDiaryTap"
              />
            </view>
          </view>
        </BookPage>
      </view>
    </view>

    <NavSpine :current="'home'" />

    <!-- 撰写弹窗 -->
    <ComposeSheet v-model:open="composeOpen" :mood="currentMood" @save="handleSaveDiary" />

    <!-- 卡片详情弹窗（可编辑/保存/删除） -->
    <view class="detail-overlay" :class="{ open: detailDiary }" @click="closeDetail">
      <view class="detail-sheet" :class="{ open: detailDiary }" @click.stop>
        <view class="detail-close" @click="closeDetail">✕</view>
        <view class="detail-date">{{ detailDiary?.fullDate || detailDiary?.date }}</view>
        <view class="detail-mood-label">{{ detailDiary?.mood }} {{ moodName(detailDiary?.mood) }}</view>

        <!-- 编辑或阅读模式 -->
        <textarea
          v-if="editing"
          v-model="editText"
          class="detail-textarea"
          :maxlength="-1"
          :auto-height="false"
        ></textarea>
        <view v-else class="detail-body">{{ detailDiary?.text }}</view>

        <!-- 操作按钮 -->
        <view class="detail-actions">
          <view class="detail-btn detail-btn-del" @click="confirmDeleteDetail">删除</view>
          <view v-if="!editing" class="detail-btn detail-btn-edit" @click="startEdit">编辑</view>
          <view v-else class="detail-btn detail-btn-save" @click="saveEdit">保存</view>
        </view>
      </view>
    </view>
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
import { useSwipeNav } from '@/utils/swipeNav.js'

const swipe = useSwipeNav('home')

const pageDirection = ref(uni.$flipDirection || null)
const currentMood = ref(uni.$appState?.currentMood || '🍃')
const diaries = ref([])
const composeOpen = ref(false)
const isNewDiary = ref(false)
const detailDiary = ref(null)
const editing = ref(false)
const editText = ref('')
let timeTimer = null, newDiaryTimer = null

// 日期
const dayOffset = ref(0)
const dateSlide = ref(false)
const listFading = ref(false)

// ⚡ 所有日期格式化一致，按天数偏移严格过滤
function targetDate() {
  const d = new Date()
  d.setDate(d.getDate() + dayOffset.value)
  return d
}

const dateLabel = computed(() => {
  const d = targetDate()
  if (dayOffset.value === 0) return '今日'
  if (dayOffset.value === -1) return '昨天'
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
})
const chapterTitle = computed(() => {
  const d = targetDate()
  return dayOffset.value === 0
    ? '今日手账'
    : d.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' }) + ' 手账'
})
const headerDate = computed(() => {
  return targetDate().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
})
const headerWeekday = computed(() => {
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return '周' + weekdays[targetDate().getDay()]
})
const greetingText = computed(() => {
  const hrs = targetDate().getHours()
  const g = hrs < 12 ? '晨安' : hrs < 18 ? '日安' : '晚安'
  return `${g}，记录流动的思绪`
})

// ✅ 严格过滤：始终按日期字段匹配，今天也不例外
const filteredDiaries = computed(() => {
  const d = targetDate()
  const fmt = d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  return diaries.value.filter(item => item.date === fmt)
})

function switchDay(dir) {
  listFading.value = true
  dateSlide.value = true
  setTimeout(() => {
    dayOffset.value += dir
    dateSlide.value = false
  }, 200)
  setTimeout(() => { listFading.value = false }, 400)
}

// 卡片点击展开详情
function handleDiaryTap(diary) {
  detailDiary.value = diary
  editing.value = false
  editText.value = ''
  try { uni.vibrateShort({ type: 'light' }) } catch (e) { /**/ }
}

function closeDetail() {
  if (editing.value) { editing.value = false; return }
  detailDiary.value = null
}

const moodNames = { '🍃': '平静', '☀️': '愉悦', '🌧️': '忧郁', '✨': '惊喜', '🌙': '疲倦' }
function moodName(emoji) { return moodNames[emoji] || '' }

function startEdit() {
  editText.value = detailDiary.value?.text || ''
  editing.value = true
}

async function saveEdit() {
  if (!detailDiary.value || !editText.value.trim()) return
  try {
    await uni.$db.updateDiary(detailDiary.value.id, editText.value.trim())
    detailDiary.value.text = editText.value.trim()
    // 同步更新本地列表
    const d = diaries.value.find(x => x.id === detailDiary.value.id)
    if (d) d.text = editText.value.trim()
    editing.value = false
    uni.showToast({ title: '已保存', icon: 'none' })
  } catch (e) { uni.showToast({ title: '保存失败', icon: 'none' }) }
}

function confirmDeleteDetail() {
  uni.showModal({
    title: '删除记录',
    content: '确定要删除这条记录吗？',
    success: (res) => {
      if (res.confirm && detailDiary.value) {
        handleDeleteDiary(detailDiary.value)
        detailDiary.value = null
      }
    }
  })
}

function openCompose() { composeOpen.value = true }

async function handleSaveDiary(content) {
  const now = new Date()
  const diary = {
    text: content, mood: currentMood.value,
    date: now.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
    fullDate: now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }),
    timestamp: now.getTime()
  }
  try {
    const id = await uni.$db.addDiary(diary)
    diary.id = id; diaries.value.unshift(diary)
    isNewDiary.value = true
    clearTimeout(newDiaryTimer)
    newDiaryTimer = setTimeout(() => isNewDiary.value = false, 3000)
    uni.$emit('particle:inkBurst', { x: 200, y: 400, color: '180,170,150' })
    try { uni.vibrateShort({ type: 'light' }) } catch (e) { /**/ }
  } catch (e) { uni.showToast({ title: '保存失败', icon: 'none' }) }
}

async function handleDeleteDiary(diary) {
  try {
    await uni.$db.deleteDiary(diary.id)
    diaries.value = diaries.value.filter(d => d.id !== diary.id)
  } catch (e) { uni.showToast({ title: '删除失败', icon: 'none' }) }
}

async function loadData() {
  try {
    const data = await uni.$db.getDiaries()
    diaries.value = data || []
  } catch (e) { console.error('[Home] 加载失败:', e) }
}

onMounted(() => {
  loadData()
  pageDirection.value = uni.$flipDirection
  uni.$flipDirection = null
})
onShow(() => loadData())
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

/* 日期导航 */
.date-nav {
  display: flex; align-items: center; justify-content: center;
  gap: 16px; margin-bottom: 18px;
}
.date-arrow {
  font-size: 18px; color: #B0ADA0; padding: 4px 10px;
  font-family: 'Noto Serif SC',serif;
}
.date-label-wrap { overflow: hidden; min-width: 72px; text-align: center; }
.date-label {
  font-family: 'Noto Serif SC','Songti SC','STSong',serif;
  font-size: 13px; color: #8C8C83; letter-spacing: 2px;
  display: inline-block; transition: transform 0.3s ease, opacity 0.3s ease;
}
.date-label.sliding { transform: translateX(30px); opacity: 0; }
.diary-list { transition: opacity 0.3s ease; }
.diary-list.fading { opacity: .3; }

.chapter-title {
  font-family: 'Noto Serif SC','Songti SC','STSong',serif;
  font-size: 26px; font-weight: 300; letter-spacing: 2px; margin-bottom: 6px;
}
.chapter-sub {
  font-size: 13px; color: #8C8C83; letter-spacing: 1px; margin-bottom: 28px;
}

.diary-section-hd {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;
}
.section-label { font-family: 'Noto Serif SC',serif; font-size: 13px; letter-spacing: 2px; color: #8C8C83; }
.hd-add {
  display: flex; align-items: center; gap: 4px;
  font-size: 13px; color: #8C8C83; padding: 4px 12px; cursor: pointer;
}
.hd-add-icon { font-size: 16px; font-weight: 300; }

.empty-leaf {
  margin-top: 45%;		
  text-align: center; padding: 50px 20px; color: #8C8C83;
  font-family: 'Noto Serif SC',serif;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
}
.empty-leaf-icon { font-size: 28px; margin-bottom: 10px; opacity: .4; }
.empty-text { font-size: 14px; }
.empty-sub { font-size: 12px; opacity: .5; }

/* 卡片详情弹窗 */
.detail-overlay {
  position: fixed; inset: 0; background: rgba(232,228,220,.65);
  backdrop-filter: blur(6px);
  z-index: 300; opacity: 0; pointer-events: none;
  transition: opacity 0.35s ease;
  display: flex; align-items: center; justify-content: center;
}
.detail-overlay.open { opacity: 1; pointer-events: all; }

.detail-sheet {
  width: 80%; max-width: 420px; max-height: 70vh;
  background: #FDFCF8; border-radius: 16px;
  padding: 32px 28px; position: relative;
  box-shadow: 0 8px 32px rgba(0,0,0,.08);
  transform: scale(.9) translateY(30px); opacity: 0;
  transition: all 0.4s cubic-bezier(0.22,1,0.36,1);
  overflow-y: auto;
}
.detail-sheet.open { transform: scale(1) translateY(0); opacity: 1; }

.detail-close {
  position: absolute; top: 12px; right: 16px;
  font-size: 18px; color: #B0ADA0; padding: 4px; cursor: pointer;
}
.detail-date {
  font-family: 'Noto Serif SC',serif;
  font-size: 14px; color: #8C8C83; margin-bottom: 4px; letter-spacing: 1px;
}
.detail-mood-label {
  font-size: 13px; color: #B0ADA0; margin-bottom: 16px;
}

/* 编辑文本域 */
.detail-textarea {
  width: 100%; min-height: 120px;
  border: 1px solid rgba(196,185,168,.3); border-radius: 6px;
  padding: 14px; font-size: 15px; line-height: 1.8;
  font-family: -apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif;
  color: #3E2723; background: rgba(255,255,255,.6); resize: vertical;
  box-sizing: border-box;
}

.detail-body {
  font-size: 16px; line-height: 2; color: #3E2723;
  white-space: pre-wrap; padding: 8px 0;
}
.detail-mood {
  margin-top: 20px; font-size: 13px; color: #B0ADA0;
}

/* 操作按钮 */
.detail-actions {
  display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px;
}
.detail-btn {
  padding: 10px 24px; border-radius: 20px;
  font-size: 13px; letter-spacing: 1px; cursor: pointer;
}
.detail-btn-del  { background: rgba(200,150,150,.2); color: #8B4A4A; }
.detail-btn-edit { background: rgba(196,185,168,.25); color: #5A5A50; }
.detail-btn-save { background: #2C2C2C; color: #FDFCF8; }
</style>
