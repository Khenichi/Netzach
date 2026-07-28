<script setup lang="ts">
import { ref } from 'vue'

// Data Statis untuk Pemain
const players = ref([
  { id: 1, name: 'KEVIN', role: 'NetZach Winger', photo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600&auto=format&fit=crop' },
  { id: 2, name: 'SAPUTRA', role: 'NetZach Forward', photo: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?q=80&w=600&auto=format&fit=crop', featured: true },
  { id: 3, name: 'VALERIO', role: 'NetZach Midfielder', photo: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=600&auto=format&fit=crop' }
])

// Data Jadwal Pertandingan
const fixtures = ref([
  { home: 'NetZach FC', away: 'Spartan FC' },
  { home: 'Cobra FC', away: 'NetZach FC' },
  { home: 'NetZach FC', away: 'United FC' },
  { home: 'Phoenix FC', away: 'NetZach FC' }
])

// Data Berita Terbaru
const news = ref([
  {
    id: 1,
    title: 'Lorem ipsum dolor sit amet, consectetur adip. elit, sed do eiusmod tempor.',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 2,
    title: 'Lorem ipsum dolor sit amet, consectetur adip. elit, sed do eiusmod tempor.',
    image: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=300&auto=format&fit=crop'
  }
])
</script>

<template>
  <div class="min-h-screen bg-[#121212] text-[#FFFFFF] font-sans selection:bg-[#C5A059] selection:text-black">
    
    <!-- 1. TOP HEADER & NAVBAR -->
    <header class="border-b border-[#C5A059]/30 bg-[#121212] sticky top-0 z-50">
      <!-- Social Media Icons Row -->
      <div class="max-w-7xl mx-auto px-6 py-1 flex justify-end gap-3 text-xs text-[#C5A059]">
        <a href="#" class="hover:text-white transition">twitter</a>
        <a href="#" class="hover:text-white transition">facebook</a>
        <a href="#" class="hover:text-white transition">instagram</a>
      </div>

      <!-- Main Nav -->
      <div class="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div class="text-xl font-black tracking-wider text-white">
          NETZACH FC
        </div>

        <!-- Center Logo (Absolute centered on desktop) -->
        <div class="hidden md:flex flex-col items-center">
          <div class="w-12 h-14 border-2 border-[#C5A059] flex items-center justify-center bg-[#121212] shadow-lg relative">
            <span class="text-[#C5A059] font-black text-xl tracking-tighter">NZ</span>
            <span class="absolute bottom-1 text-[8px] text-[#C5A059] tracking-widest font-bold">FC</span>
          </div>
        </div>

        <nav class="flex items-center gap-6 text-sm font-semibold tracking-wide">
          <a href="#" class="text-[#C5A059] border-b-2 border-[#C5A059] pb-1">HOME</a>
          <a href="#" class="hover:text-[#C5A059] transition pb-1">ABOUT</a>
          <a href="#" class="hover:text-[#C5A059] transition pb-1">FIXTURES</a>
          <a href="#" class="hover:text-[#C5A059] transition pb-1">SQUAD</a>
          <a href="#" class="hover:text-[#C5A059] transition pb-1">JERSEYS</a>
          <a href="#" class="hover:text-[#C5A059] transition pb-1">STORE</a>
        </nav>
      </div>
    </header>

    <!-- 2. HERO SECTION -->
    <section class="relative bg-gradient-to-b from-[#121212] via-[#1a1712] to-[#121212] py-20 px-6 overflow-hidden">
      <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <!-- Text Left -->
        <div class="z-10">
          <h1 class="text-4xl md:text-6xl font-black tracking-tight text-white leading-none">
            NETZACH FC:<br />
            <span class="text-[#C5A059]">OUR JOURNEY</span><br />
            BEGINS.
          </h1>
          <div class="mt-8">
            <a 
              href="#squad" 
              class="inline-block border-2 border-[#C5A059] text-[#C5A059] font-bold px-6 py-2.5 rounded hover:bg-[#C5A059] hover:text-black transition duration-300 tracking-wider text-sm"
            >
              MEET THE TEAM
            </a>
          </div>
        </div>

        <!-- Players Image Right -->
        <div class="relative flex justify-center items-end h-[350px]">
          <div class="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent z-10"></div>
          <img 
            src="https://images.unsplash.com/photo-1511886929837-354d827aae26?q=80&w=800&auto=format&fit=crop" 
            alt="NetZach Players" 
            class="h-full object-cover rounded-lg filter contrast-125 brightness-90 shadow-2xl"
          />
        </div>
      </div>
    </section>

    <!-- 3. MAIN CONTENT SECTION (WHITE BACKGROUND) -->
    <main class="bg-white text-black py-16 px-6">
      <div class="max-w-7xl mx-auto space-y-16">
        
        <!-- Top Row: Player Showcase & Our Colors -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          
          <!-- Player Cards Carousel/Showcase (2 Columns) -->
          <div id="squad" class="lg:col-span-2 flex justify-center items-center gap-4">
            <!-- Left Player (Smaller) -->
            <div class="w-1/4 h-64 bg-black rounded overflow-hidden shadow-lg opacity-80 scale-95 border border-gray-800 hidden sm:block">
              <img :src="players[0]?.photo" :alt="players[0]?.name" class="w-full h-full object-cover filter grayscale hover:grayscale-0 transition" />
            </div>

            <!-- Featured Middle Player (Highlighted Gold Border) -->
            <div class="w-full sm:w-2/4 bg-black border-4 border-[#C5A059] rounded-lg overflow-hidden shadow-2xl relative transform -translate-y-2">
              <div class="h-80 overflow-hidden relative">
                <img :src="players[1]?.photo" :alt="players[1]?.name" class="w-full h-full object-cover" />
              </div>
              <div class="bg-black text-center py-4 px-2 border-t border-[#C5A059]">
                <h3 class="text-2xl font-black tracking-wider text-white">{{ players[1]?.name }}</h3>
                <p class="text-xs font-semibold text-[#C5A059] uppercase tracking-widest mt-1">{{ players[1]?.role }}</p>
              </div>
            </div>

            <!-- Right Player (Smaller) -->
            <div class="w-1/4 h-64 bg-black rounded overflow-hidden shadow-lg opacity-80 scale-95 border border-gray-800 hidden sm:block">
              <img :src="players[2]?.photo" :alt="players[2]?.name" class="w-full h-full object-cover filter grayscale hover:grayscale-0 transition" />
            </div>
          </div>

          <!-- Our Colors Section -->
          <div class="border-l-0 lg:border-l-2 border-gray-200 lg:pl-8 space-y-4">
            <h2 class="text-2xl font-black tracking-wider text-black">OUR COLORS</h2>
            
            <!-- Fabric Texture Preview -->
            <div class="h-44 rounded-lg overflow-hidden shadow-inner border border-gray-300">
              <img 
                src="https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=500&auto=format&fit=crop" 
                alt="Jersey Fabric Texture" 
                class="w-full h-full object-cover"
              />
            </div>

            <!-- Color Palette Swatches -->
            <div class="flex gap-4 pt-2">
              <div class="w-12 h-12 bg-[#121212] border border-gray-400 rounded shadow-md"></div>
              <div class="w-12 h-12 bg-[#C5A059] border border-gray-400 rounded shadow-md"></div>
              <div class="w-12 h-12 bg-[#FFFFFF] border border-gray-300 rounded shadow-md"></div>
            </div>
          </div>

        </div>

        <hr class="border-gray-200" />

        <!-- Bottom Row: Fixtures & Recent News -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          <!-- Fixtures Table -->
          <div>
            <h2 class="text-2xl font-black tracking-wider text-black mb-6">FIXTURES</h2>
            <div class="space-y-3">
              <div 
                v-for="(fixture, idx) in fixtures" 
                :key="idx" 
                class="flex items-center justify-between p-3 border-b border-gray-200 hover:bg-gray-50 transition"
              >
                <span class="font-bold text-sm tracking-wide text-gray-800">{{ fixture.home }}</span>
                <span class="text-[#C5A059] font-black px-4">|</span>
                <span class="font-bold text-sm tracking-wide text-gray-800">{{ fixture.away }}</span>
              </div>
            </div>
          </div>

          <!-- Recent News -->
          <div>
            <h2 class="text-2xl font-black tracking-wider text-black mb-6">RECENT NEWS</h2>
            <div class="space-y-4">
              <div 
                v-for="item in news" 
                :key="item.id" 
                class="flex gap-4 items-center p-2 rounded hover:bg-gray-50 transition"
              >
                <img :src="item.image" :alt="item.title" class="w-24 h-16 object-cover rounded shadow" />
                <p class="text-xs font-semibold text-gray-700 leading-relaxed hover:text-[#C5A059] cursor-pointer">
                  {{ item.title }}
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </main>

    <!-- 4. FOOTER -->
    <footer class="bg-[#121212] text-gray-400 py-8 px-6 border-t border-[#C5A059]/30 text-center text-xs">
      <div class="max-w-7xl mx-auto space-y-4">
        <div class="flex justify-center gap-6 font-semibold text-white">
          <a href="#" class="hover:text-[#C5A059]">HOME</a>
          <a href="#" class="hover:text-[#C5A059]">ABOUT</a>
          <a href="#" class="hover:text-[#C5A059]">FIXTURES</a>
          <a href="#" class="hover:text-[#C5A059]">SQUAD</a>
          <a href="#" class="hover:text-[#C5A059]">JERSEYS</a>
          <a href="#" class="hover:text-[#C5A059]">STORE</a>
        </div>
        <p class="text-gray-500">NETZACH FC | www.netzachfc.id</p>
      </div>
    </footer>

  </div>
</template>

<style>
/* Reset margin default agar tidak ada spasi kosong di pinggir layar */
body {
  margin: 0;
  padding: 0;
  background-color: #121212;
}
</style>