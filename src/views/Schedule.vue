<script setup lang="ts">
import { ref, computed } from 'vue'
import { useData } from '../composables/useData'
import { useAuth } from '../composables/useAuth'
import type { Fixture, MatchStatus } from '../types'

const {
  fixtures,
  isLoading,
  addFixture,
  updateFixtureStatus,
  saveEditedFixture,
  deleteFixture,
  parseFixtureDate,
  groupFixturesByMonth,
} = useData()
const { isAdmin } = useAuth()

const editingFixture = ref<Fixture | null>(null)

const newFixture = ref<Fixture>({
  home: 'NetZach FC',
  away: '',
  date: '',
  time: '19:00 WIB',
  status: 'UPCOMING',
  matchStats: [],
  homeScore: null,
  awayScore: null,
  matchType: 'Futsal'
})

const resetNewFixture = (): void => {
  newFixture.value = {
    home: 'NetZach FC', away: '', date: '', time: '19:00 WIB',
    status: 'UPCOMING', matchStats: [], homeScore: null, awayScore: null, matchType: 'Futsal'
  }
}

const upcomingFixtures = computed<Fixture[]>(() =>
  fixtures.value
    .filter(f => f.status === 'UPCOMING' || f.status === 'NEXT MATCH')
    .sort((a, b) => parseFixtureDate(a.date) - parseFixtureDate(b.date))
)

const groupedByMonth = computed(() => groupFixturesByMonth(upcomingFixtures.value))
const nextMatch = computed<Fixture | undefined>(() => upcomingFixtures.value[0])

const handleAddFixture = async (): Promise<void> => {
  const success = await addFixture(newFixture.value)
  if (success) resetNewFixture()
}

const editFixture = (fixture: Fixture): void => {
  editingFixture.value = JSON.parse(JSON.stringify(fixture))
  if (!editingFixture.value?.matchType) editingFixture.value.matchType = 'Futsal'
}

const handleSave = async (): Promise<void> => {
  if (!editingFixture.value) return
  const success = await saveEditedFixture(editingFixture.value)
  if (success) editingFixture.value = null
}
</script>

