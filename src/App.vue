<script setup lang="ts">
import { ref, computed } from 'vue'

// Interface Data Pemain
interface Player {
  id: number
  name: string
  role: string
  category: 'Keeper' | 'Defender' | 'Midfielder' | 'Striker'
  photo: string
  number: number
}

// State untuk Filter Kategori Pemain
const activeCategory = ref<string>('All')

// Import Asset Foto (Aman dari query string & issue Vite build)
import imgImanuel from '/src/assets/Screenshot 2026-07-28 100646.png'
import imgKhenichi from '/src/assets/Screenshot 2026-07-28 100359.png'
import imgHansel from '/src/assets/Screenshot 2026-07-28 100633.png'
import imgMarlon from '/src/assets/Screenshot 2026-07-28 100336.png'
import imgSony from '/src/assets/Screenshot 2026-07-28 100346.png'
import imgKetan from '/src/assets/Screenshot 2026-07-28 100654.png'
import imgValerio from '/src/assets/Screenshot 2026-07-28 100319.png'
import imgKevin from '/src/assets/Screenshot 2026-07-28 100412.png'

// Data Lengkap Pemain Netzach FC
const players = ref<Player[]>([
  { id: 1, name: 'IMANUEL', role: 'Goalkeeper', category: 'Keeper', photo: imgImanuel, number: 1 },
  { id: 2, name: 'KHENICHI', role: 'Center Back', category: 'Defender', photo: imgKhenichi, number: 4 },
  { id: 3, name: 'HANSEL', role: 'Full Back', category: 'Defender', photo: imgHansel, number: 3 },
  { id: 4, name: 'MARLON', role: 'Center Back', category: 'Defender', photo: imgMarlon, number: 5 },
  { id: 5, name: 'SONY', role: 'Central Midfield', category: 'Midfielder', photo: imgSony, number: 8 },
  { id: 6, name: 'KETAN', role: 'Attacking Midfield', category: 'Midfielder', photo: imgKetan, number: 10 },
  { id: 7, name: 'VALERIO', role: 'Defensive Midfield', category: 'Midfielder', photo: imgValerio, number: 6 },
  { id: 8, name: 'KEVIN', role: 'Main Striker', category: 'Striker', photo: imgKevin, number: 9 }
])

// Filtered Players
const filteredPlayers = computed(() => {
  if (activeCategory.value === 'All') return players.value
  return players.value.filter(p => p.category === activeCategory.value)
})

// Data Jadwal Pertandingan
const fixtures = ref([
  { id: 1, home: 'NetZach FC', away: 'Spartan FC', date: 'AUG 12', time: '19:00 WIB', status: 'NEXT MATCH' },
  { id: 2, home: 'Cobra FC', away: 'NetZach FC', date: 'AUG 18', time: '16:00 WIB', status: 'UPCOMING' },
  { id: 3, home: 'NetZach FC', away: 'United FC', date: 'AUG 25', time: '20:00 WIB', status: 'UPCOMING' },
  { id: 4, home: 'Phoenix FC', away: 'NetZach FC', date: 'SEP 02', time: '19:00 WIB', status: 'UPCOMING' }
])

// Data Berita
const news = ref([
  {
    id: 1,
    category: 'MATCH PREVIEW',
    title: 'NetZach FC Siap Menghadapi Laga Krusial Melawan Spartan FC Minggu Ini',
    date: 'JUL 28, 2026',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 2,
    category: 'SQUAD UPDATE',
    title: 'Latihan Intensif Skuad Utama Jelang Pembukaan Musim Baru Liga',
    date: 'JUL 26, 2026',
    image: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=600&auto=format&fit=crop'
  }
])
</script>

