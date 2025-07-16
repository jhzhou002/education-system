<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './store/auth'

const authStore = useAuthStore()

onMounted(() => {
  // 初始化应用
  console.log('🚀 智学平台启动')
})
</script>

<style>
#app {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}
</style>