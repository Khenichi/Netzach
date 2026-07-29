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
  rating: number // Diperbarui: Rating manual dari Admin
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
const selectedPlayer = ref<Player | null>(null)

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
// 6. ADMIN & FIREBASE ACTIONS
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

// FITUR AUTO SEED 8 PEMAIN
const seedPlayersToFirebase = async () => {
  if (!confirm('Unggah 8 data pemain default ke database Firebase?')) return

  isLoading.value = true
  const initialPlayers: Omit<Player, 'id'>[] = [
    { name: 'IMANUEL', role: 'Goalkeeper', category: 'Keeper', photo: '', number: 12, stats: { matches: 0, goals: 0, assists: 0, rating: 7.5 } },
    { name: 'KHENICHI', role: 'Center Back', category: 'Defender', photo: '', number: 9, stats: { matches: 0, goals: 0, assists: 0, rating: 8.0 } },
    { name: 'HANSEL', role: 'Full Back', category: 'Defender', photo: '', number: 4, stats: { matches: 0, goals: 0, assists: 0, rating: 7.8 } },
    { name: 'MARLON', role: 'Center Back', category: 'Defender', photo: '', number: 24, stats: { matches: 0, goals: 0, assists: 0, rating: 7.9 } },
    { name: 'SONY', role: 'Central Midfield', category: 'Midfielder', photo: '', number: 11, stats: { matches: 0, goals: 0, assists: 0, rating: 8.2 } },
    { name: 'KETAN', role: 'Attacking Midfield', category: 'Midfielder', photo: '', number: 8, stats: { matches: 0, goals: 0, assists: 0, rating: 8.5 } },
    { name: 'VALERIO', role: 'Defensive Midfield', category: 'Midfielder', photo: '', number: 10, stats: { matches: 0, goals: 0, assists: 0, rating: 8.1 } },
    { name: 'KEVIN', role: 'Main Striker', category: 'Striker', photo: '', number: 7, stats: { matches: 0, goals: 0, assists: 0, rating: 8.8 } }
  ]

  try {
    for (const p of initialPlayers) {
      await addDoc(collection(db, 'players'), p)
    }
    alert('Berhasil! 8 Pemain telah dibuat di Firebase.')
  } catch (err) {
    alert('Gagal! Pastikan Rules Firestore sudah diset menjadi "allow read, write: if true;".')
  } finally {
    isLoading.value = false
  }
}

const savePlayerStats = async () => {
  if (!selectedPlayer.value || !selectedPlayer.value.id) return
  
  // Memastikan stats object terdefinisi
  if (!selectedPlayer.value.stats) {
    selectedPlayer.value.stats = { matches: 0, goals: 0, assists: 0, rating: 7.0 }
  }

  isLoading.value = true
  try {
    const playerRef = doc(db, 'players', selectedPlayer.value.id)
    await updateDoc(playerRef, {
      stats: selectedPlayer.value.stats,
      number: selectedPlayer.value.number,
      role: selectedPlayer.value.role,
      category: selectedPlayer.value.category
    })
    alert('Statistik pemain berhasil disimpan!')
  } catch (e) {
    console.error('Error update stats:', e)
    alert('Gagal menyimpan statistik.')
  } finally {
    isLoading.value = false
  }
}

const addFixture = async () => {
  if (!newFixture.value.away || !newFixture.value.date) {
    alert('Isi lawan dan tanggal pertandingan terlebih dahulu!')
    return
  }
  isLoading.value = true
  try {
    await addDoc(collection(db, 'fixtures'), newFixture.value)
    newFixture.value = { home: 'NetZach FC', away: '', date: '', time: '19:00 WIB', status: 'UPCOMING' }
    alert('Jadwal pertandingan berhasil ditambahkan!')
  } catch (err) {
    alert('Gagal menambahkan jadwal.')
  } finally {
    isLoading.value = false
  }
}

// State untuk menyimpan data fixture yang sedang di-edit di Modal
const editingFixture = ref<Fixture | null>(null)

// 1. UPDATE STATUS LANGSUNG DARI SELECT (QUICK EDIT)
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

