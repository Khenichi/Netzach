<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import bgMusicFile from '/src/assets/music.mp3'
import imgNetzach from '/src/assets/Screenshot 2026-07-28 103255.png'

// ✅ Semua modal di-import di sini
import PlayerModal from './components/PlayerModal.vue'
import LoginModal from './components/LoginModal.vue'
import FixtureStatsModal from './components/FixtureStatsModal.vue'

import { useData } from './composables/useData'
import { useAuth } from './composables/useAuth'
import type { NavLink } from './types'

const { initListeners } = useData()
const { isAdmin, showLoginModal, handleLogout } = useAuth()

const audioRef = ref<HTMLAudioElement | null>(null)
const isPlaying = ref<boolean>(false)

// 📱 State untuk Hamburger Menu (Mobile)
const isMobileMenuOpen = ref<boolean>(false)

const toggleAudio = (): void => {
  if (!audioRef.value) return
  if (isPlaying.value) {
    audioRef.value.pause()
    isPlaying.value = false
  } else {
    playMusic()
  }
}

const playMusic = (): void => {
  if (!audioRef.value) return
  audioRef.value.play()
    .then(() => { isPlaying.value = true })
    .catch(() => { isPlaying.value = false })
}

onMounted(() => {
  initListeners()
  playMusic()

  const handleFirstInteraction = (): void => {
    if (!isPlaying.value) playMusic()
    window.removeEventListener('click', handleFirstInteraction)
    window.removeEventListener('keydown', handleFirstInteraction)
    window.removeEventListener('touchstart', handleFirstInteraction)
  }
  window.addEventListener('click', handleFirstInteraction)
  window.addEventListener('keydown', handleFirstInteraction)
  window.addEventListener('touchstart', handleFirstInteraction)
})

const navLinks: NavLink[] = [
  { name: 'Home', path: '/' },
  { name: 'Squad', path: '/squad' },
  { name: 'Schedule', path: '/schedule' },
  { name: 'Results', path: '/results' }
]
</script>

