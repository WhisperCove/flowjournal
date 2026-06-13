<template>
  <view class="page-container" @touchstart="swipe.onTouchStart" @touchend="swipe.onTouchEnd">
    <view class="book-stage">
      <view class="book">
        <view class="book-cover"></view>

        <BookPage :direction="pageDirection" headerLeft="Todo" headerRight="II">
          <view class="ink-in" style="animation-delay:0.1s">
            <h1 class="chapter-title">待办清单</h1>
          </view>

          <!-- 创建分组入口 -->
          <view class="ink-in create-group-link" style="animation-delay:0.15s" @tap="createCategory">
            <text class="create-group-text">+ 新建清单</text>
          </view>

          <!-- 分组卡片 -->
          <view v-for="(cat, ci) in categories" :key="cat.id" class="ink-in"
            :style="{ animationDelay: (0.2 + ci * 0.1) + 's' }">
            <view class="cat-card">
              <!-- 分组头：☐ 标题 进度 ▼ -->
              <view class="cat-head" @longpress="confirmDeleteCat(cat)">
                <!-- 聚合复选框 -->
                <view v-if="catTodos(cat.id).length > 0" class="head-check"
                  :class="checkState(cat.id)" @click.stop="toggleGroup(cat.id)">
                  <text v-if="checkState(cat.id) === 'checked'" class="check-mark">✓</text>
                  <text v-else-if="checkState(cat.id) === 'indet'" class="check-mark">—</text>
                </view>
                <view v-else style="width:22px"></view>

                <!-- 标题 -->
                <input v-if="renamingCat === cat.id" v-model="cat.name"
                  class="cat-name-input" @blur="doneRenameCat" @confirm="doneRenameCat"
                  :focus="true" confirm-type="done" @click.stop />
                <text v-else class="cat-name" @click.stop="renameCat(cat)">{{ cat.name }}</text>

                <!-- 进度文本 -->
                <text class="cat-progress-text">{{ catDone(cat.id) }}/{{ catTodos(cat.id).length }}</text>

                <!-- 展开/收起箭头 -->
                <view class="cat-arrow" :class="{ folded: !cat.isExpanded }" @click.stop="toggleFold(cat)">
                  <text>▼</text>
                </view>
              </view>

              <!-- 分隔线 -->
              <view class="cat-divider"></view>

              <!-- 待办列表 -->
              <view class="cat-items" v-if="cat.isExpanded">
                <view v-if="catTodos(cat.id).length === 0" class="cat-empty-msg">
                  <text>空，写件小事</text>
                </view>
                <view v-for="t in catTodos(cat.id)" :key="t.id"
                  class="todo-line" :class="{ done: t.completed }">
                  <view class="line-check" @click.stop="handleToggle(t)">
                    <text v-if="t.completed" class="check-sym">✓</text>
                  </view>
                  <input v-if="renamingTodo === t.id" v-model="t.text"
                    class="line-input-edit" @blur="doneRenameTodo(t)" @confirm="doneRenameTodo(t)"
                    :focus="true" confirm-type="done" @click.stop />
                  <text v-else class="line-text" @click.stop="startRenameTodo(t)">{{ t.text }}</text>
                  <text v-if="t.completed" class="line-done">DONE</text>
                </view>

                <!-- 分组内添加 -->
                <view class="todo-line add-line" @click="focusAdd(cat.id)">
                  <view class="line-check add-circle">+</view>
                  <input v-if="addingCat === cat.id" v-model="addTexts[cat.id]"
                    class="line-input" placeholder="写件小事…"
                    @confirm="addTodo(cat.id)"
                    confirm-type="done" :focus="true" @click.stop />
                  <text v-else class="line-input-placeholder">写件小事…</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 全空状态 -->
          <view v-if="categories.length === 0" class="ink-in" style="animation-delay:0.3s">
            <view class="empty-leaf">
              <text class="empty-leaf-icon">📋</text>
              <text class="empty-text">连一张清单都没有</text>
              <text class="empty-sub">点上方「新建清单」开始</text>
            </view>
          </view>
        </BookPage>
      </view>
    </view>

    <NavSpine :current="'todos'" />

    <!-- 快速添加弹窗 -->
    <view class="quick-overlay" :class="{ open: quickAddOpen }" @click="closeQuickAdd">
      <view class="quick-sheet" :class="{ open: quickAddOpen }" @click.stop>
        <view class="quick-head">
          <text class="quick-title">新待办</text>
          <view class="quick-close" @click="closeQuickAdd">✕</view>
        </view>
        <textarea v-model="quickAddText" class="quick-textarea"
          placeholder="写一件待办…" :maxlength="-1" :auto-height="false"></textarea>
        <view class="quick-foot">
          <text class="quick-hint">将添加到「{{ firstCatName }}」</text>
          <view class="quick-save" @click="quickAdd">保存</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import BookPage from '@/components/BookPage.vue'
