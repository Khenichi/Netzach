<script setup lang="ts">
import { ref, computed } from 'vue'
import { useData } from '../composables/useData'
import { useAuth } from '../composables/useAuth'
import type { Fixture } from '../types'

// ✅ Import foto lokal background kamu di sini
import imgResultsBg from '/src/assets/BBGSPORT@ARYOOO (640 of 1006).jpg'

const { fixtures, selectedFixtureStats, parseFixtureDate, groupFixturesByMonth, saveEditedFixture, isLoading, players } = useData()
const { isAdmin } = useAuth()

const editingFixture = ref<Fixture | null>(null)

const finishedFixtures = computed<Fixture[]>(() =>
  fixtures.value
    .filter(f => f.status === 'FINISHED')
    .sort((a, b) => parseFixtureDate(b.date) - parseFixtureDate(a.date))
)

const groupedByMonth = computed(() => groupFixturesByMonth(finishedFixtures.value))

const totalMatches = computed<number>(() => finishedFixtures.value.length)
const wins = computed<number>(() =>
  finishedFixtures.value.filter(f => (f.homeScore || 0) > (f.awayScore || 0)).length
)
const draws = computed<number>(() =>
  finishedFixtures.value.filter(f => f.homeScore === f.awayScore).length
)
const losses = computed<number>(() =>
  finishedFixtures.value.filter(f => (f.homeScore || 0) < (f.awayScore || 0)).length
)

const getResultIndicatorColor = (fixture: Fixture): string => {
  const home = fixture.homeScore || 0
  const away = fixture.awayScore || 0
  if (home > away) return 'bg-emerald-500'
  if (home === away) return 'bg-yellow-500'
  return 'bg-red-500'
}

// ✅ Edit fixture di halaman Results
const editFixture = (fixture: Fixture): void => {
  const clone = JSON.parse(JSON.stringify(fixture)) as Fixture
  
  if (!clone.matchStats) clone.matchStats = []
  if (clone.homeScore === undefined) clone.homeScore = null
  if (clone.awayScore === undefined) clone.awayScore = null
  if (!clone.matchType) clone.matchType = 'Futsal'
  
  editingFixture.value = clone
}

const addPlayerStat = (): void => {
  if (!editingFixture.value) return
  if (!editingFixture.value.matchStats) editingFixture.value.matchStats = []
  editingFixture.value.matchStats.push({
    playerId: players.value[0]?.id || '',
    playerName: players.value[0]?.name || '',
    goals: 0,
    assists: 0,
    goalsConceded: 0,
    rating: 7.0,
    minutesPlayed: 90
  })
}

const removePlayerStat = (index: number): void => {
  if (editingFixture.value?.matchStats) {
    editingFixture.value.matchStats.splice(index, 1)
  }
}

const handleSave = async (): Promise<void> => {
  if (!editingFixture.value) return
  const success = await saveEditedFixture(editingFixture.value)
  if (success) editingFixture.value = null
}
</script>