<template>
  <div class="min-h-screen bg-[#0d0d0d] text-white font-sans selection:bg-[#C5A059] selection:text-black">
    <audio ref="audioRef" :src="bgMusicFile" loop></audio>

    <!-- HEADER -->
    <header class="border-b border-[#C5A059]/20 bg-[#0d0d0d]/95 backdrop-blur-md sticky top-0 z-40">
      <!-- TOP BAR -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex justify-between items-center text-[10px] sm:text-[11px] border-b border-white/5 text-[#C5A059]/80 font-medium tracking-wider">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span class="truncate">OFFICIAL CLUB WEBSITE</span>
        </div>
        <div class="flex items-center gap-3 sm:gap-4">
          <a href="https://www.instagram.com/netzach.fc" target="_blank" class="hover:text-white transition hidden sm:inline">INSTAGRAM</a>
          <button @click="toggleAudio" class="hover:text-white transition flex items-center gap-1">
            <span>MUSIC {{ isPlaying ? 'ON' : 'OFF' }}</span>
            <span>{{ isPlaying ? '🔊' : '🔇' }}</span>
          </button>
          <button v-if="!isAdmin" @click="showLoginModal = true" class="hover:text-white transition">LOGIN</button>
          <button v-else @click="handleLogout" class="text-red-400 hover:text-red-300 transition">LOGOUT</button>
        </div>
      </div>

      <!-- MAIN NAVBAR -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <!-- LOGO -->
        <RouterLink to="/" class="flex items-center gap-3 group">
          <img :src="imgNetzach" alt="Netzach FC Logo" class="w-9 h-11 sm:w-10 sm:h-12 object-contain group-hover:scale-105 transition duration-300 drop-shadow-[0_0_8px_rgba(197,160,89,0.4)]" />
          <div class="flex flex-col">
            <span class="text-lg sm:text-xl font-black tracking-widest text-white leading-none">NETZACH</span>
            <span class="text-[9px] sm:text-[10px] font-bold tracking-[0.3em] text-[#C5A059]">FOOTBALL CLUB</span>
          </div>
        </RouterLink>

        <!-- DESKTOP NAV -->
        <nav class="hidden lg:flex items-center gap-8 text-xs font-bold tracking-[0.15em]">
          <RouterLink
            v-for="link in navLinks"
            :key="link.path"
            :to="link.path"
            active-class="nav-link-active"
            class="nav-link"
          >
            {{ link.name.toUpperCase() }}
          </RouterLink>
        </nav>

        <!-- 🍔 HAMBURGER BUTTON (MOBILE ONLY) -->
        <button 
          @click="isMobileMenuOpen = !isMobileMenuOpen"
          class="lg:hidden p-2 text-[#C5A059] hover:text-white focus:outline-none transition"
          aria-label="Toggle Navigation Menu"
        >
          <svg v-if="!isMobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- 📱 MOBILE MENU DRAWER -->
      <transition name="slide-fade">
        <div 
          v-if="isMobileMenuOpen" 
          class="lg:hidden bg-[#0d0d0d]/98 border-b border-[#C5A059]/30 backdrop-blur-xl px-6 py-6 space-y-4 shadow-2xl"
        >
          <nav class="flex flex-col space-y-3">
            <RouterLink
              v-for="link in navLinks"
              :key="link.path"
              :to="link.path"
              @click="isMobileMenuOpen = false"
              active-class="bg-[#C5A059] text-black font-black shadow-[0_0_15px_rgba(197,160,89,0.3)]"
              class="px-4 py-3 rounded-lg text-sm font-bold tracking-widest uppercase transition-all duration-300 text-gray-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-[#C5A059]/30"
            >
              {{ link.name }}
            </RouterLink>
          </nav>

          <div class="pt-4 border-t border-white/10 flex justify-between items-center text-xs">
            <a href="https://www.instagram.com/netzach.fc" target="_blank" class="text-[#C5A059] font-bold tracking-wider hover:underline">
              @netzach.fc
            </a>
            <span class="text-gray-500 text-[10px]">SEASON 2026/2027</span>
          </div>
        </div>
      </transition>
    </header>

    <main>
      <RouterView />
    </main>

    <footer class="border-t border-white/10 bg-black py-12 px-6">
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-gray-500">
        <div class="flex items-center gap-3">
          <span class="font-black text-white">NETZACH FC</span>
          <span>© 2026 All Rights Reserved</span>
        </div>
        <div class="flex items-center gap-6">
          <RouterLink to="/" class="hover:text-[#C5A059] transition">Home</RouterLink>
          <RouterLink to="/squad" class="hover:text-[#C5A059] transition">Squad</RouterLink>
          <RouterLink to="/schedule" class="hover:text-[#C5A059] transition">Schedule</RouterLink>
          <RouterLink to="/results" class="hover:text-[#C5A059] transition">Results</RouterLink>
        </div>
      </div>
    </footer>

    <!-- ✅ SEMUA MODAL DI-RENDER DI SINI -->
    <PlayerModal />
    <LoginModal />
    <FixtureStatsModal />
  </div>
</template>

<style scoped>
.nav-link {
  color: #d1d5db;
  padding-bottom: 0.25rem;
  position: relative;
  transition: color 0.3s ease;
  text-decoration: none;
}

.nav-link:hover {
  color: #C5A059;
}

.nav-link::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -4px;
  width: 0;
  height: 2px;
  background: #C5A059;
  transition: width 0.3s ease;
}

.nav-link:hover::after {
  width: 100%;
}

:deep(.nav-link-active) {
  color: #C5A059 !important;
}

:deep(.nav-link-active)::after {
  width: 100%;
}

/* 🌀 Animasi Slide Smooth untuk Mobile Menu */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease-in-out;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>