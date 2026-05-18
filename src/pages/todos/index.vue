<template>
  <view class="page-container">
    <view class="book-stage">
      <view class="book">
        <view class="book-cover"></view>

        <BookPage :direction="pageDirection" headerLeft="待办" headerRight="IV">
          <!-- 标题 + 进度 -->
          <view class="ink-in" style="animation-delay:0.1s">
            <view class="todo-header-bar">
              <h1 class="chapter-title">待办</h1>
              <text class="todo-progress-num">{{ doneCount }}/{{ totalCount }}</text>
            </view>
            <view class="progress-track" v-if="totalCount > 0">
              <view class="progress-fill" :style="{ width: progressPct + '%' }"></view>
            </view>
          </view>

          <!-- 快速添加条 -->
          <view class="ink-in todo-add-area" style="animation-delay:0.18s">
            <view class="add-row" :class="{ expanded: addOpen }">
              <view class="add-dot" @tap="addOpen = !addOpen">
                <text>{{ addOpen ? '✕' : '+' }}</text>
              </view>
              <input
                v-if="addOpen"
                v-model="todoText"
                class="add-field"
                placeholder="写件小事…"
                @confirm="addTodo"
                confirm-type="done"
                :focus="addOpen"
              />
            </view>
          </view>

          <!-- 列表 -->
          <view class="todo-pad" v-if="todos.length > 0">
            <view
              v-for="(t, i) in todos"
              :key="t.id"
              class="todo-strip"
              :class="{ done: t.completed, hovered: hoverMap[t.id], deleting: deletingMap[t.id] }"
            >
              <!-- 滑动显露的操作 -->
              <view class="strip-actions">
                <view
                  v-if="hoverMap[t.id] && hoverSide[t.id] === 'right'"
                  class="action-btn action-done"
                  @tap.stop="doToggle(t)"
                >
                  <text>✓ 完成</text>
                </view>
                <view
                  v-if="hoverMap[t.id] && hoverSide[t.id] === 'left'"
                  class="action-btn action-del"
                  @tap.stop="doDelete(t)"
                >
                  <text>✕ 删除</text>
                </view>
              </view>

              <!-- 主条 -->
              <view
                class="strip-body"
                :style="{ transform: 'translateX(' + (stripX[t.id] || 0) + 'px)' }"
                @touchstart="onStripStart($event, t)"
                @touchmove="onStripMove($event, t)"
                @touchend="onStripEnd($event, t)"
                @mousedown="onStripStart($event, t)"
                @mousemove="onStripMove($event, t)"
                @mouseup="onStripEnd($event, t)"
                @mouseleave="onStripEnd($event, t)"
                @tap.stop="onStripTap(t)"
              >
                <view class="strip-circle">
                  <text v-if="t.completed" class="check-icon">✓</text>
                </view>
                <text class="strip-text">{{ t.text }}</text>
              </view>
            </view>
          </view>

          <!-- 空状态 -->
          <view class="ink-in" style="animation-delay:0.3s" v-else>
            <view class="empty-leaf">
              <text class="empty-leaf-icon">☕</text>
              <text class="empty-text">纸上无痕</text>
              <text class="empty-sub">点上方 + 写下第一件小事</text>
            </view>
          </view>
        </BookPage>

        <!-- FAB 已不需要，用顶部的 + 代替 -->
        <NavSpine :current="'todos'" />
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import BookPage from '@/components/BookPage.vue'
import NavSpine from '@/components/NavSpine.vue'

const pageDirection = ref(uni.$flipDirection || null)
const todos = ref([])
const todoText = ref('')
const addOpen = ref(false)

// 悬停状态
const hoverMap = reactive({})    // {id: true/false}
const hoverSide = reactive({})  // {id: 'left'|'right'}
const stripX = reactive({})     // {id: px}
const deletingMap = reactive({})

const totalCount = computed(() => todos.value.length)
const doneCount = computed(() => todos.value.filter(t => t.completed).length)
const progressPct = computed(() =>
  totalCount.value === 0 ? 0 : Math.round(doneCount.value / totalCount.value * 100))

// ---- 滑动处理 ----
let _sx = 0, _cur = null, _dragging = false
const TH = 65

function gx(e) {
  const t = e.changedTouches?.[0] || e.touches?.[0]
  return t ? t.clientX : (e.clientX || 0)
}

function onStripStart(e, t) { _sx = gx(e); _cur = t; _dragging = false }
function onStripMove(e, t) {
  if (_cur !== t) return
  if (hoverMap[t.id]) return
  const dx = gx(e) - _sx
  if (!_dragging && Math.abs(dx) < 5) return
  _dragging = true
  stripX[t.id] = Math.max(-75, Math.min(75, dx))
}
function onStripEnd(e, t) {
  if (_cur !== t) return
  if (hoverMap[t.id]) { stripX[t.id] = 0; return }
  if (!_dragging) return
  const dx = stripX[t.id] || 0
  if (dx > TH) {
    // 右滑 → 悬停 "完成"
    hoverMap[t.id] = true; hoverSide[t.id] = 'right'
  } else if (dx < -TH) {
    // 左滑 → 悬停 "删除"
    hoverMap[t.id] = true; hoverSide[t.id] = 'left'
  } else {
    stripX[t.id] = 0
  }
  _dragging = false
}

function onStripTap(t) {
  // 若已悬停 → 取消悬停
  if (hoverMap[t.id]) {
    hoverMap[t.id] = false
    stripX[t.id] = 0
    return
  }
  handleToggle(t)
}