<template>
  <div class="min-h-screen bg-[#0d0d0d] text-[#FFFFFF] font-sans selection:bg-[#C5A059] selection:text-black">
    
    <!-- 1. TOP HEADER & NAVBAR -->
    <header class="border-b border-[#C5A059]/20 bg-[#0d0d0d]/90 backdrop-blur-md sticky top-0 z-50">
      <!-- Top Bar -->
      <div class="max-w-7xl mx-auto px-6 py-1.5 flex justify-between items-center text-[11px] border-b border-white/5 text-[#C5A059]/80 font-medium tracking-wider">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>OFFICIAL CLUB WEBSITE</span>
        </div>
        <div class="flex gap-4">
          <a href="#" class="hover:text-white transition">TWITTER</a>
          <a href="#" class="hover:text-white transition">FACEBOOK</a>
          <a href="#" class="hover:text-white transition">INSTAGRAM</a>
        </div>
      </div>

      <!-- Main Nav -->
      <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <!-- Logo Text Left -->
        <a href="#" class="flex items-center gap-3 group">
          <div class="w-10 h-12 border-2 border-[#C5A059] flex items-center justify-center bg-black shadow-[0_0_15px_rgba(197,160,89,0.3)] relative group-hover:scale-105 transition duration-300">
            <span class="text-[#C5A059] font-black text-lg tracking-tighter">NZ</span>
            <span class="absolute bottom-0.5 text-[7px] text-[#C5A059] tracking-widest font-black">FC</span>
          </div>
          <div class="flex flex-col">
            <span class="text-xl font-black tracking-widest text-white leading-none">NETZACH</span>
            <span class="text-[10px] font-bold tracking-[0.3em] text-[#C5A059]">FOOTBALL CLUB</span>
          </div>
        </a>

        <!-- Links -->
        <nav class="hidden lg:flex items-center gap-8 text-xs font-bold tracking-[0.15em]">
          <a href="#" class="text-[#C5A059] border-b-2 border-[#C5A059] pb-1">HOME</a>
          <a href="#squad" class="text-gray-300 hover:text-[#C5A059] transition pb-1">SQUAD</a>
          <a href="#fixtures" class="text-gray-300 hover:text-[#C5A059] transition pb-1">FIXTURES</a>
          <a href="#colors" class="text-gray-300 hover:text-[#C5A059] transition pb-1">IDENTITY</a>
          <a href="#news" class="text-gray-300 hover:text-[#C5A059] transition pb-1">NEWS</a>
        </nav>

        <a href="#squad" class="hidden sm:inline-block border border-[#C5A059] text-[#C5A059] px-5 py-2 text-xs font-black tracking-widest rounded hover:bg-[#C5A059] hover:text-black transition duration-300 shadow-[0_0_15px_rgba(197,160,89,0.2)]">
          ROSTER 2026
        </a>
      </div>
    </header>

    <!-- 2. HERO SECTION -->
    <section class="relative min-h-[85vh] flex items-center justify-center bg-[#0d0d0d] overflow-hidden py-16 px-6">
      <!-- Ambient Glow & Pattern -->
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#C5A059]/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div class="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px] opacity-5 pointer-events-none"></div>

      <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        <!-- Text Left -->
        <div class="lg:col-span-7 space-y-6 text-center lg:text-left">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#C5A059]/40 bg-[#C5A059]/10 text-[#C5A059] text-xs font-bold tracking-widest uppercase">
            <span>⚔️</span> RISE TO GLORY
          </div>
          
          <h1 class="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[0.95] text-white">
            WE ARE <br />
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#C5A059] via-[#f3e0aa] to-[#C5A059]">
              NETZACH FC
            </span>
          </h1>

          <p class="text-gray-400 max-w-xl text-sm sm:text-base font-normal leading-relaxed">
            Kehormatan, kekuatan, dan keberanian. Menyaksikan perjalanan legenda baru dalam kancah sepak bola modern dengan semangat pantang menyerah.
          </p>

          <div class="pt-4 flex flex-wrap justify-center lg:justify-start gap-4">
            <a 
              href="#squad" 
              class="bg-gradient-to-r from-[#C5A059] to-[#9e7d3b] text-black font-black px-8 py-3.5 rounded shadow-[0_0_25px_rgba(197,160,89,0.4)] hover:brightness-110 transition duration-300 tracking-wider text-xs uppercase"
            >
              EXPLORE SQUAD
            </a>
            <a 
              href="#fixtures" 
              class="border border-white/20 hover:border-[#C5A059] text-white font-bold px-8 py-3.5 rounded hover:bg-white/5 transition duration-300 tracking-wider text-xs uppercase"
            >
              VIEW FIXTURES
            </a>
          </div>
        </div>

        <!-- Featured Player Showcase Right -->
        <div class="lg:col-span-5 relative flex justify-center">
          <div class="relative w-full max-w-md aspect-[3/4] rounded-2xl p-1 bg-gradient-to-b from-[#C5A059] via-[#C5A059]/20 to-transparent shadow-[0_0_50px_rgba(197,160,89,0.15)]">
            <div class="w-full h-full bg-[#141414] rounded-xl overflow-hidden relative group">
              <img 
                src="https://images.unsplash.com/photo-1511886929837-354d827aae26?q=80&w=800&auto=format&fit=crop" 
                alt="NetZach FC Spirit" 
                class="w-full h-full object-cover filter contrast-125 brightness-90 group-hover:scale-105 transition duration-700"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-transparent"></div>
              <div class="absolute bottom-6 left-6 right-6 p-4 rounded-lg bg-black/60 backdrop-blur-md border border-white/10">
                <span class="text-[10px] font-black tracking-widest text-[#C5A059] uppercase">SEASON 2026/2027</span>
                <h3 class="text-xl font-black text-white tracking-wider">THE GOLDEN SQUAD</h3>
                <p class="text-xs text-gray-400 mt-1">8 Elite Players Ready to Conquer</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. MAIN SQUAD SECTION -->
    <section id="squad" class="py-24 px-6 bg-[#111111] relative border-t border-white/5">
      <div class="max-w-7xl mx-auto space-y-12">
        
        <!-- Section Header -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-6">
          <div>
            <div class="text-xs font-black tracking-[0.3em] text-[#C5A059] uppercase mb-2">THE WARRIORS</div>
            <h2 class="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase">OFFICIAL SQUAD</h2>
          </div>

          <!-- Category Filter Tabs -->
          <div class="flex flex-wrap gap-2">
            <button 
              v-for="cat in ['All', 'Keeper', 'Defender', 'Midfielder', 'Striker']" 
              :key="cat"
              @click="activeCategory = cat"
              :class="[
                'px-4 py-2 text-xs font-bold tracking-wider rounded transition duration-300 uppercase',
                activeCategory === cat 
                  ? 'bg-[#C5A059] text-black shadow-[0_0_15px_rgba(197,160,89,0.4)]' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              ]"
            >
              {{ cat }}
            </button>
          </div>
        </div>

        <!-- Players Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div 
            v-for="player in filteredPlayers" 
            :key="player.id"
            class="group relative bg-[#181818] border border-white/10 rounded-xl overflow-hidden hover:border-[#C5A059] transition duration-500 shadow-xl flex flex-col"
          >
            <!-- Card Image -->
            <div class="h-72 overflow-hidden relative bg-black/40">
              <!-- Player Jersey Number Tag -->
              <span class="absolute top-3 right-3 text-3xl font-black text-white/20 group-hover:text-[#C5A059] transition duration-300 z-10">
                #{{ player.number }}
              </span>

              <!-- Category Badge -->
              <span class="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-[#C5A059] border border-[#C5A059]/40 text-[9px] font-black px-2.5 py-1 rounded uppercase tracking-widest z-10">
                {{ player.category }}
              </span>

              <!-- Photo -->
              <img 
                :src="player.photo" 
                :alt="player.name" 
                class="w-full h-full object-cover object-top filter grayscale contrast-110 group-hover:grayscale-0 group-hover:scale-105 transition duration-500" 
              />
              <div class="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent"></div>
            </div>

            <!-- Card Body -->
            <div class="p-5 bg-[#181818] border-t border-white/5 flex-grow flex flex-col justify-between">
              <div>
                <h3 class="text-xl font-black tracking-wider text-white group-hover:text-[#C5A059] transition duration-300">
                  {{ player.name }}
                </h3>
                <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                  {{ player.role }}
                </p>
              </div>

              <div class="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-gray-500 font-mono">
                <span>NETZACH FC</span>
                <span class="text-[#C5A059] font-bold">PRO PLAYER</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- 4. FIXTURES & IDENTITY SECTION -->
    <section id="fixtures" class="py-24 px-6 bg-[#0d0d0d] border-t border-white/5">
      <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        <!-- Fixtures Left (7 Cols) -->
        <div class="lg:col-span-7 space-y-6">
          <div>
            <div class="text-xs font-black tracking-[0.3em] text-[#C5A059] uppercase mb-2">MATCH CENTER</div>
            <h2 class="text-3xl font-black tracking-tight text-white uppercase">UPCOMING FIXTURES</h2>
          </div>

          <div class="space-y-4">
            <div 
              v-for="fixture in fixtures" 
              :key="fixture.id"
              class="p-5 rounded-xl bg-[#141414] border border-white/5 hover:border-[#C5A059]/50 transition duration-300 flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <div class="text-center sm:text-left">
                <span class="text-[10px] font-black px-2 py-0.5 rounded bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30">
                  {{ fixture.status }}
                </span>
                <div class="text-xs font-bold text-gray-400 mt-2">{{ fixture.date }} • {{ fixture.time }}</div>
              </div>

              <div class="flex items-center gap-4 text-base font-black tracking-wider">
                <span class="text-white text-right min-w-[100px]">{{ fixture.home }}</span>
                <span class="px-3 py-1 bg-[#C5A059] text-black text-xs font-black rounded">VS</span>
                <span class="text-white text-left min-w-[100px]">{{ fixture.away }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Identity / Colors Right (5 Cols) -->
        <div id="colors" class="lg:col-span-5 space-y-6 bg-[#141414] p-8 rounded-2xl border border-white/5">
          <div>
            <div class="text-xs font-black tracking-[0.3em] text-[#C5A059] uppercase mb-2">OUR IDENTITY</div>
            <h2 class="text-3xl font-black tracking-tight text-white uppercase">THE COLORS</h2>
          </div>

          <p class="text-xs text-gray-400 leading-relaxed">
            Hitam mewakili kekuatan dan dominasi tanpa kompromi, Emas menyimbolkan kejayaan dan supremasi tertinggi, sedangkan Putih melambangkan integritas murni.
          </p>

          <!-- Swatches -->
          <div class="grid grid-cols-3 gap-4 pt-2">
            <div class="p-4 rounded-xl bg-[#121212] border border-white/20 text-center space-y-2">
              <div class="w-full h-10 rounded bg-[#121212] border border-white/10"></div>
              <div class="text-[11px] font-black text-white">BLACK</div>
              <div class="text-[9px] font-mono text-gray-500">#121212</div>
            </div>

            <div class="p-4 rounded-xl bg-[#121212] border border-white/20 text-center space-y-2">
              <div class="w-full h-10 rounded bg-[#C5A059]"></div>
              <div class="text-[11px] font-black text-[#C5A059]">GOLD</div>
              <div class="text-[9px] font-mono text-gray-500">#C5A059</div>
            </div>

            <div class="p-4 rounded-xl bg-[#121212] border border-white/20 text-center space-y-2">
              <div class="w-full h-10 rounded bg-white"></div>
              <div class="text-[11px] font-black text-white">WHITE</div>
              <div class="text-[9px] font-mono text-gray-500">#FFFFFF</div>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- 5. RECENT NEWS SECTION -->
    <section id="news" class="py-24 px-6 bg-[#111111] border-t border-white/5">
      <div class="max-w-7xl mx-auto space-y-12">
        <div>
          <div class="text-xs font-black tracking-[0.3em] text-[#C5A059] uppercase mb-2">MEDIA & UPDATES</div>
          <h2 class="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase">RECENT NEWS</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div 
            v-for="item in news" 
            :key="item.id"
            class="group bg-[#181818] border border-white/5 rounded-xl overflow-hidden hover:border-[#C5A059]/40 transition duration-300 flex flex-col sm:flex-row"
          >
            <div class="sm:w-2/5 h-48 sm:h-auto overflow-hidden">
              <img :src="item.image" :alt="item.title" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
            </div>
            <div class="p-6 sm:w-3/5 flex flex-col justify-between space-y-4">
              <div>
                <div class="flex items-center gap-3 text-[10px] font-bold text-[#C5A059] tracking-widest uppercase">
                  <span>{{ item.category }}</span>
                  <span>•</span>
                  <span class="text-gray-500">{{ item.date }}</span>
                </div>
                <h3 class="text-base font-bold text-white group-hover:text-[#C5A059] transition duration-300 mt-2 leading-snug">
                  {{ item.title }}
                </h3>
              </div>
              <a href="#" class="text-xs font-bold text-white flex items-center gap-2 group-hover:translate-x-1 transition duration-300">
                READ MORE <span class="text-[#C5A059]">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 6. FOOTER -->
    <footer class="bg-[#080808] text-gray-500 py-12 px-6 border-t border-white/10 text-xs">
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div class="flex items-center gap-3">
          <div class="w-8 h-9 border border-[#C5A059] flex items-center justify-center bg-black">
            <span class="text-[#C5A059] font-black text-sm">NZ</span>
          </div>
          <span class="font-black text-white tracking-widest text-sm">NETZACH FC</span>
        </div>

        <div class="flex flex-wrap justify-center gap-8 font-bold text-gray-400">
          <a href="#" class="hover:text-[#C5A059] transition">HOME</a>
          <a href="#squad" class="hover:text-[#C5A059] transition">SQUAD</a>
          <a href="#fixtures" class="hover:text-[#C5A059] transition">FIXTURES</a>
          <a href="#colors" class="hover:text-[#C5A059] transition">IDENTITY</a>
          <a href="#news" class="hover:text-[#C5A059] transition">NEWS</a>
        </div>

        <p class="text-[11px]">© 2026 NETZACH FOOTBALL CLUB. ALL RIGHTS RESERVED.</p>
      </div>
    </footer>

  </div>
</template>

<style>
/* Smooth Scroll */
html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  padding: 0;
  background-color: #0d0d0d;
}
</style>