<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import imgNetzachCrow from '/src/assets/WhatsApp Image 2026-07-28 at 10.50.06 AM (1).jpeg'
import imgTeamPhoto from '/src/assets/WhatsApp Image 2026-08-13 at 2.55.33 PM.jpeg'  // ✅ Foto baru
import { useData } from '../composables/useData'
import type { NewsItem } from '../types'

const { fixtures } = useData()

const totalMatchesPlayed = computed<number>(() => 
  fixtures.value.filter(f => f.status === 'FINISHED').length
)

const totalWins = computed<number>(() =>
  fixtures.value.filter(f => 
    f.status === 'FINISHED' && 
    (f.homeScore || 0) > (f.awayScore || 0)
  ).length
)

const news: NewsItem[] = [
  { id: 1, category: 'MATCH PREVIEW', title: 'NetZach FC Siap Menghadapi Laga Krusial Minggu Ini', date: 'JUL 28, 2026', image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=600' },
  { id: 2, category: 'SQUAD UPDATE', title: 'Latihan Intensif Skuad Utama Jelang Pembukaan Musim Baru', date: 'JUL 26, 2026', image: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=600' }
]

interface Stat { label: string; value: string | number; }
interface Value { title: string; desc: string }

const stats = computed<Stat[]>(() => [
  { label: 'Founded', value: '2026' },
  { label: 'Active Players', value: '9' },
  { label: 'Matches Played', value: totalMatchesPlayed.value > 0 ? `${totalMatchesPlayed.value}` : '0' },
  { label: 'Victories', value: totalWins.value > 0 ? `${totalWins.value}` : '0' }
])

const values: Value[] = [
  { title: 'HONOR', desc: 'Menjunjung tinggi sportivitas dan kehormatan dalam setiap pertandingan.' },
  { title: 'COURAGE', desc: 'Keberanian untuk bertarung sampai peluit akhir, apapun situasinya.' },
  { title: 'FAMILY', desc: 'Ikatan kekeluargaan yang kuat menjadi fondasi utama klub ini.' },
  { title: 'EXCELLENCE', desc: 'Komitmen untuk selalu memberikan yang terbaik di setiap laga.' }
]
</script>

<template>
  <div>
    <!-- HERO -->
    <section class="relative min-h-[85vh] flex items-center justify-center bg-[#0d0d0d] overflow-hidden py-16 px-6">
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#C5A059]/10 rounded-full blur-[140px]"></div>
      <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        <div class="lg:col-span-7 space-y-6 text-center lg:text-left">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#C5A059]/40 bg-[#C5A059]/10 text-[#C5A059] text-xs font-bold tracking-widest uppercase">
            RISE TO GLORY
          </div>
          <h1 class="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[0.95]">
            WE ARE <br />
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#C5A059] via-[#f3e0aa] to-[#C5A059]">NETZACH FC</span>
          </h1>
          <p class="text-gray-400 max-w-xl text-sm sm:text-base leading-relaxed">
            Kehormatan, kekuatan, dan keberanian. Menyaksikan perjalanan legenda baru dalam kancah sepak bola modern.
          </p>
          <div class="pt-4 flex flex-wrap justify-center lg:justify-start gap-4">
            <RouterLink to="/squad" class="bg-gradient-to-r from-[#C5A059] to-[#9e7d3b] text-black font-black px-8 py-3.5 rounded shadow-[0_0_25px_rgba(197,160,89,0.4)] hover:brightness-110 transition tracking-wider text-xs uppercase">EXPLORE SQUAD</RouterLink>
            <RouterLink to="/schedule" class="border border-white/20 hover:border-[#C5A059] font-bold px-8 py-3.5 rounded hover:bg-white/5 transition tracking-wider text-xs uppercase">VIEW SCHEDULE</RouterLink>
          </div>
        </div>
        <div class="lg:col-span-5 relative flex justify-center">
          <div class="relative w-full max-w-md aspect-[3/4] rounded-2xl p-1 bg-gradient-to-b from-[#C5A059] via-[#C5A059]/20 to-transparent shadow-[0_0_50px_rgba(197,160,89,0.15)]">
            <div class="w-full h-full bg-[#141414] rounded-xl overflow-hidden relative group">
              <img :src="imgNetzachCrow" class="w-full h-full object-cover filter contrast-125 brightness-90 group-hover:scale-105 transition duration-700" />
              <div class="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-transparent"></div>
              <div class="absolute bottom-6 left-6 right-6 p-4 rounded-lg bg-black/60 backdrop-blur-md border border-white/10">
                <span class="text-[10px] font-black tracking-widest text-[#C5A059] uppercase">SEASON 2026/2027</span>
                <h3 class="text-xl font-black tracking-wider">THE GOLDEN SQUAD</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================ -->
    <!-- 🆕 TEAM PHOTO + QUOTE (DITIMPA) -->
    <!-- ============================================ -->
    <section class="relative overflow-hidden bg-[#0d0d0d]">
      <!-- Container untuk foto dengan aspect ratio natural -->
      <div class="relative w-full">
        <!-- Foto dengan ukuran asli (tidak di-crop) -->
        <img 
          :src="imgTeamPhoto" 
          alt="NetZach FC Team" 
          class="w-full h-auto block filter brightness-[0.75] saturate-[0.8] sepia-[0.2]"
        />
        
        <!-- Overlay gradient golden-dark -->
        <div class="absolute inset-0 bg-gradient-to-b from-[#0d0d0d] via-[#C5A059]/15 to-[#0d0d0d]"></div>
        <div class="absolute inset-0 bg-[#C5A059]/10 mix-blend-multiply"></div>

        <!-- Quote ditimpa di tengah foto -->
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="max-w-4xl mx-auto px-6 text-center">
            <p class="text-2xl sm:text-3xl md:text-4xl font-light italic text-white leading-relaxed mb-8 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
              NetZach FC didirikan atas dasar 
              <span class="text-[#C5A059] font-bold not-italic">passion</span>, 
              <span class="text-[#C5A059] font-bold not-italic">kedisiplinan</span>, dan 
              <span class="text-[#C5A059] font-bold not-italic">ikatan kekeluargaan</span> 
              yang kuat.
            </p>
            <div class="w-24 h-0.5 bg-gradient-to-r from-transparent via-[#C5A059] to-transparent mx-auto mb-6"></div>
            <p class="text-xs font-black tracking-[0.3em] text-[#C5A059] uppercase drop-shadow-lg">
              — THE NETZACH PHILOSOPHY —
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ABOUT US -->
    <section class="py-24 px-6 bg-gradient-to-b from-[#111111] to-[#0d0d0d] relative overflow-hidden">
      <div class="absolute top-20 right-0 w-[400px] h-[400px] bg-[#C5A059]/5 rounded-full blur-[120px]"></div>
      <div class="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#C5A059]/5 rounded-full blur-[100px]"></div>

      <div class="max-w-7xl mx-auto space-y-16 relative z-10">
        <div class="text-center space-y-4">
          <div class="text-xs font-black tracking-[0.3em] text-[#C5A059] uppercase">WHO WE ARE</div>
          <h2 class="text-4xl sm:text-5xl font-black tracking-tight uppercase">ABOUT NETZACH FC</h2>
          <div class="w-24 h-1 bg-gradient-to-r from-[#C5A059] to-transparent mx-auto"></div>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div v-for="stat in stats" :key="stat.label" class="p-6 rounded-xl bg-[#141414] border border-white/5 hover:border-[#C5A059]/50 transition group text-center">
            <div class="text-3xl font-black text-[#C5A059] mb-1">{{ stat.value }}</div>
            <div class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{{ stat.label }}</div>
          </div>
        </div>

        <!-- Club Values -->
        <div>
          <h3 class="text-2xl font-black text-center mb-10 uppercase tracking-wider">OUR VALUES</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div v-for="v in values" :key="v.title" class="p-6 rounded-xl bg-[#141414] border border-white/5 hover:border-[#C5A059]/50 hover:-translate-y-1 transition-all duration-300 group">
              <h4 class="text-lg font-black text-[#C5A059] mb-2">{{ v.title }}</h4>
              <p class="text-xs text-gray-400 leading-relaxed">{{ v.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- NEWS -->
    <section class="py-24 px-6 bg-[#0d0d0d] border-t border-white/5">
      <div class="max-w-7xl mx-auto space-y-12">
        <div>
          <div class="text-xs font-black tracking-[0.3em] text-[#C5A059] uppercase mb-2">LATEST UPDATES</div>
          <h2 class="text-3xl font-black tracking-tight uppercase">CLUB NEWS</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div v-for="item in news" :key="item.id" class="bg-[#181818] border border-white/10 rounded-xl overflow-hidden hover:border-[#C5A059] transition duration-300 group">
            <div class="h-48 overflow-hidden">
              <img :src="item.image" :alt="item.title" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
            </div>
            <div class="p-6 space-y-2">
              <div class="flex items-center justify-between text-[10px] text-[#C5A059] font-bold">
                <span>{{ item.category }}</span>
                <span>{{ item.date }}</span>
              </div>
              <h3 class="text-lg font-bold">{{ item.title }}</h3>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>