// ---- 操作 ----
async function handleToggle(t) {
  const v = !t.completed
  try {
    await uni.$db.toggleTodo(t.id, v)
    t.completed = v
    if (v) {
      uni.$emit('particle:inkBurst', {
        x: typeof window !== 'undefined' ? window.innerWidth/2 : 187,
        y: typeof window !== 'undefined' ? window.innerHeight*.5 : 333,
        color: '180,200,160'
      })
    }
    try { uni.vibrateShort({ type: 'medium' }) } catch (e) { /**/ }
  } catch (e) { /**/ }
}

async function doToggle(t) {
  hoverMap[t.id] = false; stripX[t.id] = 0
  handleToggle(t)
}

async function doDelete(t) {
  deletingMap[t.id] = true
  try { uni.vibrateShort({ type: 'heavy' }) } catch (e) { /**/ }
  setTimeout(async () => {
    try {
      await uni.$db.deleteTodo(t.id)
      todos.value = todos.value.filter(x => x.id !== t.id)
    } catch (e) { uni.showToast({ title: '删除失败', icon: 'none' }) }
  }, 400)
}

async function addTodo() {
  const text = todoText.value.trim()
  if (!text) return
  try {
    const todo = await uni.$db.addTodo(text)
    todos.value.unshift({ ...todo })
    todoText.value = ''
    try { uni.vibrateShort({ type: 'light' }) } catch (e) { /**/ }
  } catch (e) { uni.showToast({ title: '添加失败', icon: 'none' }) }
}

async function loadTodos() {
  try {
    const data = await uni.$db.getTodos()
    todos.value = (data || []).map(t => ({ ...t, completed: t.completed === true || t.completed === 1 }))
  } catch (e) { console.error('[Todos] 加载失败:', e) }
}

onMounted(() => {
  pageDirection.value = uni.$flipDirection
  uni.$flipDirection = null
  loadTodos()
})
onShow(() => loadTodos())
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

/* 标题行 */
.todo-header-bar {
  display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 8px;
}
.chapter-title {
  font-family: 'Noto Serif SC','Songti SC','STSong',serif;
  font-size: 24px; font-weight: 300; letter-spacing: 2px;
}
.todo-progress-num {
  font-family: 'Noto Serif SC',serif; font-size: 16px;
  color: #B0ADA0; font-weight: 300;
}

/* 进度条 */
.progress-track {
  height: 3px; background: rgba(196,185,168,.18); border-radius: 2px;
  margin-bottom: 20px; overflow: hidden;
}
.progress-fill {
  height: 100%; border-radius: 2px;
  background: linear-gradient(90deg,#B8C9A8,#8AAA7A);
  transition: width 0.6s ease;
}

/* 添加行 */
.todo-add-area { margin-bottom: 8px; }
.add-row {
  display: flex; align-items: center; gap: 14px;
  padding: 8px 0; border-bottom: 1px solid rgba(196,185,168,.2);
  transition: all 0.3s ease;
  &.expanded { padding-bottom: 10px; }
}
.add-dot {
  width: 34px; height: 34px; border-radius: 50%;
  background: #2C2C2C; color: #FDFCF8;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; flex-shrink: 0; cursor: pointer;
  transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1);
}
.add-row.expanded .add-dot { transform: rotate(45deg); }
.add-field {
  flex: 1; border: none; outline: none; background: transparent;
  font-family: -apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif;
  font-size: 15px; padding: 4px 0; color: #2C2C2C;
}

/* 列表 */
.todo-pad { display: flex; flex-direction: column; gap: 4px; padding-top: 4px; }

.todo-strip {
  position: relative; min-height: 46px;
  overflow: hidden; user-select: none;
  transition: transform 0.3s ease;

  &.done {
    opacity: .35;
    .strip-text { text-decoration: line-through; text-decoration-color: #C4B9A8; text-decoration-thickness: 1px; }
    .strip-circle { background: #C4B9A8; border-color: #C4B9A8; }
  }
  &.deleting {
    animation: stripOut 0.4s cubic-bezier(0.22,1,0.36,1) forwards;
  }
}
@keyframes stripOut {
  0%   { transform: translateX(0); opacity: 1; }
  100% { transform: translateX(80px); opacity: 0; }
}

/* 滑动露出的操作按钮 */
.strip-actions {
  position: absolute; inset: 0; display: flex; align-items: center;
  z-index: 1;
}
.action-btn {
  position: absolute; padding: 6px 16px; border-radius: 14px;
  font-size: 12px; font-weight: 500; letter-spacing: 1px; cursor: pointer;
  z-index: 10;
}
.action-done { right: 8px; background: rgba(160,200,150,.7); color: #3A5A3A; }
.action-del  { left: 8px; background: rgba(200,140,140,.7); color: #5A3030; }

/* 主条 */
.strip-body {
  position: relative; z-index: 2;
  display: flex; align-items: flex-start; gap: 14px;
  padding: 12px 4px; background: transparent;
  cursor: pointer;
  transition: transform 0.4s cubic-bezier(0.22,1,0.36,1);
}

.strip-circle {
  width: 20px; height: 20px;
  border: 1.5px solid #B0ADA0; border-radius: 50%;
  flex-shrink: 0; margin-top: 1px;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1);
}
.check-icon { font-size: 12px; color: white; }
.strip-text {
  flex: 1; font-size: 15px; line-height: 1.7; color: #3C3C3C;
  padding-top: 1px; transition: all 0.3s ease;
}

/* 空状态 */
.empty-leaf {
  text-align: center; padding: 50px 20px; color: #8C8C83;
  font-family: 'Noto Serif SC',serif;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
}
.empty-leaf-icon { font-size: 28px; margin-bottom: 10px; opacity: .4; }
.empty-text { font-size: 14px; }
.empty-sub { font-size: 12px; opacity: .5; }
</style>