import NavSpine from '@/components/NavSpine.vue'
import { useSwipeNav } from '@/utils/swipeNav.js'

const swipe = useSwipeNav('todos')

const pageDirection = ref(uni.$flipDirection || null)

// ========== 数据 ==========
const todos = ref([])
const categories = ref([
  { id: 'default', name: '待办清单', isExpanded: true }
])
const catFold = reactive({})       // 兼容旧代码
const addTexts = reactive({})
const renamingCat = ref(null)
const renamingTodo = ref(null)
const addingCat = ref(null)
const quickAddOpen = ref(false)
const quickAddText = ref('')
const catIdCounter = ref(100)

const STORAGE_KEY = 'flowjournal_groups'

// 第一个分组的名称（用于 FAB 提示）
const firstCatName = computed(() => {
  return categories.value.length > 0 ? categories.value[0].name : '默认清单'
})

// 加载/保存分组
function loadCategories() {
  try {
    const saved = uni.getStorageSync(STORAGE_KEY)
    if (saved) categories.value = JSON.parse(saved)
    else categories.value = [{ id: 'default', name: '待办清单', isExpanded: true }]
  } catch (e) {
    categories.value = [{ id: 'default', name: '待办清单', isExpanded: true }]
  }
}

function saveCategories() {
  try {
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(categories.value.map(c => ({
      id: c.id, name: c.name, isExpanded: c.isExpanded
    }))))
  } catch (e) { /**/ }
}

// 分组统计
function catTodos(catId) {
  return todos.value.filter(t => (t.categoryId || 'default') === catId)
}
function catDone(catId) {
  return catTodos(catId).filter(t => t.completed).length
}

// 聚合态
function checkState(catId) {
  const items = catTodos(catId)
  if (!items.length) return 'hidden'
  const done = items.filter(t => t.completed).length
  if (done === 0) return 'unchecked'
  if (done === items.length) return 'checked'
  return 'indet'
}

// 批量勾选分组
function toggleGroup(catId) {
  const state = checkState(catId)
  const allDone = state === 'checked'
  const items = catTodos(catId)
  items.forEach(t => {
    t.completed = !allDone
    uni.$db.toggleTodo(t.id, !allDone)
  })
  // 批量完成 → 强力粒子 + 震动
  if (!allDone && items.length > 0) {
    uni.$emit('particle:inkBurst', { x: 180, y: 300, color: '180,200,160' })
    setTimeout(() => { uni.$emit('particle:inkBurst', { x: 240, y: 400, color: '180,200,160' }) }, 100)
    try { uni.vibrateShort({ type: 'heavy' }) } catch (e) { /**/ }
  }
}

// 展开/收起
function toggleFold(cat) {
  cat.isExpanded = !cat.isExpanded
  saveCategories()
}

// ========== 分组 CRUD ==========
function createCategory() {
  const id = 'g_' + (catIdCounter.value++)
  categories.value = [...categories.value, { id, name: '新清单', isExpanded: true }]
  saveCategories()
  setTimeout(() => { renamingCat.value = id }, 100)
  try { uni.vibrateShort({ type: 'light' }) } catch (e) { /**/ }
}

function confirmDeleteCat(cat) {
  uni.showModal({
    title: '删除清单',
    content: `确定删除「${cat.name}」及其所有待办？`,
    success: (res) => {
      if (!res.confirm) return
      // 级联删除待办
      const ids = todos.value.filter(t => t.categoryId === cat.id).map(t => t.id)
      ids.forEach(id => uni.$db.deleteTodo(id))
      todos.value = todos.value.filter(t => t.categoryId !== cat.id)
      categories.value = categories.value.filter(c => c.id !== cat.id)
      saveCategories()
    }
  })
}

function renameCat(cat) { renamingCat.value = cat.id }
function doneRenameCat() { renamingCat.value = null; saveCategories() }

// ========== 待办 CRUD ==========
function startRenameTodo(t) { renamingTodo.value = t.id }
async function doneRenameTodo(t) {
  renamingTodo.value = null
  const txt = (t.text || '').trim()
  if (!txt) {
    // 内容为空 → 自动删除
    await handleDelete(t)
    return
  }
  try {
    await uni.$db.updateTodoText(t.id, txt)
  } catch (e) { console.error(e) }
}

// FAB 快速添加
function openQuickAdd() {
  quickAddText.value = ''
  quickAddOpen.value = true
}
function closeQuickAdd() { quickAddOpen.value = false }

