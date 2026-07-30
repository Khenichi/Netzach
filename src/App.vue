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
// Change #1 & #6: Hanya menggunakan general position, tanpa detail role
type GeneralPosition = 'Keeper' | 'Defender' | 'Midfielder' | 'Forward'

// Change #4 & #5: Model statistik per pertandingan
interface MatchPlayerStat {
  playerId: string
  playerName: string
  goals: number
  assists: number
  goalsConceded?: number // Change #9: Khusus GK
  rating: number
  minutesPlayed?: number
}

interface Player {
  id?: string
  name: string
  category: GeneralPosition // Posisi General saja
  photo: string
  number: number
  // Riwayat match stats untuk kalkulasi otomatis (Change #5)
  matchHistory?: MatchPlayerStat[]
}

interface Fixture {
  id?: string
  home: string
  away: string
  date: string
  time: string
  status: 'NEXT MATCH' | 'UPCOMING' | 'FINISHED'
  matchStats?: MatchPlayerStat[] // Change #4: Stats per game
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
import imgAcel from '/src/assets/Screenshot 2026-07-30 151858.png'
import imgNetzach from '/src/assets/Screenshot 2026-07-28 103255.png'

const localPhotos: Record<string, string> = {
  'KEVIN IMANUEL': imgImanuel,
  'KHENICHI': imgKhenichi,
  'HANSEL': imgHansel,
  'MARLON': imgMarlon,
  'SONY': imgSony,
  'KEVIN TAN': imgKetan,
  'VALERIO': imgValerio,
  'KEVIN': imgKevin,
  'AXEL': imgAcel
}

// -------------------------------------------------------------
// 4. STATES & REFS
// -------------------------------------------------------------
const activeCategory = ref<string>('All')
const selectedPlayer = ref<Player | null>(null)
const selectedFixtureStats = ref<Fixture | null>(null) // Modal match stats (Change #4)

// Loading State Universal
const isLoading = ref<boolean>(false)

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
  status: 'UPCOMING',
  matchStats: []
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
// 5. HELPER COMPUTED: AGGREGATE PLAYER STATS (Change #5 & #9)
// -------------------------------------------------------------
const getPlayerComputedStats = (player: Player) => {
  if (!player.matchHistory || player.matchHistory.length === 0) {
    return { matches: 0, goals: 0, assists: 0, rating: 0, goalsConceded: 0 }
  }

  const matches = player.matchHistory.length
  const goals = player.matchHistory.reduce((acc, curr) => acc + (curr.goals || 0), 0)
  const assists = player.matchHistory.reduce((acc, curr) => acc + (curr.assists || 0), 0)
  const goalsConceded = player.matchHistory.reduce((acc, curr) => acc + (curr.goalsConceded || 0), 0)
  
  const totalRating = player.matchHistory.reduce((acc, curr) => acc + (curr.rating || 0), 0)
  const avgRating = matches > 0 ? parseFloat((totalRating / matches).toFixed(1)) : 0

  return { matches, goals, assists, rating: avgRating, goalsConceded }
}

// -------------------------------------------------------------
// 6. LIFECYCLE & FIREBASE LISTENERS
// -------------------------------------------------------------
onMounted(() => {
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

  onAuthStateChanged(auth, (user: User | null) => {
    isAdmin.value = !!user
  })

  onSnapshot(collection(db, 'players'), (snapshot) => {
    const fetchedPlayers: Player[] = []
    snapshot.forEach((docSnap) => {
      fetchedPlayers.push({ id: docSnap.id, ...docSnap.data() } as Player)
    })
    players.value = fetchedPlayers
  })

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
// 7. ACTIONS & METHODS
// -------------------------------------------------------------
const handleLogin = async () => {
  isLoading.value = true
  try {
    loginError.value = ''
    await signInWithEmailAndPassword(auth, email.value, password.value)
    showLoginModal.value = false
    email.value = ''
    password.value = ''
  } catch (err) {
    loginError.value = 'Email atau Password Admin Salah!'
  } finally {
    isLoading.value = false
  }
}

const handleLogout = async () => {
  await signOut(auth)
  showAdminDashboard.value = false
}

// Change #7 & #8: Seed data dengan nama baru (Kevin Imanuel & Kevin Tan) serta penambahan Ko Acel
const seedPlayersToFirebase = async () => {
  if (!confirm('Unggah data pemain default ke database Firebase?')) return

  isLoading.value = true
  const initialPlayers: Omit<Player, 'id'>[] = [
    { name: 'KEVIN IMANUEL', category: 'Keeper', photo: '', number: 12, matchHistory: [] },
    { name: 'KHENICHI', category: 'Keeper', photo: '', number: 9, matchHistory: [] },
    { name: 'HANSEL', category: 'Defender', photo: '', number: 4, matchHistory: [] },
    { name: 'MARLON', category: 'Defender', photo: '', number: 24, matchHistory: [] },
    { name: 'ACEL', category: 'Defender', photo: '', number: 15, matchHistory: [] }, // Change #7
    { name: 'SONY', category: 'Midfielder', photo: '', number: 11, matchHistory: [] },
    { name: 'KEVIN TAN', category: 'Midfielder', photo: '', number: 8, matchHistory: [] },
    { name: 'VALERIO', category: 'Midfielder', photo: '', number: 10, matchHistory: [] },
    { name: 'KEVIN', category: 'Forward', photo: '', number: 7, matchHistory: [] }
  ]

  try {
    for (const p of initialPlayers) {
      await addDoc(collection(db, 'players'), p)
    }
    alert('Berhasil! Data Pemain telah diperbarui di Firebase.')
  } catch (err) {
    alert('Gagal! Pastikan Rules Firestore sudah dikonfigurasi.')
  } finally {
    isLoading.value = false
  }
}

// Navigasi Otomatis dari Stats Fixture ke Modal Player (Change #4)
const openPlayerFromFixture = (playerId: string) => {
  const found = players.value.find(p => p.id === playerId || p.name === playerId)
  if (found) {
    selectedFixtureStats.value = null
    selectedPlayer.value = JSON.parse(JSON.stringify(found))
  }
}

const addFixture = async () => {
  if (!newFixture.value.away || !newFixture.value.date) {
    alert('Isi lawan dan tanggal pertandingan terlebih dahulu!')
    return
  }
  isLoading.value = true
  try {
    await addDoc(collection(db, 'fixtures'), { ...newFixture.value, matchStats: [] })
    newFixture.value = { home: 'NetZach FC', away: '', date: '', time: '19:00 WIB', status: 'UPCOMING', matchStats: [] }
    alert('Jadwal pertandingan berhasil ditambahkan!')
  } catch (err) {
    alert('Gagal menambahkan jadwal.')
  } finally {
    isLoading.value = false
  }
}

const editingFixture = ref<Fixture | null>(null)

const updateFixtureStatus = async (fixture: Fixture, newStatus: 'NEXT MATCH' | 'UPCOMING' | 'FINISHED') => {
  if (!fixture.id) return
  isLoading.value = true
  try {
    const fixtureRef = doc(db, 'fixtures', fixture.id)
    await updateDoc(fixtureRef, { status: newStatus })
  } catch (err) {
    console.error('Error update status:', err)
    alert('Gagal mengupdate status pertandingan.')
  } finally {
    isLoading.value = false
  }
}

const editFixture = (fixture: Fixture) => {
  editingFixture.value = JSON.parse(JSON.stringify(fixture))
  if (!editingFixture.value?.matchStats) {
    editingFixture.value!.matchStats = []
  }
}

// Menyimpan Statistik Game & Menyingkronkannya ke Player Match History (Change #4 & #5)
const saveEditedFixture = async () => {
  if (!editingFixture.value || !editingFixture.value.id) return
  isLoading.value = true
  try {
    const fixtureRef = doc(db, 'fixtures', editingFixture.value.id)
    await updateDoc(fixtureRef, {
      home: editingFixture.value.home,
      away: editingFixture.value.away,
      date: editingFixture.value.date,
      time: editingFixture.value.time,
      status: editingFixture.value.status,
      matchStats: editingFixture.value.matchStats || []
    })

    // Auto-update match history pada setiap player
    if (editingFixture.value.matchStats) {
      for (const stat of editingFixture.value.matchStats) {
        const targetPlayer = players.value.find(p => p.id === stat.playerId || p.name === stat.playerName)
        if (targetPlayer && targetPlayer.id) {
          let history = targetPlayer.matchHistory || []
          // Hapus record lama jika fixture sudah pernah tersimpan
          history = history.filter(h => h.playerId !== editingFixture.value?.id)
          history.push({ ...stat, playerId: editingFixture.value.id! })
          
          await updateDoc(doc(db, 'players', targetPlayer.id), {
            matchHistory: history
          })
        }
      }
    }

    editingFixture.value = null
    alert('Jadwal & Statistik Pertandingan berhasil diperbarui!')
  } catch (err) {
    console.error('Error update fixture:', err)
    alert('Gagal memperbarui pertandingan.')
  } finally {
    isLoading.value = false
  }
}

const addPlayerStatToFixture = () => {
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

const removePlayerStatFromFixture = (index: number) => {
  if (editingFixture.value && editingFixture.value.matchStats) {
    editingFixture.value.matchStats.splice(index, 1)
  }
}

const deleteFixture = async (id?: string) => {
  if (!id) return
  if (confirm('Hapus jadwal ini?')) {
    isLoading.value = true
    try {
      await deleteDoc(doc(db, 'fixtures', id))
    } finally {
      isLoading.value = false
    }
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#0d0d0d] text-[#FFFFFF] font-sans selection:bg-[#C5A059] selection:text-black">
    <audio ref="audioRef" :src="bgMusicFile" loop></audio>

    <!-- 1. HEADER -->
    <header class="border-b border-[#C5A059]/20 bg-[#0d0d0d]/90 backdrop-blur-md sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-6 py-2 flex justify-between items-center text-[11px] border-b border-white/5 text-[#C5A059]/80 font-medium tracking-wider">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>OFFICIAL CLUB WEBSITE</span>
        </div>
        
        <div class="flex items-center gap-4">
          <!-- Change #3: Link Instagram Resmi -->
          <a 
            href="https://www.instagram.com/netzach.fc?igsh=MWhyZWJmMTdnZnJyZg==" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="hover:text-white transition flex items-center gap-1 text-[#C5A059]"
          >
            <span>INSTAGRAM</span>
            <span>↗</span>
          </a>
          <button @click="toggleAudio" class="hover:text-white transition flex items-center gap-1">
            <span>MUSIC {{ isPlaying ? 'ON' : 'OFF' }}</span>
            <span>{{ isPlaying ? '🔊' : '🔇' }}</span>
          </button>
          <button v-if="!isAdmin" @click="showLoginModal = true" class="hover:text-white transition">ADMIN LOGIN</button>
          <button v-else @click="handleLogout" class="text-red-400 hover:text-red-300 transition">LOGOUT</button>
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

        <!-- Change #2: Menu Navigasi IDENTITY diubah menjadi ABOUT US -->
        <nav class="hidden lg:flex items-center gap-8 text-xs font-bold tracking-[0.15em]">
          <a href="#" class="text-[#C5A059] border-b-2 border-[#C5A059] pb-1">HOME</a>
          <a href="#squad" class="text-gray-300 hover:text-[#C5A059] transition pb-1">SQUAD</a>
          <a href="#fixtures" class="text-gray-300 hover:text-[#C5A059] transition pb-1">FIXTURES</a>
          <a href="#about" class="text-gray-300 hover:text-[#C5A059] transition pb-1">ABOUT US</a>
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
                <p class="text-xs text-gray-400 mt-1">Klik kartu pemain untuk melihat statistik detail</p>
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

          <!-- Change #1: Kategori Filter General Position -->
          <div class="flex flex-wrap gap-2">
            <button 
              v-for="cat in ['All', 'Keeper', 'Defender', 'Midfielder', 'Forward']" 
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
          <button v-if="isAdmin" @click="seedPlayersToFirebase" :disabled="isLoading" class="mt-4 bg-[#C5A059] text-black font-bold px-4 py-2 rounded text-xs hover:brightness-110 flex items-center gap-2 mx-auto">
            <span v-if="isLoading" class="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
            <span>🚀 Seed Pemain Awal Sekarang</span>
          </button>
        </div>

        <!-- PLAYER CARDS GRID -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div 
            v-for="player in filteredPlayers" 
            :key="player.id || player.name"
            @click="selectedPlayer = JSON.parse(JSON.stringify(player))"
            class="group relative bg-[#181818] border border-white/10 rounded-xl overflow-hidden hover:border-[#C5A059] transition duration-500 shadow-xl flex flex-col cursor-pointer"
          >
            <div class="h-72 overflow-hidden relative bg-black/40">
              <!-- NOMOR PUNGGUNG -->
              <span class="absolute top-3 right-3 text-3xl font-black text-white/20 group-hover:text-[#C5A059]/40 transition duration-300 z-10">
                #{{ player.number }}
              </span>

              <!-- KATEGORI POSISI (GENERAL) -->
              <span class="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-[#C5A059] border border-[#C5A059]/40 text-[9px] font-black px-2.5 py-1 rounded uppercase tracking-widest z-10">
                {{ player.category }}
              </span>

              <!-- RATING RATA-RATA AUTO CALCULATED (Change #5) -->
              <div class="absolute bottom-3 left-3 z-10 bg-gradient-to-r from-[#C5A059] to-[#9e7d3b] text-black px-2.5 py-1 rounded-md flex items-center gap-1 shadow-lg border border-[#f3e0aa]/40">
                <span class="text-[9px] font-black tracking-tighter uppercase">AVG RATING</span>
                <span class="text-xs font-black font-mono leading-none">
                  {{ getPlayerComputedStats(player).rating }}
                </span>
              </div>

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
              </div>

              <!-- Change #5 & #9: Mini Stats (Auto Aggregate) -->
              <div class="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-gray-400 font-mono">
                <div class="flex items-center gap-2.5">
                  <span><b class="text-white">{{ getPlayerComputedStats(player).matches }}</b> M</span>
                  <span><b class="text-[#C5A059]">{{ getPlayerComputedStats(player).goals }}</b> G</span>
                  <span><b class="text-white">{{ getPlayerComputedStats(player).assists }}</b> A</span>
                  <!-- Change #9: Khusus GK Tampilkan Goal Conceded -->
                  <span v-if="player.category === 'Keeper'" class="text-red-400">
                    <b>{{ getPlayerComputedStats(player).goalsConceded }}</b> GC
                  </span>
                </div>
                <span class="text-[#C5A059] font-bold group-hover:translate-x-1 transition">SEE DETAILS →</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. FIXTURES & ABOUT US SECTION -->
    <section id="fixtures" class="py-24 px-6 bg-[#0d0d0d] border-t border-white/5">
      <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        <!-- MATCH CENTER -->
        <div class="lg:col-span-7 space-y-6">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-xs font-black tracking-[0.3em] text-[#C5A059] uppercase mb-2">MATCH CENTER</div>
              <h2 class="text-3xl font-black tracking-tight text-white uppercase">UPCOMING FIXTURES</h2>
            </div>
          </div>

          <!-- FORM TAMBAH JADWAL (ADMIN ONLY) -->
          <div v-if="isAdmin" class="p-5 rounded-xl bg-[#141414] border border-[#C5A059]/40 space-y-4 shadow-lg relative overflow-hidden">
            <div class="absolute top-0 left-0 w-1 h-full bg-[#C5A059]"></div>
            
            <div class="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 class="text-xs font-black text-[#C5A059] uppercase tracking-wider flex items-center gap-2">
                TAMBAH JADWAL PERTANDINGAN BARU
              </h3>
              <span class="text-[10px] bg-[#C5A059]/20 text-[#C5A059] px-2 py-0.5 rounded font-mono font-bold">ADMIN PANEL</span>
            </div>

            <form @submit.prevent="addFixture" class="space-y-3">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="text-[10px] text-gray-400 font-bold block mb-1">TIM TANDANG (AWAY TEAM)</label>
                  <input 
                    v-model="newFixture.away" 
                    type="text" 
                    placeholder="Contoh: Garuda FC" 
                    required 
                    class="w-full bg-black border border-white/20 p-2.5 rounded text-xs text-white focus:border-[#C5A059] outline-none" 
                  />
                </div>

                <div>
                  <label class="text-[10px] text-gray-400 font-bold block mb-1">TANGGAL PERTANDINGAN</label>
                  <input 
                    v-model="newFixture.date" 
                    type="text" 
                    placeholder="Contoh: AUG 15, 2026" 
                    required 
                    class="w-full bg-black border border-white/20 p-2.5 rounded text-xs text-white focus:border-[#C5A059] outline-none" 
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="text-[10px] text-gray-400 font-bold block mb-1">WAKTU (KICK OFF)</label>
                  <input 
                    v-model="newFixture.time" 
                    type="text" 
                    placeholder="19:00 WIB" 
                    required 
                    class="w-full bg-black border border-white/20 p-2.5 rounded text-xs text-white focus:border-[#C5A059] outline-none" 
                  />
                </div>

                <div>
                  <label class="text-[10px] text-gray-400 font-bold block mb-1">STATUS MATCH</label>
                  <select 
                    v-model="newFixture.status" 
                    class="w-full bg-black border border-white/20 p-2.5 rounded text-xs text-white focus:border-[#C5A059] outline-none"
                  >
                    <option value="NEXT MATCH">NEXT MATCH</option>
                    <option value="UPCOMING">UPCOMING</option>
                    <option value="FINISHED">FINISHED</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                :disabled="isLoading" 
                class="w-full bg-[#C5A059] hover:brightness-110 text-black font-black py-2.5 rounded text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 mt-2"
              >
                <span v-if="isLoading" class="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                <span>{{ isLoading ? 'Menyimpan...' : 'POST JADWAL PERTANDINGAN' }}</span>
              </button>
            </form>
          </div>

          <!-- DAFTAR FIXTURES -->
          <div v-if="fixtures.length === 0" class="p-12 rounded-xl bg-[#141414] border border-white/5 text-center space-y-2">
            <h3 class="text-base font-bold text-white uppercase">NO UPCOMING MATCHES</h3>
            <p class="text-xs text-gray-500">Belum ada jadwal pertandingan yang ditambahkan.</p>
          </div>

          <div v-else class="space-y-4">
            <div 
              v-for="fixture in fixtures" 
              :key="fixture.id"
              class="p-5 rounded-xl bg-[#141414] border border-white/5 hover:border-[#C5A059]/50 transition duration-300 flex flex-col sm:flex-row items-center justify-between gap-4 relative group"
            >
              <div class="text-center sm:text-left flex flex-col items-center sm:items-start">
                <template v-if="isAdmin">
                  <select 
                    :value="fixture.status"
                    @change="updateFixtureStatus(fixture, ($event.target as HTMLSelectElement).value as any)"
                    class="text-[10px] font-black px-2 py-1 rounded bg-black text-[#C5A059] border border-[#C5A059]/50 cursor-pointer outline-none focus:border-white"
                  >
                    <option value="NEXT MATCH">NEXT MATCH</option>
                    <option value="UPCOMING">UPCOMING</option>
                    <option value="FINISHED">FINISHED</option>
                  </select>
                </template>

                <span v-else class="text-[10px] font-black px-2 py-0.5 rounded bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30">
                  {{ fixture.status }}
                </span>

                <div class="text-xs font-bold text-gray-400 mt-2">{{ fixture.date }} • {{ fixture.time }}</div>
              </div>

              <!-- TEAM MATCH VS -->
              <div class="flex items-center gap-4 text-base font-black tracking-wider">
                <span class="text-white text-right min-w-[100px]">{{ fixture.home }}</span>
                <span class="px-3 py-1 bg-[#C5A059] text-black text-xs font-black rounded">VS</span>
                <span class="text-white text-left min-w-[100px]">{{ fixture.away }}</span>
              </div>

              <!-- Change #4: Tombol Stats Per Game -->
              <div class="flex items-center gap-2">
                <button 
                  @click="selectedFixtureStats = fixture" 
                  class="bg-white/10 hover:bg-[#C5A059] text-white hover:text-black px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1"
                >
                  <span>📊 Stats</span>
                </button>

                <template v-if="isAdmin">
                  <button 
                    @click="editFixture(fixture)" 
                    class="bg-[#C5A059]/20 hover:bg-[#C5A059] text-[#C5A059] hover:text-black p-1.5 rounded text-xs transition font-bold"
                  >
                    Edit
                  </button>
                  <button 
                    @click="deleteFixture(fixture.id)" 
                    class="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white p-1.5 rounded text-xs transition font-bold"
                  >
                    Delete
                  </button>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- Change #2: ABOUT US (Substitusi dari IDENTITY) -->
        <div id="about" class="lg:col-span-5 space-y-6 bg-[#141414] p-8 rounded-2xl border border-white/5 h-fit">
          <div>
            <div class="text-xs font-black tracking-[0.3em] text-[#C5A059] uppercase mb-2">ABOUT US</div>
            <h2 class="text-3xl font-black tracking-tight text-white uppercase">NETZACH FC</h2>
          </div>

          <p class="text-xs text-gray-400 leading-relaxed">
            NetZach FC didirikan dengan semangat keberanian, solidaritas, dan dedikasi penuh di lapangan hijau. Kami percaya pada kombinasi kerja keras, disiplin taktis, dan rasa saling percaya di antara setiap pemain.
          </p>

          <div class="border-t border-white/10 pt-4 space-y-3">
            <h4 class="text-xs font-black text-[#C5A059] uppercase tracking-wider">WARNA KEBANGGAAN</h4>
            <div class="grid grid-cols-3 gap-3">
              <div class="p-3 rounded-lg bg-[#0d0d0d] border border-white/10 text-center">
                <div class="w-full h-6 rounded bg-[#121212] border border-white/20 mb-2"></div>
                <div class="text-[10px] font-black text-white">HITAM</div>
                <div class="text-[8px] text-gray-500 font-mono">Kekuatan</div>
              </div>

              <div class="p-3 rounded-lg bg-[#0d0d0d] border border-white/10 text-center">
                <div class="w-full h-6 rounded bg-[#C5A059] mb-2"></div>
                <div class="text-[10px] font-black text-[#C5A059]">EMAS</div>
                <div class="text-[8px] text-gray-500 font-mono">Kejayaan</div>
              </div>

              <div class="p-3 rounded-lg bg-[#0d0d0d] border border-white/10 text-center">
                <div class="w-full h-6 rounded bg-white mb-2"></div>
                <div class="text-[10px] font-black text-white">PUTIH</div>
                <div class="text-[8px] text-gray-500 font-mono">Integritas</div>
              </div>
            </div>
          </div>

          <!-- Change #3: Official Social Media Link -->
          <div class="border-t border-white/10 pt-4">
            <a 
              href="https://www.instagram.com/netzach.fc?igsh=MWhyZWJmMTdnZnJyZg==" 
              target="_blank"
              rel="noopener noreferrer"
              class="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white font-bold py-2.5 px-4 rounded-lg text-xs flex items-center justify-center gap-2 hover:opacity-90 transition"
            >
              <span>FOLLOW INSTAGRAM @NETZACH.FC</span>
              <span>↗</span>
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- 5. MODAL DETAIL STATISTIK PEMAIN (Change #5 & #9) -->
    <div v-if="selectedPlayer" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div class="bg-[#141414] border border-[#C5A059]/40 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        <div class="p-6 border-b border-white/10 flex justify-between items-center bg-black/40">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full overflow-hidden border-2 border-[#C5A059] bg-black">
              <img :src="selectedPlayer.photo || localPhotos[selectedPlayer.name]" class="w-full h-full object-cover" />
            </div>
            <div>
              <span class="text-[10px] font-black text-[#C5A059] uppercase tracking-widest">
                #{{ selectedPlayer.number }} • {{ selectedPlayer.category }}
              </span>
              <h3 class="text-2xl font-black text-white uppercase leading-none mt-1">
                {{ selectedPlayer.name }}
              </h3>
            </div>
          </div>
          <button @click="selectedPlayer = null" class="text-gray-400 hover:text-white text-xl font-bold p-2">✕</button>
        </div>

        <div class="p-6 space-y-6 overflow-y-auto flex-grow">
          <!-- RINGKASAN STATS AGREGAT (Otomatis dari matchHistory) -->
          <div>
            <h4 class="text-xs font-black text-[#C5A059] uppercase tracking-widest mb-3">OVERALL CAREER STATS</h4>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div class="bg-black/50 p-3 rounded-lg border border-white/10 text-center">
                <div class="text-xs text-gray-400">MATCHES</div>
                <div class="text-xl font-black text-white">{{ getPlayerComputedStats(selectedPlayer).matches }}</div>
              </div>
              <div class="bg-black/50 p-3 rounded-lg border border-white/10 text-center">
                <div class="text-xs text-gray-400">TOTAL GOALS</div>
                <div class="text-xl font-black text-[#C5A059]">{{ getPlayerComputedStats(selectedPlayer).goals }}</div>
              </div>
              <div class="bg-black/50 p-3 rounded-lg border border-white/10 text-center">
                <div class="text-xs text-gray-400">ASSISTS</div>
                <div class="text-xl font-black text-white">{{ getPlayerComputedStats(selectedPlayer).assists }}</div>
              </div>
              <div class="bg-black/50 p-3 rounded-lg border border-white/10 text-center">
                <div class="text-xs text-gray-400">AVG RATING</div>
                <div class="text-xl font-black text-emerald-400">{{ getPlayerComputedStats(selectedPlayer).rating }}</div>
              </div>
            </div>

            <!-- Change #9: Jika Goalkeeper Tampilkan Total Goal Conceded -->
            <div v-if="selectedPlayer.category === 'Keeper'" class="mt-3 bg-red-950/30 p-3 rounded-lg border border-red-500/30 text-center font-mono">
              <div class="text-xs text-red-400">GOAL CONCEDED (KEBOBOLAN)</div>
              <div class="text-2xl font-black text-red-500">{{ getPlayerComputedStats(selectedPlayer).goalsConceded }}</div>
            </div>
          </div>

          <!-- RIWAYAT STATS PER PERTANDINGAN -->
          <div>
            <h4 class="text-xs font-black text-[#C5A059] uppercase tracking-widest mb-3">MATCH-BY-MATCH BREAKDOWN</h4>
            <div v-if="!selectedPlayer.matchHistory || selectedPlayer.matchHistory.length === 0" class="text-xs text-gray-500 text-center py-6 bg-black/30 rounded-lg">
              Belum ada data pertandingan tercatat.
            </div>
            <div v-else class="space-y-2">
              <div 
                v-for="(history, idx) in selectedPlayer.matchHistory" 
                :key="idx" 
                class="bg-black/40 p-3 rounded-lg border border-white/5 flex items-center justify-between text-xs"
              >
                <div>
                  <div class="font-bold text-white">MATCH #{{ idx + 1 }}</div>
                  <div class="text-[10px] text-gray-500 font-mono">{{ history.minutesPlayed || 90 }} Mins Played</div>
                </div>
                <div class="flex items-center gap-4 font-mono">
                  <span>⚽ <b class="text-[#C5A059]">{{ history.goals }}</b></span>
                  <span>🅰️ <b class="text-white">{{ history.assists }}</b></span>
                  <span v-if="selectedPlayer.category === 'Keeper'" class="text-red-400">
                    🧤 <b>{{ history.goalsConceded || 0 }}</b>
                  </span>
                  <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">★ {{ history.rating }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 6. MODAL FIXTURE STATS PER GAME (Change #4) -->
    <div v-if="selectedFixtureStats" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div class="bg-[#141414] border border-[#C5A059]/40 w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl relative">
        <div class="p-6 border-b border-white/10 flex justify-between items-center bg-black/40">
          <div>
            <span class="text-[10px] font-black text-[#C5A059] uppercase tracking-widest">
              {{ selectedFixtureStats.date }} • {{ selectedFixtureStats.time }}
            </span>
            <h3 class="text-xl font-black text-white uppercase mt-1">
              {{ selectedFixtureStats.home }} VS {{ selectedFixtureStats.away }}
            </h3>
          </div>
          <button @click="selectedFixtureStats = null" class="text-gray-400 hover:text-white text-xl font-bold p-2">✕</button>
        </div>

        <div class="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <h4 class="text-xs font-black text-[#C5A059] uppercase tracking-wider">PLAYER MATCH PERFORMANCE</h4>

          <div v-if="!selectedFixtureStats.matchStats || selectedFixtureStats.matchStats.length === 0" class="text-xs text-gray-500 text-center py-8">
            Belum ada statistik pemain yang dimasukkan untuk pertandingan ini.
          </div>

          <div v-else class="space-y-2">
            <div 
              v-for="stat in selectedFixtureStats.matchStats" 
              :key="stat.playerId"
              @click="openPlayerFromFixture(stat.playerId)"
              class="p-3 bg-black/50 hover:bg-[#C5A059]/10 border border-white/10 rounded-lg flex items-center justify-between cursor-pointer transition group"
            >
              <div>
                <!-- Auto Link ke Player Detail -->
                <div class="text-sm font-bold text-white group-hover:text-[#C5A059] flex items-center gap-1">
                  <span>{{ stat.playerName }}</span>
                  <span class="text-[10px] text-[#C5A059]">↗</span>
                </div>
                <div class="text-[10px] text-gray-400 font-mono">{{ stat.minutesPlayed || 90 }} Mins</div>
              </div>

              <div class="flex items-center gap-3 font-mono text-xs">
                <span>⚽ {{ stat.goals }}</span>
                <span>🅰️ {{ stat.assists }}</span>
                <span v-if="stat.goalsConceded" class="text-red-400">🧤 {{ stat.goalsConceded }}</span>
                <span class="bg-[#C5A059] text-black px-2 py-0.5 rounded font-bold">★ {{ stat.rating }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 7. MODAL EDIT FIXTURE (ADMIN - Change #4 & #9) -->
    <div v-if="editingFixture" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div class="bg-[#141414] border border-[#C5A059]/40 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        <div class="p-5 border-b border-white/10 flex justify-between items-center bg-black/40">
          <h3 class="text-sm font-black text-[#C5A059] uppercase tracking-wider">EDIT PERTANDINGAN & STATISTIK GAME</h3>
          <button @click="editingFixture = null" class="text-gray-400 hover:text-white text-lg">✕</button>
        </div>

        <div class="p-6 space-y-6 overflow-y-auto flex-grow">
          <!-- INFORMASI FIXTURE -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-[10px] text-gray-400 font-bold block mb-1">TIM HOME</label>
              <input v-model="editingFixture.home" type="text" class="w-full bg-black border border-white/20 p-2 rounded text-xs text-white" />
            </div>
            <div>
              <label class="text-[10px] text-gray-400 font-bold block mb-1">TIM AWAY</label>
              <input v-model="editingFixture.away" type="text" class="w-full bg-black border border-white/20 p-2 rounded text-xs text-white" />
            </div>
            <div>
              <label class="text-[10px] text-gray-400 font-bold block mb-1">TANGGAL</label>
              <input v-model="editingFixture.date" type="text" class="w-full bg-black border border-white/20 p-2 rounded text-xs text-white" />
            </div>
            <div>
              <label class="text-[10px] text-gray-400 font-bold block mb-1">WAKTU</label>
              <input v-model="editingFixture.time" type="text" class="w-full bg-black border border-white/20 p-2 rounded text-xs text-white" />
            </div>
          </div>

          <!-- INPUT STATS PEMAIN PER GAME -->
          <div class="border-t border-white/10 pt-4 space-y-3">
            <div class="flex justify-between items-center">
              <h4 class="text-xs font-black text-[#C5A059] uppercase">STATISTIK PEMAIN DI GAME INI</h4>
              <button @click="addPlayerStatToFixture" type="button" class="bg-[#C5A059] text-black px-2.5 py-1 rounded text-[10px] font-bold">+ Tambah Pemain</button>
            </div>

            <div v-for="(stat, index) in editingFixture.matchStats" :key="index" class="p-3 bg-black/40 border border-white/10 rounded-lg space-y-2">
              <div class="grid grid-cols-2 sm:grid-cols-6 gap-2">
                <div class="col-span-2">
                  <label class="text-[9px] text-gray-400 block">PEMAIN</label>
                  <select 
                    v-model="stat.playerId" 
                    @change="stat.playerName = players.find(p => p.id === stat.playerId)?.name || ''"
                    class="w-full bg-black border border-white/20 p-1.5 rounded text-xs text-white"
                  >
                    <option v-for="p in players" :key="p.id" :value="p.id">{{ p.name }} ({{ p.category }})</option>
                  </select>
                </div>
                <div>
                  <label class="text-[9px] text-gray-400 block">GOALS</label>
                  <input v-model.number="stat.goals" type="number" min="0" class="w-full bg-black border border-white/20 p-1.5 rounded text-xs text-white" />
                </div>
                <div>
                  <label class="text-[9px] text-gray-400 block">ASSISTS</label>
                  <input v-model.number="stat.assists" type="number" min="0" class="w-full bg-black border border-white/20 p-1.5 rounded text-xs text-white" />
                </div>
                <div>
                  <label class="text-[9px] text-gray-400 block">RATING</label>
                  <input v-model.number="stat.rating" type="number" step="0.1" min="0" max="10" class="w-full bg-black border border-white/20 p-1.5 rounded text-xs text-white" />
                </div>
                <!-- Change #9: Input Goal Conceded khusus GK -->
                <div>
                  <label class="text-[9px] text-red-400 block">KEBOBOLAN</label>
                  <input v-model.number="stat.goalsConceded" type="number" min="0" class="w-full bg-black border border-white/20 p-1.5 rounded text-xs text-white" />
                </div>
              </div>
              <button @click="removePlayerStatFromFixture(index)" type="button" class="text-red-400 text-[10px] hover:underline">Hapus Baris</button>
            </div>
          </div>
        </div>

        <div class="p-4 border-t border-white/10 bg-black/40 flex justify-end gap-3">
          <button @click="editingFixture = null" class="px-4 py-2 rounded text-xs text-gray-400 hover:text-white font-bold">Batal</button>
          <button @click="saveEditedFixture" class="bg-[#C5A059] text-black px-5 py-2 rounded text-xs font-black uppercase">Simpan Perubahan</button>
        </div>
      </div>
    </div>

    <!-- MODAL ADMIN LOGIN -->
    <div v-if="showLoginModal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div class="bg-[#141414] border border-[#C5A059]/40 w-full max-w-sm rounded-2xl p-6 relative">
        <button @click="showLoginModal = false" class="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
        <h3 class="text-lg font-black text-white uppercase mb-4 text-center">ADMIN LOGIN</h3>
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="text-[10px] text-gray-400 font-bold block mb-1">EMAIL</label>
            <input v-model="email" type="email" required class="w-full bg-black border border-white/20 p-2.5 rounded text-xs text-white outline-none focus:border-[#C5A059]" />
          </div>
          <div>
            <label class="text-[10px] text-gray-400 font-bold block mb-1">PASSWORD</label>
            <input v-model="password" type="password" required class="w-full bg-black border border-white/20 p-2.5 rounded text-xs text-white outline-none focus:border-[#C5A059]" />
          </div>
          <p v-if="loginError" class="text-red-400 text-xs">{{ loginError }}</p>
          <button type="submit" :disabled="isLoading" class="w-full bg-[#C5A059] text-black font-black py-2.5 rounded text-xs uppercase">LOGIN</button>
        </form>
      </div>
    </div>

    <!-- 8. FOOTER -->
    <footer class="border-t border-white/10 bg-black py-12 px-6">
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-gray-500">
        <div class="flex items-center gap-3">
          <span class="font-black text-white">NETZACH FC</span>
          <span>© 2026 All Rights Reserved</span>
        </div>
        
        <div class="flex items-center gap-6">
          <!-- Change #3: Link Instagram Footer -->
          <a href="https://www.instagram.com/netzach.fc?igsh=MWhyZWJmMTdnZnJyZg==" target="_blank" class="hover:text-[#C5A059] transition">Instagram</a>
          <a href="#squad" class="hover:text-white transition">Squad</a>
          <a href="#fixtures" class="hover:text-white transition">Fixtures</a>
          <a href="#about" class="hover:text-white transition">About Us</a>
        </div>
      </div>
    </footer>
  </div>
</template>