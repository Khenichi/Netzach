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
// 2. INTERFACES & TYPES (POSISI GANDA / MULTI-ROLE)
// -------------------------------------------------------------
type GeneralPosition = 'Goal Keeper' | 'Defender' | 'Midfielder' | 'Forward'

interface MatchPlayerStat {
  playerId: string
  playerName: string
  goals: number
  assists: number
  goalsConceded?: number
  rating: number
  minutesPlayed?: number
}

interface Player {
  id?: string
  name: string
  category: GeneralPosition | GeneralPosition[]
  photo: string
  number: number
  matchHistory?: MatchPlayerStat[]
}

// ✅ UPDATED: Tambah field homeScore & awayScore
interface Fixture {
  id?: string
  home: string
  away: string
  date: string
  time: string
  status: 'NEXT MATCH' | 'UPCOMING' | 'FINISHED'
  matchStats?: MatchPlayerStat[]
  homeScore?: number | null
  awayScore?: number | null
}

// -------------------------------------------------------------
// 3. ASSET FOTO DEFAULT & MAP
// -------------------------------------------------------------
import imgImanuel from '/src/assets/Screenshot 2026-07-28 100646.png'
import imgKhenichi from '/src/assets/Screenshot 2026-07-28 100359.png'
import imgHansel from '/src/assets/Screenshot 2026-07-28 100633.png'
import imgMarlon from '/src/assets/Screenshot 2026-07-28 100633.png'
import imgSony from '/src/assets/Screenshot 2026-07-28 100346.png'
import imgKetan from '/src/assets/Screenshot 2026-07-28 100654.png'
import imgValerio from '/src/assets/Screenshot 2026-07-28 100319.png'
import imgKevin from '/src/assets/Screenshot 2026-07-28 100412.png'
import imgAcel from '/src/assets/Screenshot 2026-07-30 151858.png'
import imgNetzach from '/src/assets/Screenshot 2026-07-28 103255.png'
import imgNetzachCrow from '/src/assets/WhatsApp Image 2026-07-28 at 10.50.06 AM (1).jpeg'

const localPhotos: Record<string, string> = {
  'KEVIN IMANUEL': imgImanuel,
  'KHENICHI': imgKhenichi,
  'HANSEL': imgHansel,
  'MARLON': imgMarlon,
  'SONY': imgSony,
  'KEVIN TAN': imgKetan,
  'VALERIO': imgValerio,
  'KEVIN': imgKevin,
  'ACEL': imgAcel,
  'AXEL': imgAcel
}

const getPlayerImage = (player: Player): string => {
  if (player.photo && player.photo.trim() !== '') {
    return player.photo
  }
  const normalizedName = player.name ? player.name.trim().toUpperCase() : ''
  return localPhotos[normalizedName] || ''
}

// -------------------------------------------------------------
// 4. STATES & REFS
// -------------------------------------------------------------
const activeCategory = ref<string>('All')
const selectedPlayer = ref<Player | null>(null)
const selectedFixtureStats = ref<Fixture | null>(null)

const isLoading = ref<boolean>(false)

const isAdmin = ref<boolean>(false)
const showLoginModal = ref<boolean>(false)
const showAdminDashboard = ref<boolean>(false)
const email = ref('')
const password = ref('')
const loginError = ref('')

const players = ref<Player[]>([])
const fixtures = ref<Fixture[]>([])

// ✅ UPDATED: newFixture include homeScore & awayScore
const newFixture = ref<Fixture>({
  home: 'NetZach FC',
  away: '',
  date: '',
  time: '19:00 WIB',
  status: 'UPCOMING',
  matchStats: [],
  homeScore: null,
  awayScore: null
})

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
// 5. HELPER COMPUTED
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

const formatPlayerCategory = (cat: GeneralPosition | GeneralPosition[]) => {
  if (Array.isArray(cat)) {
    return cat.join(' / ')
  }
  return cat
}