async function quickAdd() {
  const txt = quickAddText.value.trim()
  if (!txt) return
  const target = categories.value.length > 0 ? categories.value[0].id : 'default'
  try {
    const todo = await uni.$db.addTodo(txt, target)
    todos.value.push({ ...todo, categoryId: target })
    quickAddText.value = ''
    quickAddOpen.value = false
    try { uni.vibrateShort({ type: 'light' }) } catch (e) { /**/ }
  } catch (e) { uni.showToast({ title: '添加失败', icon: 'none' }) }
}

// 分组内添加
function focusAdd(catId) {
  addingCat.value = catId
  if (!addTexts[catId]) addTexts[catId] = ''
}
async function addTodo(catId) {
  const text = (addTexts[catId] || '').trim()
  if (!text) return
  try {
    const todo = await uni.$db.addTodo(text, catId)
    todos.value.push({ ...todo, categoryId: catId })
    addTexts[catId] = ''
    try { uni.vibrateShort({ type: 'light' }) } catch (e) { /**/ }
  } catch (e) { uni.showToast({ title: '添加失败', icon: 'none' }) }
}

async function handleToggle(todo) {
  try {
    const v = !todo.completed
    await uni.$db.toggleTodo(todo.id, v)
    todo.completed = v
    try { uni.vibrateShort({ type: 'medium' }) } catch (e) { /**/ }
  } catch (e) { /**/ }
}

async function handleDelete(todo) {
  try {
    await uni.$db.deleteTodo(todo.id)
    todos.value = todos.value.filter(t => t.id !== todo.id)
  } catch (e) { /**/ }
}

async function loadTodos() {
  try {
    const data = await uni.$db.getTodos()
    todos.value = (data || []).map(t => ({
      ...t,
      completed: t.completed === true || t.completed === 1,
      categoryId: t.categoryId || 'default'
    }))
  } catch (e) { console.error('[Todos] 加载失败:', e) }
}

watch(categories, () => saveCategories(), { deep: true })

onMounted(() => {
  pageDirection.value = uni.$flipDirection
  uni.$flipDirection = null
  loadCategories()
  loadTodos()
})
onShow(() => loadTodos())
</script>