// 2. BUKA MODAL EDIT DETAILED FIXTURE
const editFixture = (fixture: Fixture) => {
  editingFixture.value = JSON.parse(JSON.stringify(fixture))
}

// 3. SIMPAN EDITAN FULL MODAL KE FIREBASE
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
      status: editingFixture.value.status
    })
    editingFixture.value = null
    alert('Jadwal pertandingan berhasil diperbarui!')
  } catch (err) {
    console.error('Error update fixture:', err)
    alert('Gagal memperbarui jadwal pertandingan.')
  } finally {
    isLoading.value = false
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
          <button @click="toggleAudio" class="hover:text-white transition flex items-center gap-1">
            <span>MUSIC {{ isPlaying ? 'ON' : 'OFF' }}</span>
            <span>{{ isPlaying ? '🔊' : '🔇' }}</span>
          </button>
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
          <button v-if="isAdmin" @click="seedPlayersToFirebase" :disabled="isLoading" class="mt-4 bg-[#C5A059] text-black font-bold px-4 py-2 rounded text-xs hover:brightness-110 flex items-center gap-2 mx-auto">
            <span v-if="isLoading" class="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
            <span>🚀 Seed 8 Pemain Awal Sekarang</span>
          </button>
          <p v-else class="text-xs text-gray-600 mt-2">Silahkan login sebagai admin di header/footer untuk mengunggah data pemain.</p>
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

              <!-- KATEGORI POSISI -->
              <span class="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-[#C5A059] border border-[#C5A059]/40 text-[9px] font-black px-2.5 py-1 rounded uppercase tracking-widest z-10">
                {{ player.category }}
              </span>

              <!-- BADGE RATING PEMAIN DI KARTU -->
              <div class="absolute bottom-3 left-3 z-10 bg-gradient-to-r from-[#C5A059] to-[#9e7d3b] text-black px-2.5 py-1 rounded-md flex items-center gap-1 shadow-lg border border-[#f3e0aa]/40">
                <span class="text-[9px] font-black tracking-tighter uppercase">RATING</span>
                <span class="text-xs font-black font-mono leading-none">{{ player.stats?.rating ?? '7.0' }}</span>
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
                <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                  {{ player.role }}
                </p>
              </div>

              <!-- STATS MINI DI FOOTER KARTU -->
              <div class="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-gray-400 font-mono">
                <div class="flex items-center gap-3">
                  <span><b class="text-white">{{ player.stats?.matches || 0 }}</b> M</span>
                  <span><b class="text-[#C5A059]">{{ player.stats?.goals || 0 }}</b> G</span>
                  <span><b class="text-white">{{ player.stats?.assists || 0 }}</b> A</span>
                </div>
                <span class="text-[#C5A059] font-bold group-hover:translate-x-1 transition">→</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. FIXTURES & IDENTITY SECTION -->
    <section id="fixtures" class="py-24 px-6 bg-[#0d0d0d] border-t border-white/5">
      <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        <!-- MATCH CENTER (LEFT COLUMN) -->
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

          <!-- KONDISI JIKA TIDAK ADA FIXTURES -->
          <div v-if="fixtures.length === 0" class="p-12 rounded-xl bg-[#141414] border border-white/5 text-center space-y-2">
            <h3 class="text-base font-bold text-white uppercase">NO UPCOMING MATCHES</h3>
            <p class="text-xs text-gray-500">Belum ada jadwal pertandingan yang ditambahkan.</p>
          </div>

          <!-- DAFTAR FIXTURES -->
          <div v-else class="space-y-4">
            <div 
              v-for="fixture in fixtures" 
              :key="fixture.id"
              class="p-5 rounded-xl bg-[#141414] border border-white/5 hover:border-[#C5A059]/50 transition duration-300 flex flex-col sm:flex-row items-center justify-between gap-4 relative group"
            >
              <!-- STATUS & WAKTU (ADMIN BISA UBAH STATUS LANGSUNG DARI SELECT) -->
              <div class="text-center sm:text-left flex flex-col items-center sm:items-start">
                <template v-if="isAdmin">
                  <!-- QUICK EDIT STATUS DROPDOWN UTK ADMIN -->
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

              <!-- ACTION BUTTONS FOR ADMIN (EDIT FULL & DELETE) -->
              <div v-if="isAdmin" class="flex items-center gap-2">
                <button 
                  @click="editFixture(fixture)" 
                  title="Edit Detail Pertandingan"
                  class="bg-[#C5A059]/20 hover:bg-[#C5A059] text-[#C5A059] hover:text-black p-2 rounded text-xs transition duration-300 flex items-center justify-center font-bold"
                >
                  Edit
                </button>
                <button 
                  @click="deleteFixture(fixture.id)" 
                  title="Hapus Jadwal"
                  class="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white p-2 rounded text-xs transition duration-300 flex items-center justify-center font-bold"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- OUR IDENTITY (RIGHT COLUMN) -->
        <div id="colors" class="lg:col-span-5 space-y-6 bg-[#141414] p-8 rounded-2xl border border-white/5 h-fit">
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

      <!-- MODAL EDIT FIXTURE LENGKAP -->
      <div v-if="editingFixture" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div class="bg-[#141414] border border-[#C5A059]/40 rounded-2xl w-full max-w-md p-6 relative shadow-2xl space-y-4">
          <button @click="editingFixture = null" class="absolute top-4 right-4 text-gray-400 hover:text-white font-bold">✕</button>
          
          <div class="border-b border-white/10 pb-3">
            <h3 class="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
              Edit Detail Pertandingan
            </h3>
          </div>

          <form @submit.prevent="saveEditedFixture" class="space-y-3">
            <div>
              <label class="text-[10px] text-gray-400 font-bold block mb-1">TIM TUAN RUMAH (HOME)</label>
              <input v-model="editingFixture.home" type="text" required class="w-full bg-black border border-white/20 p-2.5 rounded text-xs text-white focus:border-[#C5A059] outline-none" />
            </div>

            <div>
              <label class="text-[10px] text-gray-400 font-bold block mb-1">TIM TANDANG (AWAY)</label>
              <input v-model="editingFixture.away" type="text" required class="w-full bg-black border border-white/20 p-2.5 rounded text-xs text-white focus:border-[#C5A059] outline-none" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] text-gray-400 font-bold block mb-1">TANGGAL</label>
                <input v-model="editingFixture.date" type="text" required class="w-full bg-black border border-white/20 p-2.5 rounded text-xs text-white focus:border-[#C5A059] outline-none" />
              </div>
              <div>
                <label class="text-[10px] text-gray-400 font-bold block mb-1">WAKTU</label>
                <input v-model="editingFixture.time" type="text" required class="w-full bg-black border border-white/20 p-2.5 rounded text-xs text-white focus:border-[#C5A059] outline-none" />
              </div>
            </div>

            <div>
              <label class="text-[10px] text-gray-400 font-bold block mb-1">STATUS</label>
              <select v-model="editingFixture.status" class="w-full bg-black border border-white/20 p-2.5 rounded text-xs text-white focus:border-[#C5A059] outline-none">
                <option value="NEXT MATCH">NEXT MATCH</option>
                <option value="UPCOMING">UPCOMING</option>
                <option value="FINISHED">FINISHED</option>
              </select>
            </div>

            <div class="pt-2 flex gap-3">
              <button type="button" @click="editingFixture = null" class="w-1/2 bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 rounded text-xs uppercase">Batal</button>
              <button type="submit" :disabled="isLoading" class="w-1/2 bg-[#C5A059] hover:brightness-110 text-black font-black py-2.5 rounded text-xs uppercase flex items-center justify-center gap-2">
                <span v-if="isLoading" class="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                <span>Simpan</span>
              </button>
            </div>
          </form>
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
          <button v-if="!isAdmin" @click="showLoginModal = true" class="text-[11px] text-[#C5A059] hover:underline font-bold">
            Admin Login
          </button>
          <button v-else @click="handleLogout" class="text-[10px] text-red-500 hover:underline">
            Logout Admin
          </button>
        </div>
      </div>
    </footer>

    <!-- MODAL STATS PEMAIN & EDIT ADMIN -->
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

        <!-- STATS DISPLAY (GOALS, ASSISTS, RATING) -->
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
          <div class="bg-black/50 p-3 rounded-lg border border-white/5 text-center bg-gradient-to-br from-[#C5A059]/10 to-transparent">
            <span class="text-[10px] text-[#C5A059] font-bold block">RATING</span>
            <span class="text-xl font-black text-[#C5A059]">{{ selectedPlayer.stats?.rating ?? 7.0 }}</span>
          </div>
        </div>

        <!-- JIKA ADMIN LOGGED IN: FORM EDIT STATS MANUAL -->
        <div v-if="isAdmin" class="border-t border-white/10 pt-4 space-y-3 bg-white/5 p-4 rounded-xl">
          <h4 class="text-xs font-bold text-[#C5A059] uppercase flex items-center justify-between">
            <span>Edit Stats (Admin Mode)</span>
            <span class="text-[10px] text-gray-400 font-normal">Input Manual</span>
          </h4>
          
          <div v-if="selectedPlayer.stats" class="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label class="text-[10px] text-gray-400 block mb-1">Matches</label>
              <input v-model.number="selectedPlayer.stats.matches" type="number" class="w-full bg-black border border-white/20 p-2 rounded text-white focus:border-[#C5A059] outline-none" />
            </div>
            <div>
              <label class="text-[10px] text-gray-400 block mb-1">Goals</label>
              <input v-model.number="selectedPlayer.stats.goals" type="number" class="w-full bg-black border border-white/20 p-2 rounded text-white focus:border-[#C5A059] outline-none" />
            </div>
            <div>
              <label class="text-[10px] text-gray-400 block mb-1">Assists</label>
              <input v-model.number="selectedPlayer.stats.assists" type="number" class="w-full bg-black border border-white/20 p-2 rounded text-white focus:border-[#C5A059] outline-none" />
            </div>
            <div>
              <label class="text-[10px] text-gray-400 block mb-1">Rating (0 - 10)</label>
              <input v-model.number="selectedPlayer.stats.rating" type="number" step="0.1" min="0" max="10" class="w-full bg-black border border-[#C5A059]/50 p-2 rounded text-[#C5A059] font-bold focus:border-[#C5A059] outline-none" />
            </div>
          </div>

          <button 
            @click="savePlayerStats" 
            :disabled="isLoading" 
            class="w-full bg-[#C5A059] text-black font-black py-2.5 rounded text-xs uppercase tracking-wider hover:brightness-110 transition flex items-center justify-center gap-2"
          >
            <span v-if="isLoading" class="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
            <span>{{ isLoading ? 'Menyimpan...' : 'Simpan Perubahan Stats' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL LOGIN ADMIN -->
    <div v-if="showLoginModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div class="bg-[#141414] border border-[#C5A059]/40 rounded-2xl w-full max-w-sm p-6 relative shadow-2xl">
        <button @click="showLoginModal = false" class="absolute top-4 right-4 text-gray-400 hover:text-white font-bold">✕</button>
        
        <div class="flex items-center gap-2 mb-4">
          <h3 class="text-xl font-black text-white uppercase tracking-wider">Admin Login</h3>
        </div>
        
        <p v-if="loginError" class="text-xs text-red-500 mb-3 bg-red-500/10 p-2 rounded border border-red-500/20">{{ loginError }}</p>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="text-xs text-gray-400 block mb-1">Email Admin</label>
            <input v-model="email" type="email" required placeholder="admin@netzachfc.com" class="w-full bg-black border border-white/20 p-2.5 rounded text-xs text-white focus:border-[#C5A059] outline-none" />
          </div>
          <div>
            <label class="text-xs text-gray-400 block mb-1">Password</label>
            <input v-model="password" type="password" required placeholder="••••••••" class="w-full bg-black border border-white/20 p-2.5 rounded text-xs text-white focus:border-[#C5A059] outline-none" />
          </div>
          
          <button 
            type="submit" 
            :disabled="isLoading" 
            class="w-full bg-gradient-to-r from-[#C5A059] to-[#9e7d3b] text-black font-black py-2.5 rounded text-xs uppercase tracking-wider hover:brightness-110 transition flex items-center justify-center gap-2"
          >
            <span v-if="isLoading" class="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
            <span>{{ isLoading ? 'Memverifikasi...' : 'LOGIN AKUN ADMIN' }}</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>