const getOpponentFromHistory = (fixtureId?: string): string => {
  if (!fixtureId) return 'Unknown Opponent'
  const fixture = fixtures.value.find(f => f.id === fixtureId)
  return fixture?.away || 'Unknown Opponent'
}

const getFixtureDateFromHistory = (fixtureId?: string): string => {
  if (!fixtureId) return '-'
  const fixture = fixtures.value.find(f => f.id === fixtureId)
  return fixture?.date || '-'
}

// ✅ NEW HELPER: Ambil skor pertandingan dari history
const getFixtureScoreFromHistory = (fixtureId?: string): string => {
  if (!fixtureId) return ''
  const fixture = fixtures.value.find(f => f.id === fixtureId)
  if (!fixture || fixture.homeScore === null || fixture.homeScore === undefined || 
      fixture.awayScore === null || fixture.awayScore === undefined) {
    return ''
  }
  return `${fixture.homeScore} - ${fixture.awayScore}`
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

  return players.value.filter(p => {
    if (Array.isArray(p.category)) {
      return p.category.includes(activeCategory.value as GeneralPosition)
    }
    return p.category === activeCategory.value
  })
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

const seedPlayersToFirebase = async () => {
  if (!confirm('Unggah data pemain default ke database Firebase?')) return

  isLoading.value = true
  const initialPlayers: Omit<Player, 'id'>[] = [
    { name: 'KEVIN IMANUEL', category: [], photo: '', number: 12, matchHistory: [] },
    { name: 'KHENICHI', category: [], photo: '', number: 9, matchHistory: [] },
    { name: 'HANSEL', category: [], photo: '', number: 4, matchHistory: [] },
    { name: 'MARLON', category: [], photo: '', number: 24, matchHistory: [] },
    { name: 'ACEL', category: [], photo: '', number: 15, matchHistory: [] },
    { name: 'SONY', category: [], photo: '', number: 11, matchHistory: [] },
    { name: 'KEVIN TAN', category: [], photo: '', number: 8, matchHistory: [] },
    { name: 'VALERIO', category: [], photo: '', number: 10, matchHistory: [] },
    { name: 'KEVIN', category: [], photo: '', number: 7, matchHistory: [] }
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

const openPlayerFromFixture = (playerId: string) => {
  const found = players.value.find(p => p.id === playerId || p.name === playerId)
  if (found) {
    selectedFixtureStats.value = null
    selectedPlayer.value = JSON.parse(JSON.stringify(found))
  }
}

// ✅ UPDATED: addFixture include homeScore & awayScore
const addFixture = async () => {
  if (!newFixture.value.away || !newFixture.value.date) {
    alert('Isi lawan dan tanggal pertandingan terlebih dahulu!')
    return
  }
  isLoading.value = true
  try {
    await addDoc(collection(db, 'fixtures'), { ...newFixture.value, matchStats: [] })
    newFixture.value = { 
      home: 'NetZach FC', 
      away: '', 
      date: '', 
      time: '19:00 WIB', 
      status: 'UPCOMING', 
      matchStats: [],
      homeScore: null,
      awayScore: null
    }
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
  // Default score ke null jika undefined
  if (editingFixture.value?.homeScore === undefined) editingFixture.value!.homeScore = null
  if (editingFixture.value?.awayScore === undefined) editingFixture.value!.awayScore = null
}

// ✅ FIXED: saveEditedFixture - sekarang menghapus stat yang dihapus dari matchHistory pemain
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
      matchStats: editingFixture.value.matchStats || [],
      homeScore: editingFixture.value.homeScore,
      awayScore: editingFixture.value.awayScore
    })

    // ✅ LOGIKA BARU: Identifikasi semua pemain yang terpengaruh
    const currentStatPlayerIds = editingFixture.value.matchStats?.map(s => s.playerId) || []
    const affectedPlayerIds = new Set<string>()
    
    // 1. Pemain yang pernah punya history di fixture ini (perlu dibersihkan)
    // 2. Pemain yang ada di stat baru (perlu ditambahkan)
    for (const player of players.value) {
      if (!player.id) continue
      const hasHistoryHere = player.matchHistory?.some(h => h.playerId === editingFixture.value?.id)
      const hasNewStat = currentStatPlayerIds.includes(player.id)
      
      if (hasHistoryHere || hasNewStat) {
        affectedPlayerIds.add(player.id)
      }
    }
    
    // Update setiap affected player
    for (const playerId of affectedPlayerIds) {
      const player = players.value.find(p => p.id === playerId)
      if (!player || !player.id) continue
      
      let history = player.matchHistory || []
      // Filter out SEMUA entry untuk fixture ini (bersihkan yang lama, termasuk yang dihapus)
      history = history.filter(h => h.playerId !== editingFixture.value?.id)
      
      // Jika pemain ini masih ada di matchStats baru, tambahkan yang baru
      const newStat = editingFixture.value.matchStats?.find(s => s.playerId === player.id)
      if (newStat) {
        history.push({ ...newStat, playerId: editingFixture.value.id! })
      }
      
      await updateDoc(doc(db, 'players', player.id), {
        matchHistory: history
      })
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
      // ✅ NEW: Juga bersihkan history pemain terkait saat fixture dihapus total
      const fixtureToDelete = fixtures.value.find(f => f.id === id)
      
      for (const player of players.value) {
        if (!player.id || !player.matchHistory) continue
        const hasHistory = player.matchHistory.some(h => h.playerId === id)
        if (hasHistory) {
          const newHistory = player.matchHistory.filter(h => h.playerId !== id)
          await updateDoc(doc(db, 'players', player.id), { matchHistory: newHistory })
        }
      }
      
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
          <a 
            href="https://www.instagram.com/netzach.fc?igsh=MWhyZWJmMTdnZnJyZg==" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="hover:text-white transition flex items-center gap-1 text-[#C5A059]"
          >
            <span>INSTAGRAM</span>
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
          <img 
            :src="imgNetzach" 
            alt="Netzach FC Logo" 
            class="w-10 h-12 object-contain group-hover:scale-105 transition duration-300 drop-shadow-[0_0_8px_rgba(197,160,89,0.4)]"
          />

          <div class="flex flex-col">
            <span class="text-xl font-black tracking-widest text-white leading-none">NETZACH</span>
            <span class="text-[10px] font-bold tracking-[0.3em] text-[#C5A059]">FOOTBALL CLUB</span>
          </div>
        </a>

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
            RISE TO GLORY
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
              <img :src="imgNetzachCrow" alt="NetZach FC Spirit" class="w-full h-full object-cover filter contrast-125 brightness-90 group-hover:scale-105 transition duration-700" />
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

          <div class="flex flex-wrap gap-2">
            <button 
              v-for="cat in ['All', 'Goal Keeper', 'Defender', 'Midfielder', 'Forward']" 
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

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div 
            v-for="player in filteredPlayers" 
            :key="player.id || player.name"
            @click="selectedPlayer = JSON.parse(JSON.stringify(player))"
            class="group relative bg-[#181818] border border-white/10 rounded-xl overflow-hidden hover:border-[#C5A059] transition duration-500 shadow-xl flex flex-col cursor-pointer"
          >
            <div class="h-72 overflow-hidden relative bg-black/40">
              <span class="absolute top-3 right-3 text-3xl font-black text-white/20 group-hover:text-[#C5A059]/100 transition duration-300 z-10">
                #{{ player.number }}
              </span>

              <div class="absolute top-3 left-3 flex items-center gap-1.5 z-20">
                <span class="bg-black/70 backdrop-blur-md text-[#C5A059] border border-[#C5A059]/40 text-[9px] font-black px-2.5 py-1 rounded uppercase tracking-widest">
                  {{ formatPlayerCategory(player.category) }}
                </span>

                <span 
                  v-if="player.name.trim().toUpperCase() === 'MARLON'" 
                  class="bg-[#C5A059] text-black font-black text-[10px] h-[20px] px-1.5 flex items-center justify-center rounded border border-[#f3e0aa] shadow-md tracking-none"
                  title="Captain"
                >
                  C
                </span>
              </div>

              <div class="absolute bottom-3 left-3 z-10 bg-gradient-to-r from-[#C5A059] to-[#9e7d3b] text-black px-2.5 py-1 rounded-md flex items-center gap-1 shadow-lg border border-[#f3e0aa]/40">
                <span class="text-[9px] font-black tracking-tighter uppercase">AVG RATING</span>
                <span class="text-xs font-black font-mono leading-none">
                  {{ getPlayerComputedStats(player).rating }}
                </span>
              </div>

              <img 
                :src="getPlayerImage(player)" 
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

              <div class="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-gray-400 font-mono">
                <div class="flex items-center gap-2.5">
                  <span><b class="text-white">{{ getPlayerComputedStats(player).matches }}</b> M</span>
                  <span><b class="text-[#C5A059]">{{ getPlayerComputedStats(player).goals }}</b> G</span>
                  <span><b class="text-white">{{ getPlayerComputedStats(player).assists }}</b> A</span>
                  <span v-if="player.category === 'Goal Keeper' || (Array.isArray(player.category) && player.category.includes('Goal Keeper'))" class="text-red-400">
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
        
        <div class="lg:col-span-7 space-y-6">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-xs font-black tracking-[0.3em] text-[#C5A059] uppercase mb-2">MATCH CENTER</div>
              <h2 class="text-3xl font-black tracking-tight text-white uppercase">UPCOMING FIXTURES</h2>
            </div>
          </div>

          <!-- FORM TAMBAH JADWAL (ADMIN ONLY) - ✅ UPDATED DENGAN INPUT SKOR -->
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

              <!-- ✅ NEW: Input Skor (Opsional, muncul saat status = FINISHED) -->
              <div 
                v-if="newFixture.status === 'FINISHED'" 
                class="grid grid-cols-2 gap-3 p-3 rounded-lg bg-black/30 border border-dashed border-[#C5A059]/30"
              >
                <div>
                  <label class="text-[10px] text-[#C5A059] font-bold block mb-1">⚽ SKOR HOME (NetZach)</label>
                  <input 
                    v-model.number="newFixture.homeScore" 
                    type="number" 
                    min="0" 
                    max="99"
                    placeholder="0" 
                    class="w-full bg-black border border-white/20 p-2.5 rounded text-xs text-white focus:border-[#C5A059] outline-none text-center font-bold" 
                  />
                </div>
                <div>
                  <label class="text-[10px] text-[#C5A059] font-bold block mb-1">⚽ SKOR AWAY (Lawan)</label>
                  <input 
                    v-model.number="newFixture.awayScore" 
                    type="number" 
                    min="0" 
                    max="99"
                    placeholder="0" 
                    class="w-full bg-black border border-white/20 p-2.5 rounded text-xs text-white focus:border-[#C5A059] outline-none text-center font-bold" 
                  />
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

          <div v-if="fixtures.length === 0" class="p-12 rounded-xl bg-[#141414] border border-white/5 text-center space-y-2">
            <h3 class="text-base font-bold text-white uppercase">NO UPCOMING MATCHES</h3>
            <p class="text-xs text-gray-500">Belum ada jadwal pertandingan yang ditambahkan.</p>
          </div>

          <!-- ✅ UPDATED: Fixture card dengan skor -->
          <div v-else class="space-y-4">
            <div 
              v-for="fixture in fixtures" 
              :key="fixture.id"
              :class="[
                'p-5 rounded-xl bg-[#141414] border border-white/5 hover:border-[#C5A059]/50 transition duration-300 flex flex-col sm:flex-row items-center justify-between gap-4 relative group',
                fixture.status === 'FINISHED' && fixture.homeScore !== null && fixture.homeScore !== undefined ? 'ring-1 ring-[#C5A059]/20' : ''
              ]"
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

                <span v-else :class="[
                  'text-[10px] font-black px-2 py-0.5 rounded border',
                  fixture.status === 'FINISHED' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                    : 'bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/30'
                ]">
                  {{ fixture.status }}
                </span>

                <div class="text-xs font-bold text-gray-400 mt-2">{{ fixture.date }} • {{ fixture.time }}</div>
              </div>

              <!-- ✅ UPDATED: TEAM MATCH VS / Skor -->
              <div class="flex items-center gap-4 text-base font-black tracking-wider">
                <span class="text-white text-right min-w-[100px]">{{ fixture.home }}</span>
                
                <!-- Tampilkan skor jika FINISHED dan skor sudah diisi -->
                <template v-if="fixture.status === 'FINISHED' && fixture.homeScore !== null && fixture.homeScore !== undefined && fixture.awayScore !== null && fixture.awayScore !== undefined">
                  <div class="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-[#C5A059] to-[#9e7d3b] rounded-lg shadow-lg">
                    <span class="text-2xl font-black text-black leading-none">{{ fixture.homeScore }}</span>
                    <span class="text-sm font-bold text-black/40">:</span>
                    <span class="text-2xl font-black text-black leading-none">{{ fixture.awayScore }}</span>
                  </div>
                  <span class="text-[9px] text-emerald-400 font-black uppercase tracking-widest">FT</span>
                </template>
                
                <!-- Default VS badge -->
                <span v-else class="px-3 py-1 bg-[#C5A059] text-black text-xs font-black rounded">VS</span>
                
                <span class="text-white text-left min-w-[100px]">{{ fixture.away }}</span>
              </div>

              <div class="flex items-center gap-2">
                <button 
                  @click="selectedFixtureStats = fixture" 
                  class="bg-white/10 hover:bg-[#C5A059] text-white hover:text-black px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1"
                >
                  <span>Stats</span>
                </button>

                <template v-if="isAdmin">
                  <button 
                    @click="editFixture(fixture)" 
                    class="bg-[#C5A059]/20 hover:bg-[#C5A059] text-[#C5A059] hover:text-black px-3 py-1.5 rounded text-xs font-bold transition"
                  >
                    Edit
                  </button>
                  <button 
                    @click="deleteFixture(fixture.id)" 
                    class="bg-red-500/20 hover:bg-red-600 text-red-400 hover:text-white px-3 py-1.5 rounded text-xs font-bold transition"
                  >
                    Hapus
                  </button>
                </template>
              </div>
            </div>
          </div>
        </div>

        <div id="about" class="lg:col-span-5 space-y-6">
          <div class="text-xs font-black tracking-[0.3em] text-[#C5A059] uppercase mb-2">WHO WE ARE</div>
          <h2 class="text-3xl font-black tracking-tight text-white uppercase">ABOUT NETZACH FC</h2>

          <div class="p-6 rounded-xl bg-[#141414] border border-white/10 space-y-4">
            <p class="text-gray-300 text-xs leading-relaxed">
              <b>NetZach FC</b> didirikan atas dasar passion, kedisiplinan, dan ikatan kekeluargaan yang kuat. Kami berkomitmen untuk menyajikan sepak bola yang menarik, kompetitif, dan menjunjung tinggi sportivitas.
            </p>
            <div class="border-t border-white/5 pt-4 space-y-2">
              <div class="flex justify-between text-xs">
                <span class="text-gray-400">Tahun Berdiri</span>
                <span class="text-white font-bold">2026</span>
              </div>
              <div class="flex justify-between text-xs">
                <span class="text-gray-400">Home Base</span>
                <span class="text-white font-bold">Indonesia</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- 5. NEWS SECTION -->
    <section id="news" class="py-24 px-6 bg-[#111111] border-t border-white/5">
      <div class="max-w-7xl mx-auto space-y-12">
        <div>
          <div class="text-xs font-black tracking-[0.3em] text-[#C5A059] uppercase mb-2">LATEST UPDATES</div>
          <h2 class="text-3xl font-black tracking-tight text-white uppercase">CLUB NEWS</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div v-for="item in news" :key="item.id" class="bg-[#181818] border border-white/10 rounded-xl overflow-hidden hover:border-[#C5A059] transition duration-300">
            <div class="h-48 overflow-hidden">
              <img :src="item.image" :alt="item.title" class="w-full h-full object-cover hover:scale-105 transition duration-500" />
            </div>
            <div class="p-6 space-y-2">
              <div class="flex items-center justify-between text-[10px] text-[#C5A059] font-bold">
                <span>{{ item.category }}</span>
                <span>{{ item.date }}</span>
              </div>
              <h3 class="text-lg font-bold text-white">{{ item.title }}</h3>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 6. MODALS -->
    <!-- A. MODAL PLAYER DETAILS - ✅ UPDATED: Tampilkan skor saat match history -->
    <div v-if="selectedPlayer" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div class="bg-[#141414] border border-[#C5A059]/40 w-full max-w-2xl rounded-2xl p-6 relative space-y-6 max-h-[90vh] overflow-y-auto custom-scroll">
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
                class="bg-[#C5A059] text-black font-black text-[10px] h-[20px] px-1.5 flex items-center justify-center rounded border border-[#f3e0aa] shadow-md"
                title="Captain"
              >
                C
              </span>
            </div>
            <h2 class="text-2xl font-black text-white mt-2">{{ selectedPlayer.name }}</h2>
            <p class="text-[11px] text-gray-400 mt-1 font-mono">
              Bergabung di Season 2026/2027 • NetZach FC
            </p>
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
          v-if="selectedPlayer.category === 'Goal Keeper' || (Array.isArray(selectedPlayer.category) && selectedPlayer.category.includes('Goal Keeper'))"
          class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-between"
        >
          <span class="text-xs font-bold text-red-400 uppercase tracking-wider">🧤 Goals Conceded (Kiper)</span>
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
            <p class="text-xs text-gray-500">Belum ada pertandingan yang tercatat untuk pemain ini.</p>
            <p class="text-[10px] text-gray-600 mt-1">Admin bisa menambahkan statistik via Edit Fixture.</p>
          </div>

          <div v-else class="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scroll">
            <div 
              v-for="(match, index) in selectedPlayer.matchHistory" 
              :key="match.playerId || index"
              class="p-3 rounded-lg bg-black/40 border border-white/5 hover:border-[#C5A059]/50 transition duration-200"
            >
              <div class="flex items-center justify-between mb-2 pb-2 border-b border-white/5">
                <div class="flex items-center gap-2">
                  <span class="text-white text-sm font-black">NetZach FC</span>
                  <span class="text-[#C5A059] text-xs font-bold">VS</span>
                  <span class="text-white text-sm font-black">
                    {{ getOpponentFromHistory(match.playerId) }}
                  </span>
                  <!-- ✅ NEW: Tampilkan skor di history -->
                  <span 
                    v-if="getFixtureScoreFromHistory(match.playerId)" 
                    class="ml-2 text-[10px] bg-gradient-to-r from-[#C5A059] to-[#9e7d3b] text-black px-2 py-0.5 rounded font-black"
                  >
                    {{ getFixtureScoreFromHistory(match.playerId) }}
                  </span>
                </div>
                <span class="text-[10px] text-gray-400 font-mono">
                  {{ getFixtureDateFromHistory(match.playerId) }}
                </span>
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
                <div v-if="selectedPlayer.category === 'Goal Keeper' || (Array.isArray(selectedPlayer.category) && selectedPlayer.category.includes('Goal Keeper'))">
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

    <!-- B. MODAL MATCH STATS -->
    <div v-if="selectedFixtureStats" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div class="bg-[#141414] border border-[#C5A059]/40 w-full max-w-md rounded-2xl p-6 relative space-y-4">
        <button @click="selectedFixtureStats = null" class="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
        <h3 class="text-lg font-black text-[#C5A059]">STATISTIK PERTANDINGAN</h3>
        
        <!-- ✅ NEW: Tampilkan skor jika match finished -->
        <div class="flex items-center justify-between">
          <p class="text-xs text-gray-300 font-bold">{{ selectedFixtureStats.home }} VS {{ selectedFixtureStats.away }}</p>
          <span 
            v-if="selectedFixtureStats.status === 'FINISHED' && selectedFixtureStats.homeScore !== null && selectedFixtureStats.homeScore !== undefined && selectedFixtureStats.awayScore !== null && selectedFixtureStats.awayScore !== undefined"
            class="text-sm bg-gradient-to-r from-[#C5A059] to-[#9e7d3b] text-black px-3 py-1 rounded font-black"
          >
            {{ selectedFixtureStats.homeScore }} - {{ selectedFixtureStats.awayScore }}
          </span>
        </div>

        <div v-if="!selectedFixtureStats.matchStats || selectedFixtureStats.matchStats.length === 0" class="text-xs text-gray-500 py-4 text-center">
          Belum ada statistik tercatat untuk pertandingan ini.
        </div>

        <div v-else class="space-y-2 max-h-60 overflow-y-auto pr-1">
          <div 
            v-for="stat in selectedFixtureStats.matchStats" 
            :key="stat.playerId"
            @click="openPlayerFromFixture(stat.playerId)"
            class="p-2.5 rounded bg-black/50 border border-white/5 flex items-center justify-between text-xs cursor-pointer hover:border-[#C5A059]"
          >
            <span class="font-bold text-white">{{ stat.playerName }}</span>
            <div class="flex items-center gap-3 text-[11px] font-mono">
              <span class="text-[#C5A059]">{{ stat.goals }} G</span>
              <span class="text-gray-300">{{ stat.assists }} A</span>
              <span class="bg-[#C5A059]/20 text-[#C5A059] px-1.5 py-0.5 rounded font-bold">★ {{ stat.rating }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- C. MODAL EDIT FIXTURE (ADMIN) - ✅ UPDATED DENGAN INPUT SKOR -->
    <div v-if="editingFixture" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div class="bg-[#141414] border border-[#C5A059]/40 w-full max-w-xl rounded-2xl p-6 relative space-y-4 max-h-[90vh] overflow-y-auto custom-scroll">
        <button @click="editingFixture = null" class="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
        <h3 class="text-lg font-black text-[#C5A059]">EDIT STATISTIK PERTANDINGAN</h3>

        <!-- ✅ NEW: FINAL SCORE SECTION -->
        <div class="p-4 rounded-xl bg-black/50 border border-[#C5A059]/30 space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-black text-[#C5A059] uppercase tracking-wider">⚽ Skor Akhir (Final Score)</h4>
            <span 
              v-if="editingFixture.status === 'FINISHED'" 
              class="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-black"
            >
              MATCH FINISHED
            </span>
            <span 
              v-else 
              class="text-[9px] bg-white/10 text-gray-400 px-2 py-0.5 rounded font-bold"
            >
              OPTIONAL
            </span>
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
          
          <p class="text-[10px] text-gray-500">* Skor akan otomatis tampil di card fixture dan history pemain saat status = FINISHED</p>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between border-b border-white/10 pb-2">
            <h4 class="text-xs font-black text-white uppercase tracking-wider">Statistik Pemain</h4>
            <button @click="addPlayerStatToFixture" class="px-3 py-1 bg-[#C5A059]/20 hover:bg-[#C5A059] text-[#C5A059] hover:text-black text-xs font-bold rounded transition">
              + Tambah Pemain
            </button>
          </div>

          <div v-for="(stat, idx) in editingFixture.matchStats" :key="idx" class="p-3 bg-black rounded border border-white/10 space-y-2">
            <div class="flex justify-between items-center">
              <select v-model="stat.playerId" @change="stat.playerName = players.find(p => p.id === stat.playerId)?.name || ''" class="bg-[#141414] text-xs text-white p-1 rounded border border-white/20 flex-1 mr-2">
                <option v-for="p in players" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
              <button @click="removePlayerStatFromFixture(idx)" class="text-red-400 hover:text-red-300 text-xs font-bold px-2">HAPUS</button>
            </div>

            <div class="grid grid-cols-4 gap-2 text-center text-xs">
              <div>
                <label class="text-[9px] text-gray-400 block">GOALS</label>
                <input v-model.number="stat.goals" type="number" class="w-full bg-[#141414] text-center p-1 rounded border border-white/20" />
              </div>
              <div>
                <label class="text-[9px] text-gray-400 block">ASSISTS</label>
                <input v-model.number="stat.assists" type="number" class="w-full bg-[#141414] text-center p-1 rounded border border-white/20" />
              </div>
              <div>
                <label class="text-[9px] text-gray-400 block">GOAL CONC.</label>
                <input v-model.number="stat.goalsConceded" type="number" class="w-full bg-[#141414] text-center p-1 rounded border border-white/20" />
              </div>
              <div>
                <label class="text-[9px] text-gray-400 block">RATING</label>
                <input v-model.number="stat.rating" type="number" step="0.1" class="w-full bg-[#141414] text-center p-1 rounded border border-white/20" />
              </div>
            </div>
          </div>
          
          <div v-if="!editingFixture.matchStats || editingFixture.matchStats.length === 0" class="py-6 text-center text-xs text-gray-500 bg-black/30 rounded border border-dashed border-white/10">
            Belum ada statistik pemain. Klik "+ Tambah Pemain" untuk menambahkan.
          </div>
        </div>

        <button 
          @click="saveEditedFixture" 
          :disabled="isLoading"
          class="w-full bg-[#C5A059] hover:brightness-110 text-black font-black py-2.5 rounded text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
        >
          <span v-if="isLoading" class="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
          <span>{{ isLoading ? 'Menyimpan...' : 'SIMPAN PERUBAHAN' }}</span>
        </button>
      </div>
    </div>

    <!-- D. LOGIN MODAL -->
    <div v-if="showLoginModal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div class="bg-[#141414] border border-[#C5A059]/40 w-full max-w-sm rounded-2xl p-6 relative space-y-4">
        <button @click="showLoginModal = false" class="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
        <h3 class="text-lg font-black text-[#C5A059] text-center">ADMIN LOGIN</h3>

        <form @submit.prevent="handleLogin" class="space-y-3">
          <input v-model="email" type="email" placeholder="Email" required class="w-full bg-black border border-white/20 p-2.5 rounded text-xs text-white outline-none focus:border-[#C5A059]" />
          <input v-model="password" type="password" placeholder="Password" required class="w-full bg-black border border-white/20 p-2.5 rounded text-xs text-white outline-none focus:border-[#C5A059]" />
          <p v-if="loginError" class="text-red-400 text-[10px] text-center">{{ loginError }}</p>
          <button type="submit" :disabled="isLoading" class="w-full bg-[#C5A059] text-black font-black py-2.5 rounded text-xs">
            LOGIN
          </button>
        </form>
      </div>
    </div>

    <footer class="border-t border-white/10 bg-black py-12 px-6">
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-gray-500">
        <div class="flex items-center gap-3">
          <span class="font-black text-white">NETZACH FC</span>
          <span>© 2026 All Rights Reserved</span>
        </div>
        
        <div class="flex items-center gap-6">
          <a href="https://www.instagram.com/netzach.fc?igsh=MWhyZWJmMTdnZnJyZg==" target="_blank" class="hover:text-[#C5A059] transition">Instagram</a>
          <a href="#squad" class="hover:text-white transition">Squad</a>
          <a href="#fixtures" class="hover:text-white transition">Fixtures</a>
          <a href="#about" class="hover:text-white transition">About Us</a>
        </div>
      </div>
    </footer>

  </div>
</template>

<style scoped>
.custom-scroll::-webkit-scrollbar {
  width: 6px;
}
.custom-scroll::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background: rgba(197, 160, 89, 0.5);
  border-radius: 3px;
}
.custom-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(197, 160, 89, 0.8);
}
</style>