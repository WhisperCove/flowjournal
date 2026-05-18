<template>
  <canvas
    ref="canvasRef"
    class="particle-canvas"
    id="universe"
  ></canvas>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, getCurrentInstance } from 'vue'

const canvasRef = ref(null)
let ctx = null
let canvas = null
let rafId = null

// ========== 粒子系统 ==========
const breathParticles = []
const dustParticles = []
let breathScale = 1

// ========== 呼吸粒子 ==========
class BreathParticle {
  constructor() {
    this.reset()
  }

  reset() {
    const angle = Math.random() * Math.PI * 2
    const dist = 50 + Math.random() * 100
    this.baseX = (typeof window !== 'undefined' ? window.innerWidth : 375) / 2 + Math.cos(angle) * dist
    this.baseY = (typeof window !== 'undefined' ? window.innerHeight : 667) / 2 + Math.sin(angle) * dist
    this.x = this.baseX
    this.y = this.baseY
    this.angle = angle
    this.baseRadius = 50 + Math.random() * 150
    this.speed = 0.2 + Math.random() * 0.5
    this.size = 1 + Math.random() * 2.5
    this.baseSize = this.size
    this.alpha = 0.2 + Math.random() * 0.4
    this.hue = 30 + Math.random() * 40
    this.wander = Math.random() * 0.02
    this.currentAlpha = this.alpha
  }

  update(breathScale) {
    const wW = typeof window !== 'undefined' ? window.innerWidth : 375
    const wH = typeof window !== 'undefined' ? window.innerHeight : 667
    const currentRadius = this.baseRadius * breathScale
    const targetX = wW / 2 + Math.cos(this.angle) * currentRadius
    const targetY = wH / 2 + Math.sin(this.angle) * currentRadius
    this.x += (targetX - this.x) * 0.05
    this.y += (targetY - this.y) * 0.05
    this.angle += this.wander
    this.size = this.baseSize * (0.8 + breathScale * 0.4)
    this.currentAlpha = this.alpha * (0.5 + breathScale * 0.5)
  }

  draw(ctx) {
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${this.hue}, 60%, 70%, ${this.currentAlpha})`
    ctx.fill()
    if (this.size > 2) {
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${this.hue}, 60%, 70%, ${this.currentAlpha * 0.15})`
      ctx.fill()
    }
  }
}

// ========== 尘埃粒子 ==========
class DustParticle {
  constructor(x, y, color) {
    this.x = x
    this.y = y
    this.vx = (Math.random() - 0.5) * 6
    this.vy = (Math.random() - 0.5) * 6 - 3
    this.life = 1
    this.decay = 0.015 + Math.random() * 0.02
    this.size = 2 + Math.random() * 3
    this.color = color || '200, 190, 170'
  }

  update() {
    this.x += this.vx
    this.y += this.vy
    this.vy += 0.08 // 重力
    this.life -= this.decay
    this.size *= 0.97
  }

  draw(ctx) {
    if (this.life <= 0) return
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${this.color}, ${this.life})`
    ctx.fill()
  }
}

// ========== 初始化 ==========
function initParticles() {
  breathParticles.length = 0
  for (let i = 0; i < 60; i++) {
    breathParticles.push(new BreathParticle())
  }
}

function resizeCanvas() {
  if (!canvas) return
  canvas.width = typeof window !== 'undefined' ? window.innerWidth : 375
  canvas.height = typeof window !== 'undefined' ? window.innerHeight : 667
}

// ========== 动画循环 ==========
function animateLoop() {
  if (!ctx || !canvas) {
    rafId = requestAnimationFrame(animateLoop)
    return
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 绘制呼吸粒子
  breathParticles.forEach(p => {
    p.update(breathScale)
    p.draw(ctx)
  })

  // 绘制中心光晕
  const cx = canvas.width / 2
  const cy = canvas.height / 2
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 150 * breathScale)
  glow.addColorStop(0, `hsla(35, 50%, 80%, ${0.15 * breathScale})`)
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 绘制尘埃粒子
  for (let i = dustParticles.length - 1; i >= 0; i--) {
    const p = dustParticles[i]
    p.update()
    if (p.life <= 0) {
      dustParticles.splice(i, 1)
    } else {
      p.draw(ctx)
    }
  }

  rafId = requestAnimationFrame(animateLoop)
}

// ========== 公开方法 ==========
function spawnInkBurst(x, y, colorStr) {
  const color = colorStr || '180, 170, 150'
  for (let i = 0; i < 24; i++) {
    dustParticles.push(new DustParticle(x, y, color))
  }
}

function spawnBookmarkDust(x, y, mood) {
  const colors = {
    '🍃': '160, 190, 160',
    '☀️': '230, 200, 120',
    '🌧️': '160, 180, 200',
    '✨': '230, 210, 150',
    '🌙': '180, 180, 200'
  }
  const color = colors[mood] || '180, 170, 150'
  for (let i = 0; i < 12; i++) {
    dustParticles.push(new DustParticle(x, y, color))
  }
}

function setBreathScale(scale) {
  breathScale = scale
}

function resetBreathScale() {
  breathScale = 1
}

// 暴露给父组件
defineExpose({
  spawnInkBurst,
  spawnBookmarkDust,
  setBreathScale,
  resetBreathScale
})

// ========== 生命周期 ==========
onMounted(() => {
  canvas = canvasRef.value
  if (canvas) {
    ctx = canvas.getContext('2d')
    resizeCanvas()
    initParticles()
    animateLoop()

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', resizeCanvas)
    }
  }
})

onBeforeUnmount(() => {
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', resizeCanvas)
  }
})
</script>

<style lang="scss" scoped>
.particle-canvas {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
}
</style>
