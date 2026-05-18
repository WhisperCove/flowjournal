<template>
  <view class="fab" @tap="handleTap" hover-class="fab-active">
    <text class="fab-icon">+</text>
  </view>
</template>

<script setup>
const emit = defineEmits(['tap'])
function handleTap() {
  emit('tap')
}
</script>

<style lang="scss" scoped>
.fab {
  position: absolute;
  bottom: 88px;
  right: 24px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #2C2C2C;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  box-shadow: 0 4px 16px rgba(0,0,0,.12);
  transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
}
.fab-icon {
  font-size: 28px;
  font-weight: 200;
  color: #FDFCF8;
  line-height: 1;
}
.fab-active {
  transform: scale(0.9);
}
</style>