<template>
  <div>
    <!-- ============================================ -->
    <!-- 🆕 HERO RESULTS DENGAN FOTO LOKAL & FADE TONE -->
    <!-- ============================================ -->
    <section class="relative h-[380px] overflow-hidden border-b border-[#C5A059]/20">
      <!-- Background Image Local -->
      <img 
        :src="imgResultsBg" 
        alt="Results Background" 
        class="absolute inset-0 w-full h-full object-cover filter brightness-[0.75] saturate-[0.8] sepia-[0.1]"
      />
      
      <!-- Overlay gradient golden-dark agar menyatu sempurna dengan base color -->
      <div class="absolute inset-0 bg-gradient-to-b from-[#0d0d0d]/80 via-[#C5A059]/10 to-[#0d0d0d]"></div>
      <div class="absolute inset-0 bg-[#0d0d0d]/40 mix-blend-multiply"></div>
      
      <!-- Decorative glow -->
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-[#C5A059]/10 rounded-full blur-[90px]"></div>

      <!-- Content Title -->
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="text-center">
          <div class="text-xs font-black tracking-[0.3em] text-[#C5A059] uppercase mb-2">FULL TIME</div>
          <h1 class="text-5xl sm:text-6xl font-black tracking-tight uppercase">RESULTS</h1>
        </div>
      </div>
    </section>

    <section class="py-12 px-6 max-w-5xl mx-auto space-y-10">
      <!-- STATS SUMMARY -->
      <div class="grid grid-cols-4 gap-3">
        <div class="p-5 rounded-xl bg-[#141414] border border-white/5 text-center">
          <div class="text-3xl font-black text-white">{{ totalMatches }}</div>
          <div class="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Played</div>
        </div>
        <div class="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
          <div class="text-3xl font-black text-emerald-400">{{ wins }}</div>
          <div class="text-[10px] text-emerald-400 uppercase tracking-widest mt-1">Wins</div>
        </div>
        <div class="p-5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-center">
          <div class="text-3xl font-black text-yellow-400">{{ draws }}</div>
          <div class="text-[10px] text-yellow-400 uppercase tracking-widest mt-1">Draws</div>
        </div>
        <div class="p-5 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
          <div class="text-3xl font-black text-red-400">{{ losses }}</div>
          <div class="text-[10px] text-red-400 uppercase tracking-widest mt-1">Losses</div>
        </div>
      </div>

      <!-- GROUPED RESULTS -->
      <div v-if="Object.keys(groupedByMonth).length === 0" class="p-12 rounded-xl bg-[#141414] border border-white/5 text-center">
        <h3 class="text-base font-bold uppercase">NO RESULTS YET</h3>
        <p class="text-xs text-gray-500 mt-2">Belum ada pertandingan yang selesai.</p>
      </div>

      <div v-else class="space-y-10">
        <div v-for="(matches, month) in groupedByMonth" :key="month" class="space-y-4">
          <div class="flex items-center gap-4 pb-2 border-b border-white/10">
            <div>
              <div class="text-2xl font-black tracking-tight">{{ month }}</div>
              <div class="text-[10px] text-gray-400 uppercase tracking-widest">{{ matches.length }} RESULT{{ matches.length > 1 ? 'S' : '' }}</div>
            </div>
          </div>

          <div class="space-y-3">
            <div
              v-for="fixture in matches"
              :key="fixture.id"
              class="p-5 rounded-xl bg-[#141414] border border-white/5 hover:border-[#C5A059]/50 transition flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden"
            >
              <div :class="['absolute left-0 top-0 h-full w-1', getResultIndicatorColor(fixture)]"></div>

              <div class="flex-1 text-center sm:text-left pl-2">
                <div class="flex items-center gap-2 mb-1 justify-center sm:justify-start flex-wrap">
                  <span class="text-[10px] font-black px-2 py-0.5 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/30">FINISHED</span>
                  <span v-if="fixture.matchType" class="text-[9px] font-black px-2 py-0.5 rounded border uppercase bg-blue-500/10 text-blue-400 border-blue-500/30">{{ fixture.matchType }}</span>
                  <span class="text-[10px] text-gray-400 font-mono">{{ fixture.date }}</span>
                </div>
              </div>

              <div class="flex items-center gap-4 text-base font-black tracking-wider">
                <span class="text-white text-right min-w-[100px]">{{ fixture.home }}</span>
                <div
                  v-if="fixture.homeScore !== null && fixture.homeScore !== undefined && fixture.awayScore !== null && fixture.awayScore !== undefined"
                  class="flex items-center gap-3 px-5 py-2 bg-gradient-to-r from-[#C5A059] to-[#9e7d3b] rounded-lg shadow-lg"
                >
                  <span class="text-2xl font-black text-black leading-none">{{ fixture.homeScore }}</span>
                  <span class="text-sm font-bold text-black/40">:</span>
                  <span class="text-2xl font-black text-black leading-none">{{ fixture.awayScore }}</span>
                </div>
                <span v-else class="px-3 py-1 bg-white/10 text-white text-xs font-black rounded">-</span>
                <span class="text-white text-left min-w-[100px]">{{ fixture.away }}</span>
              </div>

              <!-- ✅ TOMBOL STATS + EDIT -->
              <div class="flex items-center gap-2">
                <button @click="selectedFixtureStats = fixture" class="bg-white/10 hover:bg-[#C5A059] hover:text-black px-4 py-1.5 rounded text-xs font-bold transition">
                  Stats
                </button>
                <button
                  v-if="isAdmin"
                  @click="editFixture(fixture)"
                  class="bg-[#C5A059]/20 hover:bg-[#C5A059] hover:text-black text-[#C5A059] px-3 py-1.5 rounded text-xs font-bold transition"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ✅ EDIT MODAL -->
    <div
      v-if="editingFixture"
      class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      @click.self="editingFixture = null"
    >
      <div class="bg-[#141414] border border-[#C5A059]/40 w-full max-w-xl rounded-2xl p-6 relative space-y-4 max-h-[90vh] overflow-y-auto">
        <button @click="editingFixture = null" class="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
        <h3 class="text-lg font-black text-[#C5A059]">EDIT HASIL PERTANDINGAN</h3>

        <!-- Match Type -->
        <div class="p-4 rounded-xl bg-black/50 border border-[#C5A059]/30 space-y-3">
          <div>
            <label class="text-[10px] text-gray-400 font-bold block mb-1">TIPE PERTANDINGAN</label>
            <select v-model="editingFixture.matchType" class="w-full bg-[#141414] border border-white/20 p-2.5 rounded text-xs text-white focus:border-[#C5A059] outline-none">
              <option value="Futsal">Futsal</option>
              <option value="Mini Soccer">Mini Soccer</option>
              <option value="Football">Football</option>
            </select>
          </div>
        </div>

        <!-- FINAL SCORE -->
        <div class="p-4 rounded-xl bg-black/50 border border-[#C5A059]/30 space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-black text-[#C5A059] uppercase tracking-wider">⚽ SKOR AKHIR</h4>
            <span class="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-black">FINISHED</span>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-[10px] text-gray-400 font-bold block mb-1">{{ editingFixture.home }}</label>
              <input
                v-model.number="editingFixture.homeScore"
                type="number"
                min="0"
                max="99"
                placeholder="0"
                class="w-full bg-[#141414] border border-white/20 p-2.5 rounded text-sm text-white focus:border-[#C5A059] outline-none text-center font-black"
              />
            </div>
            <div>
              <label class="text-[10px] text-gray-400 font-bold block mb-1">{{ editingFixture.away }}</label>
              <input
                v-model.number="editingFixture.awayScore"
                type="number"
                min="0"
                max="99"
                placeholder="0"
                class="w-full bg-[#141414] border border-white/20 p-2.5 rounded text-sm text-white focus:border-[#C5A059] outline-none text-center font-black"
              />
            </div>
          </div>
        </div>

        <!-- MATCH STATS -->
        <div class="space-y-3">
          <div class="flex items-center justify-between border-b border-white/10 pb-2">
            <h4 class="text-xs font-black text-white uppercase tracking-wider">📊 STATISTIK PEMAIN</h4>
            <button
              @click="addPlayerStat"
              class="px-3 py-1 bg-[#C5A059]/20 hover:bg-[#C5A059] text-[#C5A059] hover:text-black text-xs font-bold rounded transition"
            >
              + Tambah Pemain
            </button>
          </div>

          <div
            v-for="(stat, idx) in editingFixture.matchStats"
            :key="idx"
            class="p-3 bg-black rounded border border-white/10 space-y-2"
          >
            <div class="flex justify-between items-center">
              <select
                v-model="stat.playerId"
                @change="stat.playerName = players.find(p => p.id === stat.playerId)?.name || ''"
                class="bg-[#141414] text-xs text-white p-1 rounded border border-white/20 flex-1 mr-2"
              >
                <option v-for="p in players" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
              <button @click="removePlayerStat(idx)" class="text-red-400 hover:text-red-300 text-xs font-bold px-2">HAPUS</button>
            </div>

            <div class="grid grid-cols-5 gap-2 text-center text-xs">
              <div>
                <label class="text-[9px] text-gray-400 block">GOALS</label>
                <input v-model.number="stat.goals" type="number" min="0" class="w-full bg-[#141414] text-center p-1 rounded border border-white/20" />
              </div>
              <div>
                <label class="text-[9px] text-gray-400 block">ASSISTS</label>
                <input v-model.number="stat.assists" type="number" min="0" class="w-full bg-[#141414] text-center p-1 rounded border border-white/20" />
              </div>
              <div>
                <label class="text-[9px] text-gray-400 block">GC</label>
                <input v-model.number="stat.goalsConceded" type="number" min="0" class="w-full bg-[#141414] text-center p-1 rounded border border-white/20" />
              </div>
              <div>
                <label class="text-[9px] text-gray-400 block">MIN</label>
                <input v-model.number="stat.minutesPlayed" type="number" min="0" max="120" class="w-full bg-[#141414] text-center p-1 rounded border border-white/20" />
              </div>
              <div>
                <label class="text-[9px] text-gray-400 block">RATING</label>
                <input v-model.number="stat.rating" type="number" step="0.1" min="0" max="10" class="w-full bg-[#141414] text-center p-1 rounded border border-white/20" />
              </div>
            </div>
          </div>

          <div
            v-if="!editingFixture.matchStats || editingFixture.matchStats.length === 0"
            class="py-6 text-center text-xs text-gray-500 bg-black/30 rounded border border-dashed border-white/10"
          >
            Belum ada statistik pemain. Klik <b>"+ Tambah Pemain"</b> untuk menambahkan.
          </div>
        </div>

        <button
          @click="handleSave"
          :disabled="isLoading"
          class="w-full bg-[#C5A059] hover:brightness-110 text-black font-black py-2.5 rounded text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
        >
          <span v-if="isLoading" class="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
          <span>{{ isLoading ? 'Menyimpan...' : 'SIMPAN PERUBAHAN' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>