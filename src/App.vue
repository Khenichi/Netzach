<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// Import Firebase
import { db, auth } from './firebase'
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  deleteDoc 
} from 'firebase/firestore'
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  type User
} from 'firebase/auth'

import bgMusicFile from '/src/assets/music.mp3'

// -------------------------------------------------------------
// 1. AUDIO CONTROLLER
// -------------------------------------------------------------
const audioRef = ref<HTMLAudioElement | null>(null)
const isPlaying = ref<boolean>(false)

const toggleAudio = () => {
  if (!audioRef.value) return
  if (isPlaying.value) {
    audioRef.value.pause()
    isPlaying.value = false
  } else {
    playMusic()
  }
}

const playMusic = () => {
  if (!audioRef.value) return
  audioRef.value.play().then(() => {
    isPlaying.value = true
  }).catch(err => {
    console.log("Autoplay ditahan browser:", err)
    isPlaying.value = false
  })
}

// -------------------------------------------------------------
// 2. INTERFACES & TYPES
// -------------------------------------------------------------
type GeneralPosition = 'Keeper' | 'Defender' | 'Midfielder' | 'Striker'

interface PlayerStats {
  matches: number
  goals: number
  assists: number
  yellowCards: number
  redCards: number
}

interface Player {
  id?: string
  name: string
  role: string
  category: GeneralPosition
  photo: string
  number: number
  stats?: PlayerStats
}

interface Fixture {
  id?: string
  home: string
  away: string
  date: string
  time: string
  status: 'NEXT MATCH' | 'UPCOMING' | 'FINISHED'
}

// -------------------------------------------------------------
// 3. ASSET FOTO DEFAULT & MAP
// -------------------------------------------------------------
import imgImanuel from '/src/assets/Screenshot 2026-07-28 100646.png'
import imgKhenichi from '/src/assets/Screenshot 2026-07-28 100359.png'
import imgHansel from '/src/assets/Screenshot 2026-07-28 100633.png'
import imgMarlon from '/src/assets/Screenshot 2026-07-28 100336.png'
import imgSony from '/src/assets/Screenshot 2026-07-28 100346.png'
import imgKetan from '/src/assets/Screenshot 2026-07-28 100654.png'
import imgValerio from '/src/assets/Screenshot 2026-07-28 100319.png'
import imgKevin from '/src/assets/Screenshot 2026-07-28 100412.png'
import imgNetzach from '/src/assets/Screenshot 2026-07-28 103255.png'

const localPhotos: Record<string, string> = {
  'IMANUEL': imgImanuel,
  'KHENICHI': imgKhenichi,
  'HANSEL': imgHansel,
  'MARLON': imgMarlon,
  'SONY': imgSony,
  'KETAN': imgKetan,
  'VALERIO': imgValerio,
  'KEVIN': imgKevin
}

// -------------------------------------------------------------
// 4. STATES & REFS
// -------------------------------------------------------------
const activeCategory = ref<string>('All')
const selectedPlayer = ref<Player | null>(null) // State Modal Stats Pemain

// Auth States
const isAdmin = ref<boolean>(false)
const showLoginModal = ref<boolean>(false)
const showAdminDashboard = ref<boolean>(false)
const email = ref('')
const password = ref('')
const loginError = ref('')

// Firestore Dynamic Collections
const players = ref<Player[]>([])
const fixtures = ref<Fixture[]>([])

// Form Jadwal Baru
const newFixture = ref<Fixture>({
  home: 'NetZach FC',
  away: '',
  date: '',
  time: '19:00 WIB',
  status: 'UPCOMING'
})

// Static News
const news = ref([
  {
    id: 1,
    category: 'MATCH PREVIEW',
    title: 'NetZach FC Siap Menghadapi Laga Krusial Minggu Ini',
    date: 'JUL 28, 2026',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 2,
    category: 'SQUAD UPDATE',
    title: 'Latihan Intensif Skuad Utama Jelang Pembukaan Musim Baru',
    date: 'JUL 26, 2026',
    image: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=600&auto=format&fit=crop'
  }
])

