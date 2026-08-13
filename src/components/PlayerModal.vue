<script setup lang="ts">
import { useData } from '../composables/useData'
import type { Player } from '../types'
import imgImanuel from '/src/assets/Screenshot 2026-07-28 100646.png'
import imgKhenichi from '/src/assets/Screenshot 2026-07-28 100359.png'
import imgHansel from '/src/assets/Screenshot 2026-07-28 100633.png'
import imgMarlon from '/src/assets/Screenshot 2026-07-28 100336.png'
import imgSony from '/src/assets/Screenshot 2026-07-28 100346.png'
import imgKetan from '/src/assets/Screenshot 2026-07-28 100654.png'
import imgValerio from '/src/assets/Screenshot 2026-07-28 100319.png'
import imgKevin from '/src/assets/Screenshot 2026-07-28 100412.png'
import imgAcel from '/src/assets/Screenshot 2026-07-30 151858.png'

const {
  selectedPlayer,
  getPlayerComputedStats,
  formatPlayerCategory,
  getOpponentFromHistory,
  getFixtureDateFromHistory,
  getFixtureScoreFromHistory,
  getMatchTypeFromHistory
} = useData()

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

const isGoalKeeper = (player: Player): boolean => {
  if (Array.isArray(player.category)) return player.category.includes('Goal Keeper')
  return player.category === 'Goal Keeper'
}
</script>

