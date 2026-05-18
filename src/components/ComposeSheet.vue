<template>
  <!-- 遮罩层 -->
  <view
    class="compose-overlay"
    :class="{ open: isOpen }"
    @click="close"
  ></view>

  <!-- 撰写弹窗 -->
  <view class="compose-sheet" :class="{ open: isOpen }">
    <!-- 拖拽指示条 -->
    <view class="compose-indicator"></view>

    <!-- 头部 -->
    <view class="compose-header">
      <text class="compose-mood">{{ mood }}</text>
      <view class="compose-meta">
        <text class="compose-title">新篇</text>
        <text class="compose-date">{{ todayDate }}</text>
      </view>
    </view>

    <!-- 文本区 -->
    <textarea
      ref="textAreaRef"
      class="compose-area"
      :value="text"
      @input="onInput"
      placeholder="此刻，你在想什么？&#10;纸已铺好，请落笔..."
      :auto-height="false"
      :maxlength="-1"
    ></textarea>

    <!-- 底部按钮 -->
    <view class="compose-footer">
      <view class="btn-ghost" @click="close">
        <text>收起</text>
      </view>
      <view class="btn-solid" @click="save">
        <text>保存</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({
  /** 是否打开 */
  open: {
    type: Boolean,
    default: false
  },
  /** 当前情绪 */
  mood: {
    type: String,
    default: '🍃'
  }
})

const emit = defineEmits(['update:open', 'save'])

const isOpen = ref(false)
const text = ref('')
const textAreaRef = ref(null)

// 计算今日日期
const todayDate = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
})

// ========== 控制开关 ==========
function open() {
  isOpen.value = true
  text.value = ''
  nextTick(() => {
    // 等待弹窗滑入后聚焦
    setTimeout(() => {
      if (textAreaRef.value) {
        // #ifdef H5
        const el = document.querySelector('.compose-area')
        if (el) el.focus()
        // #endif
      }
    }, 400)
  })
}

function close() {
  isOpen.value = false
  emit('update:open', false)
}

// ========== 保存 ==========
function save() {
  const content = text.value.trim()
  if (!content) return

  emit('save', content)
  close()
  text.value = ''

  // 触发墨滴粒子
  const x = typeof window !== 'undefined' ? window.innerWidth / 2 : 187
  const y = typeof window !== 'undefined' ? window.innerHeight / 2 : 333
  uni.$emit('particle:inkBurst', { x, y, color: '180, 170, 150' })
}

function onInput(e) {
  text.value = e.detail.value
}

// 监听 open prop 变化
watch(() => props.open, (val) => {
  if (val) {
    open()
  } else {
    close()
  }
})

// 暴露打开方法
defineExpose({ open, close })
</script>

<style lang="scss" scoped>
/* 遮罩层 */
.compose-overlay {
  position: fixed;
  inset: 0;
  background: rgba(232, 228, 220, 0.8);
  backdrop-filter: blur(4px);
  z-index: 200;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.5s ease;

  &.open {
    opacity: 1;
    pointer-events: all;
  }
}

/* 撰写弹窗主体 */
.compose-sheet {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%) translateY(100%);
  width: 100%;
  max-width: 480px;
  height: 80vh;
  background: #FFFEF9;
  border-radius: 24px 24px 0 0;
  z-index: 201;
  transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &.open {
    transform: translateX(-50%) translateY(0);
  }
}

/* 拖拽指示条 */
.compose-indicator {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: 36px;
  height: 4px;
  background: #C4B9A8;
  border-radius: 2px;
  opacity: 0.5;
  z-index: 2;
}

/* 头部 */
.compose-header {
  padding: 32px 28px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.compose-mood {
  font-size: 20px;
}

.compose-meta {
  display: flex;
  flex-direction: column;
}

.compose-title {
  font-size: 15px;
  font-weight: 500;
}

.compose-date {
  font-size: 12px;
  color: #8C8C83;
  margin-top: 2px;
}

/* 文本区域 */
.compose-area {
  flex: 1;
  padding: 24px 28px;
  border: none;
  outline: none;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif;
  font-size: 16px;
  line-height: 1.8;
  background: transparent;
  color: #2C2C2C;
  resize: none;
  width: 100%;
  box-sizing: border-box;
}

.compose-area::placeholder {
  color: #8C8C83;
  opacity: 0.6;
}

/* 底部按钮 */
.compose-footer {
  padding: 16px 28px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-ghost {
  background: none;
  border: none;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif;
  font-size: 14px;
  color: #8C8C83;
  cursor: pointer;
  padding: 8px 16px;
  -webkit-tap-highlight-color: transparent;
}

.btn-solid {
  background: #2C2C2C;
  color: #FDFCF8;
  border: none;
  padding: 12px 28px;
  border-radius: 24px;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif;
  font-size: 14px;
  cursor: pointer;
  letter-spacing: 1px;
  transition: transform 0.2s ease;
  -webkit-tap-highlight-color: transparent;

  &:active {
    transform: scale(0.96);
  }
}
</style>
