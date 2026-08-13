<script setup lang="ts">
import { ref, computed } from 'vue'
import { useData } from '../composables/useData'
import { useAuth } from '../composables/useAuth'
import type { Player, GeneralPosition } from '../types'

import imgImanuel from '/src/assets/Screenshot 2026-07-28 100646.png'
import imgKhenichi from '/src/assets/Screenshot 2026-07-28 100359.png'
import imgHansel from '/src/assets/Screenshot 2026-07-28 100633.png'
import imgMarlon from '/src/assets/Screenshot 2026-07-28 100336.png'
import imgSony from '/src/assets/Screenshot 2026-07-28 100346.png'
import imgKetan from '/src/assets/Screenshot 2026-07-28 100654.png'
import imgValerio from '/src/assets/Screenshot 2026-07-28 100319.png'
import imgKevin from '/src/assets/Screenshot 2026-07-28 100412.png'
import imgAcel from '/src/assets/Screenshot 2026-07-30 151858.png'

const { players, selectedPlayer, getPlayerComputedStats, formatPlayerCategory, seedPlayersToFirebase, isLoading } = useData()
const { isAdmin } = useAuth()

const activeCategory = ref<'All' | GeneralPosition>('All')
const categories: Array<'All' | GeneralPosition> = ['All', 'Goal Keeper', 'Defender', 'Midfielder', 'Forward']

const localPhotos: Record<string, string> = {
  'KEVIN IMANUEL': imgImanuel, 'KHENICHI': imgKhenichi, 'HANSEL': imgHansel,
  'MARLON': imgMarlon, 'SONY': imgSony, 'KEVIN TAN': imgKetan,
  'VALERIO': imgValerio, 'KEVIN': imgKevin, 'ACEL': imgAcel, 'AXEL': imgAcel
}

const getPlayerImage = (player: Player): string => {
  if (player.photo && player.photo.trim() !== '') return player.photo
  const normalizedName = player.name ? player.name.trim().toUpperCase() : ''
  return localPhotos[normalizedName] || ''
}

const filteredPlayers = computed<Player[]>(() => {
  if (activeCategory.value === 'All') return players.value
  return players.value.filter(p => {
    if (Array.isArray(p.category)) return p.category.includes(activeCategory.value as GeneralPosition)
    return p.category === activeCategory.value
  })
})

const openPlayer = (player: Player): void => {
  selectedPlayer.value = JSON.parse(JSON.stringify(player))
}
</script>

<template>
  <div>
    <section class="relative h-[300px] overflow-hidden bg-gradient-to-br from-[#0d0d0d] via-[#1a1a1a] to-[#0d0d0d] border-b border-[#C5A059]/20">
      <div class="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1459865409283-045e9ed37b34?q=80&w=2000')] bg-cover bg-center opacity-15"></div>
      <div class="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] to-transparent"></div>
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="text-center space-y-3">
          <div class="text-xs font-black tracking-[0.3em] text-[#C5A059] uppercase">SEASON 2026/2027</div>
          <h1 class="text-5xl sm:text-7xl font-black tracking-tight uppercase">
            FIRST <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#C5A059] to-[#f3e0aa]">TEAM</span>
          </h1>
          <p class="text-gray-400 max-w-md mx-auto text-sm">The warriors who wear the gold and black.</p>
        </div>
      </div>
    </section>

    <section class="py-16 px-6 max-w-7xl mx-auto space-y-10">
      <div class="flex flex-wrap items-center justify-center gap-2 border-b border-white/10 pb-6">
        <button
          v-for="cat in categories"
          :key="cat"
          @click="activeCategory = cat"
          :class="[
            'px-5 py-2.5 text-xs font-bold tracking-wider rounded-full transition duration-300 uppercase border',
            activeCategory === cat
              ? 'bg-[#C5A059] text-black border-[#C5A059] shadow-[0_0_20px_rgba(197,160,89,0.4)]'
              : 'bg-transparent text-gray-400 border-white/10 hover:border-[#C5A059]/50 hover:text-white'
          ]"
        >
          {{ cat }}
        </button>
      </div>

      <div v-if="players.length === 0" class="text-center py-12">
        <p class="text-gray-400 text-sm">Database pemain kosong.</p>
        <button
          v-if="isAdmin"
          @click="seedPlayersToFirebase"
          :disabled="isLoading"
          class="mt-4 bg-[#C5A059] text-black font-bold px-4 py-2 rounded text-xs hover:brightness-110"
        >🚀 Seed Pemain Sekarang</button>
      </div>

      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div
          v-for="player in filteredPlayers"
          :key="player.id || player.name"
          @click="openPlayer(player)"
          class="group relative aspect-[3/4] rounded-xl overflow-hidden bg-[#141414] cursor-pointer border border-white/5 hover:border-[#C5A059] transition-all duration-500 hover:shadow-[0_0_40px_rgba(197,160,89,0.3)]"
        >
          <span class="absolute top-2 right-2 text-6xl font-black text-white/5 group-hover:text-[#C5A059]/20 transition duration-500 leading-none z-10">
            {{ player.number }}
          </span>

          <img
            :src="getPlayerImage(player)"
            :alt="player.name"
            class="w-full h-full object-cover object-top filter grayscale contrast-110 group-hover:grayscale-0 group-hover:scale-110 transition duration-700 ease-out"
          />

          <div class="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/60 to-transparent"></div>

          <div v-if="player.name.trim().toUpperCase() === 'MARLON'" class="absolute top-3 left-3 z-20">
            <span class="bg-[#C5A059] text-black font-black text-[10px] px-1.5 py-0.5 rounded border border-[#f3e0aa] shadow-md">C</span>
          </div>

          <div class="absolute top-3 right-3 z-20">
            <span class="bg-black/80 backdrop-blur-md text-[#C5A059] border border-[#C5A059]/40 text-[8px] font-black px-2 py-1 rounded uppercase tracking-widest">
              {{ formatPlayerCategory(player.category).split(' ')[0] || '-' }}
            </span>
          </div>

          <div class="absolute bottom-0 left-0 right-0 p-3 z-20">
            <div class="flex items-center gap-1.5 mb-1">
              <span class="text-[9px] font-mono text-[#C5A059] font-bold">#{{ player.number }}</span>
            </div>
            <h3 class="text-base font-black tracking-wider text-white group-hover:text-[#C5A059] transition duration-300 leading-tight">
              {{ player.name }}
            </h3>
            <div class="mt-2 pt-2 border-t border-white/10 flex justify-between items-center text-[9px] font-mono text-gray-400">
              <span><b class="text-white">{{ getPlayerComputedStats(player).matches }}</b> M</span>
              <span><b class="text-[#C5A059]">{{ getPlayerComputedStats(player).goals }}</b> G</span>
              <span><b class="text-white">{{ getPlayerComputedStats(player).assists }}</b> A</span>
              <span class="text-[#C5A059] font-black">★ {{ getPlayerComputedStats(player).rating }}</span>
            </div>
          </div>

          <div class="absolute inset-0 bg-gradient-to-tr from-transparent via-[#C5A059]/0 to-transparent group-hover:via-[#C5A059]/10 transition duration-500"></div>
        </div>
      </div>
    </section>
  </div>
</template>