// -------------------------------------------------------------
// 5. LIFECYCLE & FIREBASE LISTENERS
// -------------------------------------------------------------
onMounted(() => {
  // Audio Playback Listener
  playMusic()
  const handleFirstInteraction = () => {
    if (!isPlaying.value) playMusic()
    window.removeEventListener('click', handleFirstInteraction)
    window.removeEventListener('keydown', handleFirstInteraction)
    window.removeEventListener('touchstart', handleFirstInteraction)
  }
  window.addEventListener('click', handleFirstInteraction)
  window.addEventListener('keydown', handleFirstInteraction)
  window.addEventListener('touchstart', handleFirstInteraction)

  // Auth Status Observer
  onAuthStateChanged(auth, (user: User | null) => {
    isAdmin.value = !!user
  })

  // Realtime Sync Pemain dari Firestore
  onSnapshot(collection(db, 'players'), (snapshot) => {
    const fetchedPlayers: Player[] = []
    snapshot.forEach((docSnap) => {
      fetchedPlayers.push({ id: docSnap.id, ...docSnap.data() } as Player)
    })
    players.value = fetchedPlayers
  })

  // Realtime Sync Jadwal dari Firestore
  onSnapshot(collection(db, 'fixtures'), (snapshot) => {
    const fetchedFixtures: Fixture[] = []
    snapshot.forEach((docSnap) => {
      fetchedFixtures.push({ id: docSnap.id, ...docSnap.data() } as Fixture)
    })
    fixtures.value = fetchedFixtures
  })
})

const filteredPlayers = computed(() => {
  if (activeCategory.value === 'All') return players.value
  return players.value.filter(p => p.category === activeCategory.value)
})

// -------------------------------------------------------------
// 6. ADMIN & FIREBASE ACTIONS
// -------------------------------------------------------------
const handleLogin = async () => {
  try {
    loginError.value = ''
    await signInWithEmailAndPassword(auth, email.value, password.value)
    showLoginModal.value = false
    email.value = ''
    password.value = ''
  } catch (err) {
    loginError.value = 'Email atau Password Admin Salah!'
  }
}

const handleLogout = async () => {
  await signOut(auth)
  showAdminDashboard.value = false
}

// FITUR AUTO SEED 8 PEMAIN
const seedPlayersToFirebase = async () => {
  if (!confirm('Unggah 8 data pemain default ke database Firebase?')) return

  const initialPlayers: Omit<Player, 'id'>[] = [
    { name: 'IMANUEL', role: 'Goalkeeper', category: 'Keeper', photo: '', number: 12, stats: { matches: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0 } },
    { name: 'KHENICHI', role: 'Center Back', category: 'Defender', photo: '', number: 9, stats: { matches: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0 } },
    { name: 'HANSEL', role: 'Full Back', category: 'Defender', photo: '', number: 4, stats: { matches: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0 } },
    { name: 'MARLON', role: 'Center Back', category: 'Defender', photo: '', number: 24, stats: { matches: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0 } },
    { name: 'SONY', role: 'Central Midfield', category: 'Midfielder', photo: '', number: 11, stats: { matches: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0 } },
    { name: 'KETAN', role: 'Attacking Midfield', category: 'Midfielder', photo: '', number: 8, stats: { matches: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0 } },
    { name: 'VALERIO', role: 'Defensive Midfield', category: 'Midfielder', photo: '', number: 10, stats: { matches: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0 } },
    { name: 'KEVIN', role: 'Main Striker', category: 'Striker', photo: '', number: 7, stats: { matches: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0 } }
  ]

  try {
    for (const p of initialPlayers) {
      await addDoc(collection(db, 'players'), p)
    }
    alert('Berhasil! 8 Pemain telah dibuat di Firebase.')
  } catch (err) {
    alert('Gagal! Pastikan Rules Firestore sudah diset menjadi "allow read, write: if true;".')
  }
}

const savePlayerStats = async () => {
  if (!selectedPlayer.value || !selectedPlayer.value.id) return
  try {
    const playerRef = doc(db, 'players', selectedPlayer.value.id)
    await updateDoc(playerRef, {
      stats: selectedPlayer.value.stats,
      number: selectedPlayer.value.number,
      role: selectedPlayer.value.role,
      category: selectedPlayer.value.category
    })
    alert('Statistik berhasil diperbarui!')
  } catch (e) {
    console.error('Error update stats:', e)
  }
}