<style lang="scss" scoped>
.page-container { position: relative; width: 100vw; height: 100vh; overflow: hidden; }
.book-stage { width:100%; height:100%; display:flex; align-items:center; justify-content:center; padding:12px; background:radial-gradient(circle at 50% 30%,#F0EDE6 0%,#E8E4DC 100%); }
.book { width:100%; max-width:480px; height:92vh; max-height:860px; position:relative; transform-style:preserve-3d; perspective:2000px; }
.book-cover { position:absolute; inset:-8px; background:linear-gradient(105deg,#E6E2DA,#D8D4CC,#E6E2DA); border-radius:8px 16px 16px 8px; box-shadow:0 20px 50px rgba(0,0,0,.15),0 4px 12px rgba(0,0,0,.1); z-index:0; transform:translateZ(-20px); }

.chapter-title { font-family:'Noto Serif SC','Songti SC','STSong',serif; font-size:24px; font-weight:300; letter-spacing:2px; margin-bottom:4px; }

/* 新建分组链接 */
.create-group-link { margin-bottom:12px; padding:4px 0; }
.create-group-text { font-size:13px; color:#B0ADA0; letter-spacing:1px; cursor:pointer; }

/* 分类卡片 */
.cat-card { margin-bottom:20px; border-radius:12px; overflow:hidden; box-shadow:0 1px 2px rgba(62,39,35,.08),0 2px 4px rgba(62,39,35,.04); }
.cat-head { display:flex; align-items:center; gap:8px; padding:12px 16px; background:rgba(255,255,255,.7); cursor:pointer; }

/* 聚合复选框 */
.head-check { width:20px; height:20px; border-radius:50%; border:1.5px solid #B0ADA0; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all .3s ease; }
.head-check.checked { background:#C4B9A8; border-color:#C4B9A8; }
.head-check.indet { background:#C4B9A8; border-color:#C4B9A8; opacity:.6; }
.check-mark { font-size:13px; color:white; font-weight:600; }

.cat-name { flex:1; font-size:15px; font-weight:500; color:#3E2723; letter-spacing:1px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.cat-name-input { flex:1; font-size:15px; font-weight:500; color:#3E2723; border:none; outline:none; background:rgba(255,255,255,.5); padding:2px 6px; border-radius:4px; border-bottom:1px solid #C4B9A8; }

/* 进度文本 */
.cat-progress-text { font-size:12px; color:#8B7355; font-weight:500; flex-shrink:0; min-width:28px; text-align:right; }

/* 箭头 */
.cat-arrow { font-size:10px; color:#B0ADA0; transition:transform .25s ease; flex-shrink:0; padding:2px; }
.cat-arrow.folded { transform:rotate(-90deg); }

.cat-divider { height:4px; margin:0 16px; background:repeating-linear-gradient(90deg,rgba(139,115,85,.15) 0,rgba(139,115,85,.15) 6px,transparent 6px,transparent 12px); }

/* 待办区 */
.cat-items { background:#FAFAFA; background-image:repeating-linear-gradient(transparent,transparent 48px,#F0E8DC 48px,#F0E8DC 49px); padding:4px 16px 8px; }
.cat-empty-msg { padding:14px 4px; text-align:center; font-size:13px; color:#B0ADA0; }

.todo-line { display:flex; align-items:center; gap:12px; min-height:48px; padding:2px 4px; transition:opacity .3s ease; }
.todo-line.done { opacity:.4; .line-text { text-decoration:line-through; text-decoration-color:#C4B9A8; } }

.line-check { width:22px; height:22px; border:1.5px solid #B0ADA0; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; transition:all .35s cubic-bezier(.34,1.56,.64,1); }
.todo-line.done .line-check { background:#C4B9A8; border-color:#C4B9A8; }
.check-sym { font-size:13px; color:white; font-weight:600; }

.line-text { flex:1; font-size:15px; color:#3E2723; line-height:1.6; padding:10px 0; cursor:text; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.line-input-edit { flex:1; font-size:15px; color:#3E2723; border:none; outline:none; background:rgba(255,255,255,.6); padding:10px 8px; border-radius:4px; border-bottom:1px solid #C4B9A8; line-height:1.6; height:40px; box-sizing:border-box; }
.line-done { font-size:12px; color:#6B5B4E; font-weight:500; letter-spacing:3px; opacity:.6; flex-shrink:0; animation:doneIn 0.5s cubic-bezier(.22,1,.36,1) forwards; }
@keyframes doneIn {
  0%   { opacity:0; transform:scale(1.5) rotate(-8deg); }
  60%  { opacity:.8; transform:scale(.9) rotate(2deg); }
  100% { opacity:.6; transform:scale(1) rotate(0deg); }
}

.add-line { opacity:1!important; cursor:pointer; min-height:48px; }
.add-circle { background:#E8E0D0; border-color:#D0C8B8; font-size:16px; color:#8B7355; font-weight:400; }
.line-input { flex:1; border:none; outline:none; background:transparent; font-size:15px; padding:10px 0; line-height:1.6; height:40px; color:#3E2723; font-family:-apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif; }
.line-input-placeholder { flex:1; font-size:15px; color:#B0ADA0; padding:10px 0; line-height:1.6; }

/* FAB */
.fab-create { position:absolute; bottom:140px; right:20px; width:48px; height:48px; border-radius:50%; background:#2C2C2C; color:#FDFCF8; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 14px rgba(0,0,0,.14); z-index:60; transition:transform .3s cubic-bezier(.34,1.56,.64,1); }
.fab-create:active { transform:scale(.9); }
.fab-plus { font-size:26px; font-weight:200; line-height:1; }

/* 快速添加弹窗 */
.quick-overlay { position:fixed; inset:0; background:rgba(232,228,220,.65); z-index:300; opacity:0; pointer-events:none; transition:opacity .35s ease; display:flex; align-items:flex-end; justify-content:center; }
.quick-overlay.open { opacity:1; pointer-events:all; }
.quick-sheet { width:100%; max-width:480px; background:#FDFCF8; border-radius:24px 24px 0 0; padding:24px 28px 36px; transform:translateY(100%); transition:transform .45s cubic-bezier(.22,1,.36,1); }
.quick-sheet.open { transform:translateY(0); }
.quick-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
.quick-title { font-size:17px; font-weight:500; color:#3E2723; }
.quick-close { font-size:18px; color:#B0ADA0; padding:4px; cursor:pointer; }
.quick-textarea { width:100%; min-height:100px; border:1px solid rgba(196,185,168,.3); border-radius:8px; padding:14px; font-size:15px; line-height:1.8; font-family:-apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif; color:#3E2723; background:rgba(255,255,255,.6); resize:none; box-sizing:border-box; }
.quick-foot { display:flex; justify-content:space-between; align-items:center; margin-top:16px; }
.quick-hint { font-size:12px; color:#B0ADA0; }
.quick-save { background:#2C2C2C; color:#FDFCF8; padding:10px 28px; border-radius:20px; font-size:14px; letter-spacing:1px; cursor:pointer; }

.empty-leaf { text-align:center; padding:40px 20px; color:#8C8C83; font-family:'Noto Serif SC',serif; display:flex; flex-direction:column; align-items:center; gap:4px; }
.empty-leaf-icon { font-size:28px; margin-bottom:10px; opacity:.4; }
.empty-text { font-size:14px; }
.empty-sub { font-size:12px; opacity:.5; }
</style>
