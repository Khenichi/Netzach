<script setup lang="ts">
import { useAuth } from '../composables/useAuth'

const {
  showLoginModal,
  email,
  password,
  loginError,
  isLoadingAuth,
  handleLogin
} = useAuth()
</script>

<template>
  <div
    v-if="showLoginModal"
    class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
    @click.self="showLoginModal = false"
  >
    <div class="bg-[#141414] border border-[#C5A059]/40 w-full max-w-sm rounded-2xl p-6 relative space-y-4">
      <button @click="showLoginModal = false" class="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
      <h3 class="text-lg font-black text-[#C5A059] text-center">ADMIN LOGIN</h3>
      <form @submit.prevent="handleLogin" class="space-y-3">
        <input
          v-model="email"
          type="email"
          placeholder="Email"
          required
          class="w-full bg-black border border-white/20 p-2.5 rounded text-xs text-white outline-none focus:border-[#C5A059]"
        />
        <input
          v-model="password"
          type="password"
          placeholder="Password"
          required
          class="w-full bg-black border border-white/20 p-2.5 rounded text-xs text-white outline-none focus:border-[#C5A059]"
        />
        <p v-if="loginError" class="text-red-400 text-[10px] text-center">{{ loginError }}</p>
        <button
          type="submit"
          :disabled="isLoadingAuth"
          class="w-full bg-[#C5A059] text-black font-black py-2.5 rounded text-xs"
        >
          {{ isLoadingAuth ? 'Loading...' : 'LOGIN' }}
        </button>
      </form>
    </div>
  </div>
</template>