const addFixture = async () => {
  if (!newFixture.value.away || !newFixture.value.date) {
    alert('Isi lawan dan tanggal pertandingan terlebih dahulu!')
    return
  }
  await addDoc(collection(db, 'fixtures'), newFixture.value)
  newFixture.value = { home: 'NetZach FC', away: '', date: '', time: '19:00 WIB', status: 'UPCOMING' }
  alert('Jadwal pertandingan berhasil ditambahkan!')
}

const deleteFixture = async (id?: string) => {
  if (!id) return
  if (confirm('Hapus jadwal ini?')) {
    await deleteDoc(doc(db, 'fixtures', id))
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#0d0d0d] text-[#FFFFFF] font-sans selection:bg-[#C5A059] selection:text-black">
    <audio ref="audioRef" :src="bgMusicFile" loop></audio>

    <!-- 1. HEADER -->
    <header class="border-b border-[#C5A059]/20 bg-[#0d0d0d]/90 backdrop-blur-md sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-6 py-1.5 flex justify-between items-center text-[11px] border-b border-white/5 text-[#C5A059]/80 font-medium tracking-wider">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>OFFICIAL CLUB WEBSITE</span>
        </div>
        <div class="flex items-center gap-4">
          <button @click="toggleAudio" class="hover:text-white transition flex items-center gap-1">
            <span>{{ isPlaying ? '🔊' : '🔇' }}</span>
            <span>MUSIC {{ isPlaying ? 'ON' : 'OFF' }}</span>
          </button>
          <span class="text-gray-600">|</span>
          <button v-if="isAdmin" @click="showAdminDashboard = true" class="text-[10px] bg-[#C5A059] text-black font-black px-2 py-0.5 rounded uppercase">
            ⚙️ Admin Panel
          </button>
          <span v-if="isAdmin" class="text-gray-600">|</span>
          <a href="#" class="hover:text-white transition">INSTAGRAM</a>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
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
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#C5A059]/10 rounded-full blur-[140px] pointer-events-none"></div>

      <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
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
            <a href="#squad" class="bg-gradient-to-r from-[#C5A059] to-[#9e7d3b] text-black font-black px-8 py-3.5 rounded shadow-[0_0_25px_rgba(197,160,89,0.4)] hover:brightness-110 transition duration-300 tracking-wider text-xs uppercase">
              EXPLORE SQUAD
            </a>
            <a href="#fixtures" class="border border-white/20 hover:border-[#C5A059] text-white font-bold px-8 py-3.5 rounded hover:bg-white/5 transition duration-300 tracking-wider text-xs uppercase">
              VIEW FIXTURES
            </a>
          </div>
        </div>

        <div class="lg:col-span-5 relative flex justify-center">
          <div class="relative w-full max-w-md aspect-[3/4] rounded-2xl p-1 bg-gradient-to-b from-[#C5A059] via-[#C5A059]/20 to-transparent shadow-[0_0_50px_rgba(197,160,89,0.15)]">
            <div class="w-full h-full bg-[#141414] rounded-xl overflow-hidden relative group">
              <img :src="imgNetzach" alt="NetZach FC Spirit" class="w-full h-full object-cover filter contrast-125 brightness-90 group-hover:scale-105 transition duration-700" />
              <div class="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-transparent"></div>
              <div class="absolute bottom-6 left-6 right-6 p-4 rounded-lg bg-black/60 backdrop-blur-md border border-white/10">
                <span class="text-[10px] font-black tracking-widest text-[#C5A059] uppercase">SEASON 2026/2027</span>
                <h3 class="text-xl font-black text-white tracking-wider">THE GOLDEN SQUAD</h3>
                <p class="text-xs text-gray-400 mt-1">Klik kartu pemain untuk melihat statistik</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. SQUAD SECTION -->
    <section id="squad" class="py-24 px-6 bg-[#111111] relative border-t border-white/5">
      <div class="max-w-7xl mx-auto space-y-12">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-6">
          <div>
            <div class="text-xs font-black tracking-[0.3em] text-[#C5A059] uppercase mb-2">THE WARRIORS</div>
            <h2 class="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase">OFFICIAL SQUAD</h2>
          </div>

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

        <div v-if="players.length === 0" class="text-center py-12 bg-[#181818] rounded-2xl border border-white/5">
          <p class="text-gray-400 text-sm">Database pemain di Firebase masih kosong.</p>
          <button v-if="isAdmin" @click="seedPlayersToFirebase" class="mt-4 bg-[#C5A059] text-black font-bold px-4 py-2 rounded text-xs">
            🚀 Seed 8 Pemain Awal Sekarang
          </button>
          <p v-else class="text-xs text-gray-600 mt-2">Silahkan login sebagai admin di footer untuk mengunggah data pemain.</p>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div 
            v-for="player in filteredPlayers" 
            :key="player.id || player.name"
            @click="selectedPlayer = { ...player }"
            class="group relative bg-[#181818] border border-white/10 rounded-xl overflow-hidden hover:border-[#C5A059] transition duration-500 shadow-xl flex flex-col cursor-pointer"
          >
            <div class="h-72 overflow-hidden relative bg-black/40">
              <span class="absolute top-3 right-3 text-3xl font-black text-white/20 group-hover:text-[#C5A059] transition duration-300 z-10">
                #{{ player.number }}
              </span>

              <span class="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-[#C5A059] border border-[#C5A059]/40 text-[9px] font-black px-2.5 py-1 rounded uppercase tracking-widest z-10">
                {{ player.category }}
              </span>

              <img 
                :src="player.photo || localPhotos[player.name]" 
                :alt="player.name" 
                class="w-full h-full object-cover object-top filter grayscale contrast-110 group-hover:grayscale-0 group-hover:scale-105 transition duration-500" 
              />
              <div class="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent"></div>
            </div>

            <div class="p-5 bg-[#181818] border-t border-white/5 flex-grow flex flex-col justify-between">
              <div>
                <h3 class="text-xl font-black tracking-wider text-white group-hover:text-[#C5A059] transition duration-300">
                  {{ player.name }}
                </h3>
                <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                  {{ player.role }}
                </p>
              </div>

              <div class="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-[#C5A059] font-mono font-bold">
                <span>VIEW STATS</span>
                <span>→</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. FIXTURES & IDENTITY SECTION -->
    <section id="fixtures" class="py-24 px-6 bg-[#0d0d0d] border-t border-white/5">
      <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div class="lg:col-span-7 space-y-6">
          <div>
            <div class="text-xs font-black tracking-[0.3em] text-[#C5A059] uppercase mb-2">MATCH CENTER</div>
            <h2 class="text-3xl font-black tracking-tight text-white uppercase">UPCOMING FIXTURES</h2>
          </div>

          <div v-if="fixtures.length === 0" class="p-12 rounded-xl bg-[#141414] border border-white/5 text-center space-y-2">
            <div class="text-3xl">⚽</div>
            <h3 class="text-base font-bold text-white uppercase">NO UPCOMING MATCHES</h3>
            <p class="text-xs text-gray-500">Belum ada jadwal pertandingan yang ditambahkan.</p>
          </div>

          <div v-else class="space-y-4">
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

        <div id="colors" class="lg:col-span-5 space-y-6 bg-[#141414] p-8 rounded-2xl border border-white/5">
          <div>
            <div class="text-xs font-black tracking-[0.3em] text-[#C5A059] uppercase mb-2">OUR IDENTITY</div>
            <h2 class="text-3xl font-black tracking-tight text-white uppercase">THE COLORS</h2>
          </div>

          <p class="text-xs text-gray-400 leading-relaxed">
            Hitam mewakili kekuatan dan dominasi tanpa kompromi, Emas menyimbolkan kejayaan dan supremasi tertinggi, sedangkan Putih melambangkan integritas murni.
          </p>

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

    <!-- 5. NEWS SECTION -->
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

        <div class="flex flex-col items-end gap-1">
          <p class="text-[11px]">© 2026 NETZACH FOOTBALL CLUB.</p>
          <button v-if="!isAdmin" @click="showLoginModal = true" class="text-[10px] text-gray-600 hover:text-[#C5A059] transition underline">
            Admin Login
          </button>
          <button v-else @click="handleLogout" class="text-[10px] text-red-500 hover:underline">
            Logout Admin
          </button>
        </div>
      </div>
    </footer>

    <!-- MODAL STATS PEMAIN -->
    <div v-if="selectedPlayer" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div class="bg-[#141414] border border-[#C5A059]/40 rounded-2xl w-full max-w-md p-6 relative overflow-hidden shadow-2xl">
        <button @click="selectedPlayer = null" class="absolute top-4 right-4 text-gray-400 hover:text-white font-bold text-lg">✕</button>
        
        <div class="flex items-center gap-4 border-b border-white/10 pb-4">
          <img :src="selectedPlayer.photo || localPhotos[selectedPlayer.name]" class="w-16 h-16 rounded-full object-cover border border-[#C5A059]" />
          <div>
            <span class="text-xs text-[#C5A059] font-bold">#{{ selectedPlayer.number }} • {{ selectedPlayer.category }}</span>
            <h3 class="text-2xl font-black text-white">{{ selectedPlayer.name }}</h3>
            <p class="text-xs text-gray-400">{{ selectedPlayer.role }}</p>
          </div>
        </div>

        <!-- STATS DISPLAY -->
        <div class="grid grid-cols-2 gap-3 py-6">
          <div class="bg-black/50 p-3 rounded-lg border border-white/5 text-center">
            <span class="text-[10px] text-gray-400 font-bold block">MATCHES PLAYED</span>
            <span class="text-xl font-black text-white">{{ selectedPlayer.stats?.matches || 0 }}</span>
          </div>
          <div class="bg-black/50 p-3 rounded-lg border border-white/5 text-center">
            <span class="text-[10px] text-gray-400 font-bold block">GOALS</span>
            <span class="text-xl font-black text-[#C5A059]">{{ selectedPlayer.stats?.goals || 0 }}</span>
          </div>
          <div class="bg-black/50 p-3 rounded-lg border border-white/5 text-center">
            <span class="text-[10px] text-gray-400 font-bold block">ASSISTS</span>
            <span class="text-xl font-black text-white">{{ selectedPlayer.stats?.assists || 0 }}</span>
          </div>
          <div class="bg-black/50 p-3 rounded-lg border border-white/5 text-center">
            <span class="text-[10px] text-gray-400 font-bold block">YELLOW / RED CARDS</span>
            <span class="text-xl font-black text-amber-500">{{ selectedPlayer.stats?.yellowCards || 0 }} / {{ selectedPlayer.stats?.redCards || 0 }}</span>
          </div>
        </div>

        <!-- JIKA ADMIN LOGGED IN: EDIT STATS -->
        <div v-if="isAdmin" class="border-t border-white/10 pt-4 space-y-3 bg-white/5 p-4 rounded-xl">
          <h4 class="text-xs font-bold text-[#C5A059] uppercase">Edit Stats (Admin Mode)</h4>
          <div v-if="selectedPlayer.stats" class="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label class="text-[10px] text-gray-400">Matches</label>
              <input v-model.number="selectedPlayer.stats.matches" type="number" class="w-full bg-black border border-white/20 p-1.5 rounded text-white" />
            </div>
            <div>
              <label class="text-[10px] text-gray-400">Goals</label>
              <input v-model.number="selectedPlayer.stats.goals" type="number" class="w-full bg-black border border-white/20 p-1.5 rounded text-white" />
            </div>
            <div>
              <label class="text-[10px] text-gray-400">Assists</label>
              <input v-model.number="selectedPlayer.stats.assists" type="number" class="w-full bg-black border border-white/20 p-1.5 rounded text-white" />
            </div>
            <div>
              <label class="text-[10px] text-gray-400">Yellow Cards</label>
              <input v-model.number="selectedPlayer.stats.yellowCards" type="number" class="w-full bg-black border border-white/20 p-1.5 rounded text-white" />
            </div>
          </div>
          <button @click="savePlayerStats" class="w-full bg-[#C5A059] text-black font-black py-2 rounded text-xs uppercase tracking-wider">
            Simpan Perubahan Stats
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL LOGIN ADMIN -->
    <div v-if="showLoginModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div class="bg-[#141414] border border-[#C5A059]/40 rounded-2xl w-full max-w-sm p-6 relative shadow-2xl">
        <button @click="showLoginModal = false" class="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
        
        <h3 class="text-xl font-black text-white uppercase tracking-wider mb-4">Admin Login</h3>
        <p v-if="loginError" class="text-xs text-red-500 mb-3">{{ loginError }}</p>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="text-xs text-gray-400 block mb-1">Email Admin</label>
            <input v-model="email" type="email" required class="w-full bg-black border border-white/20 p-2 rounded text-xs text-white" />
          </div>
          <div>
            <label class="text-xs text-gray-400 block mb-1">Password</label>
            <input v-model="password" type="password" required class="w-full bg-black border border-white/20 p-2 rounded text-xs text-white" />
          </div>
          <button type="submit" class="w-full bg-[#C5A059] text-black font-black py-2.5 rounded text-xs uppercase tracking-wider">
            LOGIN
          </button>
        </form>
      </div>
    </div>

    <!-- MODAL DASHBOARD ADMIN (KELOLA FIXTURES & SQUAD) -->
    <div v-if="showAdminDashboard" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div class="bg-[#141414] border border-[#C5A059]/40 rounded-2xl w-full max-w-2xl p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto">
        <button @click="showAdminDashboard = false" class="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
        
        <h3 class="text-2xl font-black text-white uppercase tracking-wider mb-6 flex items-center gap-2">
          ⚙️ ADMIN DASHBOARD
        </h3>

        <!-- BAGIAN 1: SEED SQUAD -->
        <div class="bg-black/40 p-4 rounded-xl border border-white/10 mb-6">
          <h4 class="text-sm font-bold text-[#C5A059] uppercase mb-2">1. Kelola Skuad Pemain</h4>
          <p class="text-xs text-gray-400 mb-3">Jika database pemain masih kosong, klik tombol di bawah untuk mengisi 8 pemain bawaan:</p>
          <button @click="seedPlayersToFirebase" class="bg-[#C5A059] text-black font-bold px-4 py-2 rounded text-xs uppercase tracking-wider">
            🚀 Seed 8 Pemain Awal
          </button>
        </div>

        <!-- BAGIAN 2: TAMBAH JADWAL (FIXTURES) -->
        <div class="bg-black/40 p-4 rounded-xl border border-white/10 mb-6">
          <h4 class="text-sm font-bold text-[#C5A059] uppercase mb-3">2. Tambah Jadwal Pertandingan Baru</h4>
          <form @submit.prevent="addFixture" class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label class="text-gray-400 block mb-1">Tim Kandang (Home)</label>
              <input v-model="newFixture.home" type="text" required class="w-full bg-black border border-white/20 p-2 rounded text-white" />
            </div>
            <div>
              <label class="text-gray-400 block mb-1">Tim Tandang (Away)</label>
              <input v-model="newFixture.away" type="text" placeholder="Misal: Garuda FC" required class="w-full bg-black border border-white/20 p-2 rounded text-white" />
            </div>
            <div>
              <label class="text-gray-400 block mb-1">Tanggal Pertandingan</label>
              <input v-model="newFixture.date" type="text" placeholder="Misal: AUG 15, 2026" required class="w-full bg-black border border-white/20 p-2 rounded text-white" />
            </div>
            <div>
              <label class="text-gray-400 block mb-1">Waktu</label>
              <input v-model="newFixture.time" type="text" placeholder="Misal: 19:00 WIB" required class="w-full bg-black border border-white/20 p-2 rounded text-white" />
            </div>
            <div class="sm:col-span-2">
              <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded uppercase tracking-wider transition mt-2">
                + Tambahkan Jadwal
              </button>
            </div>
          </form>
        </div>

        <!-- BAGIAN 3: DAFTAR JADWAL TERPASANG -->
        <div class="bg-black/40 p-4 rounded-xl border border-white/10">
          <h4 class="text-sm font-bold text-[#C5A059] uppercase mb-3">3. Daftar Jadwal Saat Ini</h4>
          <div v-if="fixtures.length === 0" class="text-xs text-gray-500">Belum ada jadwal.</div>
          <div v-else class="space-y-2">
            <div v-for="f in fixtures" :key="f.id" class="flex items-center justify-between bg-black/60 p-2.5 rounded border border-white/5 text-xs">
              <div>
                <span class="font-bold text-white">{{ f.home }} VS {{ f.away }}</span>
                <span class="text-gray-400 ml-2">({{ f.date }} - {{ f.time }})</span>
              </div>
              <button @click="deleteFixture(f.id)" class="text-red-400 hover:text-red-300 font-bold px-2 py-1 bg-red-500/10 rounded">
                Hapus
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>