<template>
  <div>
    <section class="relative h-[250px] bg-gradient-to-br from-[#0d0d0d] via-[#1a1a1a] to-[#0d0d0d] border-b border-[#C5A059]/20 overflow-hidden">
      <div class="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1508063656890-7a67d71ec403?q=80&w=2000')] bg-cover bg-center opacity-10"></div>
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="text-center">
          <div class="text-xs font-black tracking-[0.3em] text-[#C5A059] uppercase mb-2">MATCH CENTER</div>
          <h1 class="text-5xl sm:text-6xl font-black tracking-tight uppercase">SCHEDULE</h1>
        </div>
      </div>
    </section>

    <section class="py-12 px-6 max-w-5xl mx-auto space-y-8">
      <!-- NEXT MATCH -->
      <div v-if="nextMatch" class="p-8 rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#141414] border-2 border-[#C5A059]/50 shadow-[0_0_40px_rgba(197,160,89,0.15)]">
        <div class="text-[10px] font-black tracking-[0.3em] text-[#C5A059] uppercase mb-4">⚡ NEXT MATCH</div>
        <div class="flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="text-center md:text-left">
            <div class="text-2xl sm:text-3xl font-black text-white mb-2">{{ nextMatch.home }}</div>
            <div class="text-xs text-gray-400 font-mono">{{ nextMatch.date }} • {{ nextMatch.time }}</div>
          </div>
          <div class="px-6 py-3 bg-[#C5A059] text-black text-xs font-black rounded uppercase">VS</div>
          <div class="text-center md:text-right">
            <div class="text-2xl sm:text-3xl font-black text-white mb-2">{{ nextMatch.away }}</div>
            <span class="text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider bg-blue-500/10 text-blue-400 border-blue-500/30">{{ nextMatch.matchType || 'Futsal' }}</span>
          </div>
        </div>
      </div>

      <!-- ADMIN FORM -->
      <div v-if="isAdmin" class="p-5 rounded-xl bg-[#141414] border border-[#C5A059]/40 space-y-4 relative overflow-hidden">
        <div class="absolute top-0 left-0 w-1 h-full bg-[#C5A059]"></div>
        <h3 class="text-xs font-black text-[#C5A059] uppercase tracking-wider">+ TAMBAH JADWAL BARU</h3>
        <form @submit.prevent="handleAddFixture" class="space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select v-model="newFixture.matchType" class="bg-black border border-white/20 p-2.5 rounded text-xs focus:border-[#C5A059] outline-none">
              <option value="Futsal">Futsal</option>
              <option value="Mini Soccer">Mini Soccer</option>
              <option value="Football">Football</option>
            </select>
            <input v-model="newFixture.away" type="text" placeholder="Tim Lawan" required class="bg-black border border-white/20 p-2.5 rounded text-xs focus:border-[#C5A059] outline-none" />
            <input v-model="newFixture.date" type="text" placeholder="AUG 15, 2026" required class="bg-black border border-white/20 p-2.5 rounded text-xs focus:border-[#C5A059] outline-none" />
            <input v-model="newFixture.time" type="text" placeholder="19:00 WIB" required class="bg-black border border-white/20 p-2.5 rounded text-xs focus:border-[#C5A059] outline-none" />
          </div>
          <button type="submit" :disabled="isLoading" class="w-full bg-[#C5A059] hover:brightness-110 text-black font-black py-2.5 rounded text-xs uppercase tracking-wider">
            {{ isLoading ? 'Menyimpan...' : '+ POST JADWAL' }}
          </button>
        </form>
      </div>

      <!-- GROUPED FIXTURES -->
      <div v-if="Object.keys(groupedByMonth).length === 0" class="p-12 rounded-xl bg-[#141414] border border-white/5 text-center">
        <h3 class="text-base font-bold uppercase">NO UPCOMING MATCHES</h3>
        <p class="text-xs text-gray-500 mt-2">Belum ada jadwal pertandingan.</p>
      </div>

      <div v-else class="space-y-10">
        <div v-for="(matches, month) in groupedByMonth" :key="month" class="space-y-4">
          <div class="flex items-center gap-4 pb-2 border-b border-white/10">
            <div class="w-12 h-12 rounded-lg bg-[#C5A059]/10 border border-[#C5A059]/40 flex items-center justify-center">
              <span class="text-[#C5A059] text-xl">📅</span>
            </div>
            <div>
              <div class="text-2xl font-black tracking-tight text-white">{{ month }}</div>
              <div class="text-[10px] text-gray-400 uppercase tracking-widest">{{ matches.length }} MATCH{{ matches.length > 1 ? 'ES' : '' }}</div>
            </div>
          </div>

          <div class="space-y-3">
            <div
              v-for="fixture in matches"
              :key="fixture.id"
              class="p-5 rounded-xl bg-[#141414] border border-white/5 hover:border-[#C5A059]/50 transition duration-300 flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <div class="flex-1 text-center sm:text-left">
                <div class="flex items-center gap-2 mb-1 justify-center sm:justify-start flex-wrap">
                  <template v-if="isAdmin">
                    <select
                      :value="fixture.status"
                      @change="updateFixtureStatus(fixture, ($event.target as HTMLSelectElement).value as MatchStatus)"
                      class="text-[10px] font-black px-2 py-1 rounded bg-black text-[#C5A059] border border-[#C5A059]/50 cursor-pointer outline-none"
                    >
                      <option value="NEXT MATCH">NEXT MATCH</option>
                      <option value="UPCOMING">UPCOMING</option>
                    </select>
                  </template>
                  <span v-else class="text-[10px] font-black px-2 py-0.5 rounded border bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/30">{{ fixture.status }}</span>
                  <span v-if="fixture.matchType" class="text-[9px] font-black px-2 py-0.5 rounded border uppercase bg-blue-500/10 text-blue-400 border-blue-500/30">{{ fixture.matchType }}</span>
                </div>
                <div class="text-xs font-bold text-gray-400">{{ fixture.date }} • {{ fixture.time }}</div>
              </div>

              <div class="flex items-center gap-4 text-base font-black tracking-wider">
                <span class="text-white text-right min-w-[100px]">{{ fixture.home }}</span>
                <span class="px-3 py-1 bg-[#C5A059] text-black text-xs font-black rounded">VS</span>
                <span class="text-white text-left min-w-[100px]">{{ fixture.away }}</span>
              </div>

              <!-- ❌ HAPUS TOMBOL STATS (karena belum main) -->
              <div class="flex items-center gap-2">
                <template v-if="isAdmin">
                  <button @click="editFixture(fixture)" class="bg-[#C5A059]/20 hover:bg-[#C5A059] hover:text-black text-[#C5A059] px-3 py-1.5 rounded text-xs font-bold transition">Edit</button>
                  <button @click="deleteFixture(fixture.id!)" class="bg-red-500/20 hover:bg-red-600 hover:text-white text-red-400 px-3 py-1.5 rounded text-xs font-bold transition">Hapus</button>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- EDIT MODAL (SIMPLE - tanpa matchStats) -->
    <div
      v-if="editingFixture"
      class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      @click.self="editingFixture = null"
    >
      <div class="bg-[#141414] border border-[#C5A059]/40 w-full max-w-xl rounded-2xl p-6 space-y-4">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-black text-[#C5A059]">EDIT JADWAL</h3>
          <button @click="editingFixture = null" class="text-gray-400 hover:text-white">✕</button>
        </div>

        <p class="text-xs text-gray-500">
          💡 Untuk menambahkan statistik pemain & skor, pindahkan status ke <b class="text-[#C5A059]">FINISHED</b> dan edit di halaman <b class="text-[#C5A059]">Results</b>.
        </p>

        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <input v-model="editingFixture.home" placeholder="Home" class="bg-black border border-white/20 p-2 rounded text-xs" />
            <input v-model="editingFixture.away" placeholder="Away" class="bg-black border border-white/20 p-2 rounded text-xs" />
            <input v-model="editingFixture.date" placeholder="Date" class="bg-black border border-white/20 p-2 rounded text-xs" />
            <input v-model="editingFixture.time" placeholder="Time" class="bg-black border border-white/20 p-2 rounded text-xs" />
            <select v-model="editingFixture.status" class="bg-black border border-white/20 p-2 rounded text-xs">
              <option value="UPCOMING">UPCOMING</option>
              <option value="NEXT MATCH">NEXT MATCH</option>
              <option value="FINISHED">FINISHED</option>
            </select>
            <select v-model="editingFixture.matchType" class="bg-black border border-white/20 p-2 rounded text-xs">
              <option value="Futsal">Futsal</option>
              <option value="Mini Soccer">Mini Soccer</option>
              <option value="Football">Football</option>
            </select>
          </div>
        </div>

        <button @click="handleSave" :disabled="isLoading" class="w-full bg-[#C5A059] text-black font-black py-2.5 rounded text-xs uppercase">
          {{ isLoading ? 'Menyimpan...' : 'SIMPAN' }}
        </button>
      </div>
    </div>
  </div>
</template>