<template>
  <div
    v-if="selectedPlayer"
    class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
    @click.self="selectedPlayer = null"
  >
    <div class="bg-[#141414] border border-[#C5A059]/40 w-full max-w-2xl rounded-2xl p-6 relative space-y-6 max-h-[90vh] overflow-y-auto">
      <button @click="selectedPlayer = null" class="absolute top-4 right-4 text-gray-400 hover:text-white text-xl z-10">✕</button>

      <div class="flex items-center gap-4 pb-4 border-b border-white/10">
        <img :src="getPlayerImage(selectedPlayer)" class="w-24 h-28 object-cover rounded-lg border border-[#C5A059]/40" />
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[10px] bg-[#C5A059]/20 text-[#C5A059] px-2 py-0.5 rounded font-black">#{{ selectedPlayer.number }}</span>
            <span class="text-[10px] bg-black/70 border border-[#C5A059]/40 text-[#C5A059] px-2 py-0.5 rounded font-black uppercase tracking-wider">
              {{ formatPlayerCategory(selectedPlayer.category) }}
            </span>
            <span
              v-if="selectedPlayer.name.trim().toUpperCase() === 'MARLON'"
              class="bg-[#C5A059] text-black font-black text-[10px] h-[20px] px-1.5 flex items-center justify-center rounded"
            >C</span>
          </div>
          <h2 class="text-2xl font-black text-white mt-2">{{ selectedPlayer.name }}</h2>
          <p class="text-[11px] text-gray-400 mt-1 font-mono">Season 2026/2027 • NetZach FC</p>
        </div>
      </div>

      <div class="grid grid-cols-4 gap-3 bg-black/50 p-4 rounded-xl text-center border border-white/5">
        <div>
          <div class="text-[9px] text-gray-400 uppercase tracking-wider">Matches</div>
          <div class="text-lg font-black text-white">{{ getPlayerComputedStats(selectedPlayer).matches }}</div>
        </div>
        <div>
          <div class="text-[9px] text-gray-400 uppercase tracking-wider">Goals</div>
          <div class="text-lg font-black text-[#C5A059]">{{ getPlayerComputedStats(selectedPlayer).goals }}</div>
        </div>
        <div>
          <div class="text-[9px] text-gray-400 uppercase tracking-wider">Assists</div>
          <div class="text-lg font-black text-white">{{ getPlayerComputedStats(selectedPlayer).assists }}</div>
        </div>
        <div>
          <div class="text-[9px] text-gray-400 uppercase tracking-wider">Avg Rating</div>
          <div class="text-lg font-black text-[#C5A059]">★ {{ getPlayerComputedStats(selectedPlayer).rating }}</div>
        </div>
      </div>

      <div
        v-if="isGoalKeeper(selectedPlayer)"
        class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-between"
      >
        <span class="text-xs font-bold text-red-400 uppercase tracking-wider">🧤 Goals Conceded</span>
        <span class="text-lg font-black text-red-400">{{ getPlayerComputedStats(selectedPlayer).goalsConceded }}</span>
      </div>

      <div>
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-xs font-black text-[#C5A059] uppercase tracking-[0.2em]">📊 Match History</h3>
          <span class="text-[10px] bg-[#C5A059]/20 text-[#C5A059] px-2 py-0.5 rounded font-mono font-bold">
            {{ selectedPlayer.matchHistory?.length || 0 }} PERTANDINGAN
          </span>
        </div>

        <div
          v-if="!selectedPlayer.matchHistory || selectedPlayer.matchHistory.length === 0"
          class="py-8 text-center bg-black/30 rounded-xl border border-dashed border-white/10"
        >
          <p class="text-xs text-gray-500">Belum ada pertandingan yang tercatat.</p>
        </div>

        <div v-else class="space-y-2 max-h-72 overflow-y-auto pr-1">
          <div
            v-for="(match, index) in selectedPlayer.matchHistory"
            :key="index"
            class="p-3 rounded-lg bg-black/40 border border-white/5 hover:border-[#C5A059]/50 transition"
          >
            <div class="flex items-center justify-between mb-2 pb-2 border-b border-white/5">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-white text-sm font-black">NetZach FC</span>
                <span class="text-[#C5A059] text-xs font-bold">VS</span>
                <span class="text-white text-sm font-black">{{ getOpponentFromHistory(match.playerId) }}</span>
                <span
                  v-if="getFixtureScoreFromHistory(match.playerId)"
                  class="ml-2 text-[10px] bg-gradient-to-r from-[#C5A059] to-[#9e7d3b] text-black px-2 py-0.5 rounded font-black"
                >
                  {{ getFixtureScoreFromHistory(match.playerId) }}
                </span>
                <span
                  v-if="getMatchTypeFromHistory(match.playerId)"
                  class="text-[8px] font-black px-1.5 py-0.5 rounded border uppercase bg-blue-500/20 text-blue-400 border-blue-500/30"
                >
                  {{ getMatchTypeFromHistory(match.playerId) }}
                </span>
              </div>
              <span class="text-[10px] text-gray-400 font-mono">{{ getFixtureDateFromHistory(match.playerId) }}</span>
            </div>

            <div class="grid grid-cols-5 gap-2 text-center">
              <div>
                <div class="text-[8px] text-gray-500 uppercase">Goals</div>
                <div class="text-sm font-black text-[#C5A059]">{{ match.goals }}</div>
              </div>
              <div>
                <div class="text-[8px] text-gray-500 uppercase">Assists</div>
                <div class="text-sm font-black text-white">{{ match.assists }}</div>
              </div>
              <div v-if="isGoalKeeper(selectedPlayer)">
                <div class="text-[8px] text-gray-500 uppercase">Conceded</div>
                <div class="text-sm font-black text-red-400">{{ match.goalsConceded || 0 }}</div>
              </div>
              <div>
                <div class="text-[8px] text-gray-500 uppercase">Minutes</div>
                <div class="text-sm font-black text-white">{{ match.minutesPlayed || 90 }}'</div>
              </div>
              <div class="col-span-2">
                <div class="text-[8px] text-gray-500 uppercase">Rating</div>
                <div
                  :class="[
                    'text-sm font-black',
                    match.rating >= 8 ? 'text-emerald-400' :
                    match.rating >= 7 ? 'text-[#C5A059]' :
                    match.rating >= 6 ? 'text-yellow-400' : 'text-red-400'
                  ]"
                >
                  ★ {{ match.rating.toFixed(1) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>