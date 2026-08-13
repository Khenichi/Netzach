<script setup lang="ts">
import { useData } from '../composables/useData'
import type { MatchPlayerStat } from '../types'

const { selectedFixtureStats, players, selectedPlayer } = useData()

const openPlayerFromFixture = (playerId: string): void => {
  const found = players.value.find(p => p.id === playerId || p.name === playerId)
  if (found) {
    selectedFixtureStats.value = null
    selectedPlayer.value = JSON.parse(JSON.stringify(found))
  }
}
</script>

<template>
  <div
    v-if="selectedFixtureStats"
    class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
    @click.self="selectedFixtureStats = null"
  >
    <div class="bg-[#141414] border border-[#C5A059]/40 w-full max-w-md rounded-2xl p-6 relative space-y-4">
      <button @click="selectedFixtureStats = null" class="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">✕</button>
      <h3 class="text-lg font-black text-[#C5A059] uppercase tracking-wider">STATISTIK PERTANDINGAN</h3>

      <!-- Header: Teams + Type + Score -->
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <p class="text-xs text-gray-300 font-bold">
            {{ selectedFixtureStats.home }} VS {{ selectedFixtureStats.away }}
          </p>
          <span
            v-if="selectedFixtureStats.matchType"
            :class="[
              'text-[8px] font-black px-1.5 py-0.5 rounded border uppercase',
              selectedFixtureStats.matchType === 'Futsal'
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                : selectedFixtureStats.matchType === 'Mini Soccer'
                ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
            ]"
          >
            {{ selectedFixtureStats.matchType }}
          </span>
        </div>
        <span
          v-if="
            selectedFixtureStats.status === 'FINISHED' &&
            selectedFixtureStats.homeScore !== null &&
            selectedFixtureStats.homeScore !== undefined &&
            selectedFixtureStats.awayScore !== null &&
            selectedFixtureStats.awayScore !== undefined
          "
          class="text-sm bg-gradient-to-r from-[#C5A059] to-[#9e7d3b] text-black px-3 py-1 rounded font-black"
        >
          {{ selectedFixtureStats.homeScore }} - {{ selectedFixtureStats.awayScore }}
        </span>
      </div>

      <!-- Date & Time -->
      <div class="text-[10px] text-gray-500 font-mono">
        {{ selectedFixtureStats.date }} • {{ selectedFixtureStats.time }}
      </div>

      <!-- No Stats -->
      <div
        v-if="!selectedFixtureStats.matchStats || selectedFixtureStats.matchStats.length === 0"
        class="text-xs text-gray-500 py-6 text-center bg-black/30 rounded-xl border border-dashed border-white/10"
      >
        Belum ada statistik tercatat untuk pertandingan ini.
      </div>

      <!-- Stats List -->
      <div v-else class="space-y-2 max-h-80 overflow-y-auto pr-1">
        <div
          v-for="(stat, idx) in selectedFixtureStats.matchStats"
          :key="stat.playerId || idx"
          @click="openPlayerFromFixture(stat.playerId)"
          class="p-3 rounded-lg bg-black/50 border border-white/5 flex items-center justify-between text-xs cursor-pointer hover:border-[#C5A059] transition"
        >
          <div class="flex-1">
            <span class="font-black text-white">{{ stat.playerName }}</span>
            <div class="text-[9px] text-gray-500 mt-0.5">
              {{ stat.minutesPlayed || 90 }}' played
            </div>
          </div>
          <div class="flex items-center gap-3 text-[11px] font-mono">
            <span class="text-[#C5A059] font-black">{{ stat.goals }} G</span>
            <span class="text-gray-300">{{ stat.assists }} A</span>
            <span class="bg-[#C5A059]/20 text-[#C5A059] px-1.5 py-0.5 rounded font-bold">
              ★ {{ stat.rating.toFixed(1) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Tip -->
      <div class="text-[9px] text-gray-500 text-center pt-2 border-t border-white/5">
        💡 Klik nama pemain untuk lihat statistik lengkap
      </div>
    </div>
  </div>
</template>