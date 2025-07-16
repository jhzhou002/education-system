<template>
  <div class="profile-container">
    <div class="profile-header">
      <h1>个人资料</h1>
    </div>

    <div class="profile-content">
      <el-form :model="userForm" label-width="100px" size="large">
        <el-form-item label="用户名">
          <el-input v-model="userForm.username" disabled />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="userForm.email" disabled />
        </el-form-item>
        <el-form-item label="真实姓名">
          <el-input v-model="userForm.real_name" />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="userForm.nickname" />
        </el-form-item>
        <el-form-item label="年级">
          <el-select v-model="userForm.grade">
            <el-option label="高一" value="高一" />
            <el-option label="高二" value="高二" />
            <el-option label="高三" value="高三" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="updateProfile">保存</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '../store/auth'
import { userAPI } from '../utils/api'

const authStore = useAuthStore()
const userForm = reactive({
  username: '',
  email: '',
  real_name: '',
  nickname: '',
  grade: '高一'
})

const updateProfile = async () => {
  try {
    await userAPI.updateUser(authStore.user.id, userForm)
    authStore.updateUser(userForm)
    ElMessage.success('个人资料更新成功')
  } catch (error) {
    ElMessage.error('更新失败')
  }
}

onMounted(() => {
  if (authStore.user) {
    Object.assign(userForm, authStore.user)
  }
})
</script>

<style scoped>
.profile-container {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.profile-content {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>