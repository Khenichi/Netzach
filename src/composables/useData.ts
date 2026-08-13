import { ref, type Ref } from "vue";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  type DocumentData,
  type QuerySnapshot,
} from "firebase/firestore";
import type {
  Player,
  Fixture,
  MatchPlayerStat,
  PlayerStats,
  GeneralPosition,
  FixtureGroups,
} from "../types";

// ========================================
// SINGLETON STATE (shared across all views)
// ========================================
const players: Ref<Player[]> = ref([]);
const fixtures: Ref<Fixture[]> = ref([]);
const isLoading: Ref<boolean> = ref(false);
const selectedPlayer: Ref<Player | null> = ref(null);
const selectedFixtureStats: Ref<Fixture | null> = ref(null);

let listenersInitialized = false;

// ========================================
// MAIN COMPOSABLE
// ========================================
export function useData() {
  // --- FIREBASE LISTENERS ---
  const initListeners = (): void => {
    if (listenersInitialized) return;
    listenersInitialized = true;

    onSnapshot(
      collection(db, "players"),
      (snapshot: QuerySnapshot<DocumentData>) => {
        const fetched: Player[] = [];
        snapshot.forEach((docSnap) => {
          fetched.push({
            id: docSnap.id,
            ...(docSnap.data() as Omit<Player, "id">),
          });
        });
        players.value = fetched;
      },
    );

    onSnapshot(
      collection(db, "fixtures"),
      (snapshot: QuerySnapshot<DocumentData>) => {
        const fetched: Fixture[] = [];
        snapshot.forEach((docSnap) => {
          fetched.push({
            id: docSnap.id,
            ...(docSnap.data() as Omit<Fixture, "id">),
          });
        });
        fixtures.value = fetched;
      },
    );
  };

  // --- HELPER FUNCTIONS ---
  const getPlayerComputedStats = (player: Player): PlayerStats => {
    if (!player.matchHistory || player.matchHistory.length === 0) {
      return { matches: 0, goals: 0, assists: 0, rating: 0, goalsConceded: 0 };
    }

    const matches = player.matchHistory.length;
    const goals = player.matchHistory.reduce(
      (acc, curr) => acc + (curr.goals || 0),
      0,
    );
    const assists = player.matchHistory.reduce(
      (acc, curr) => acc + (curr.assists || 0),
      0,
    );
    const goalsConceded = player.matchHistory.reduce(
      (acc, curr) => acc + (curr.goalsConceded || 0),
      0,
    );
    const totalRating = player.matchHistory.reduce(
      (acc, curr) => acc + (curr.rating || 0),
      0,
    );
    const avgRating =
      matches > 0 ? parseFloat((totalRating / matches).toFixed(1)) : 0;

    return { matches, goals, assists, rating: avgRating, goalsConceded };
  };

  const formatPlayerCategory = (
    cat: GeneralPosition | GeneralPosition[],
  ): string => {
    if (Array.isArray(cat)) return cat.join(" / ");
    return cat;
  };

  const getOpponentFromHistory = (fixtureId?: string): string => {
    if (!fixtureId) return "Unknown Opponent";
    const fixture = fixtures.value.find((f) => f.id === fixtureId);
    return fixture?.away || "Unknown Opponent";
  };

  const getFixtureDateFromHistory = (fixtureId?: string): string => {
    if (!fixtureId) return "-";
    const fixture = fixtures.value.find((f) => f.id === fixtureId);
    return fixture?.date || "-";
  };

  const getFixtureScoreFromHistory = (fixtureId?: string): string => {
    if (!fixtureId) return "";
    const fixture = fixtures.value.find((f) => f.id === fixtureId);
    if (!fixture || fixture.homeScore == null || fixture.awayScore == null)
      return "";
    return `${fixture.homeScore} - ${fixture.awayScore}`;
  };

  const getMatchTypeFromHistory = (fixtureId?: string): string => {
    if (!fixtureId) return "";
    const fixture = fixtures.value.find((f) => f.id === fixtureId);
    return fixture?.matchType || "";
  };

  const parseFixtureDate = (dateStr: string): number => {
    if (!dateStr) return 0;
    const parsed = Date.parse(dateStr);
    return isNaN(parsed) ? 0 : parsed;
  };

  // --- GROUPING HELPER ---
  const groupFixturesByMonth = (fixtureList: Fixture[]): FixtureGroups => {
    const groups: FixtureGroups = {};
    fixtureList.forEach((f) => {
      const date = new Date(parseFixtureDate(f.date));
      const monthYear = isNaN(date.getTime())
        ? "TBA"
        : date
            .toLocaleString("id-ID", { month: "long", year: "numeric" })
            .toUpperCase();
      if (!groups[monthYear]) groups[monthYear] = [];
      groups[monthYear].push(f);
    });
    return groups;
  };

  // --- CRUD: ADD FIXTURE ---
  const addFixture = async (data: Fixture): Promise<boolean> => {
    if (!data.away || !data.date) {
      alert("Isi lawan dan tanggal pertandingan terlebih dahulu!");
      return false;
    }
    isLoading.value = true;
    try {
      await addDoc(collection(db, "fixtures"), { ...data, matchStats: [] });
      alert("Jadwal pertandingan berhasil ditambahkan!");
      return true;
    } catch (err) {
      alert("Gagal menambahkan jadwal.");
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // --- CRUD: UPDATE STATUS ---
  const updateFixtureStatus = async (
    fixture: Fixture,
    newStatus: Fixture["status"],
  ): Promise<void> => {
    if (!fixture.id) return;
    isLoading.value = true;
    try {
      await updateDoc(doc(db, "fixtures", fixture.id), { status: newStatus });
    } catch (err) {
      alert("Gagal mengupdate status pertandingan.");
    } finally {
      isLoading.value = false;
    }
  };

  // --- CRUD: SAVE EDITED FIXTURE ---
  const saveEditedFixture = async (
    editedFixture: Fixture,
  ): Promise<boolean> => {
    if (!editedFixture || !editedFixture.id) return false;
    isLoading.value = true;
    try {
      const fixtureRef = doc(db, "fixtures", editedFixture.id);
      await updateDoc(fixtureRef, {
        home: editedFixture.home,
        away: editedFixture.away,
        date: editedFixture.date,
        time: editedFixture.time,
        status: editedFixture.status,
        matchStats: editedFixture.matchStats || [],
        homeScore: editedFixture.homeScore,
        awayScore: editedFixture.awayScore,
        matchType: editedFixture.matchType,
      });

      const currentStatPlayerIds: string[] =
        editedFixture.matchStats?.map((s) => s.playerId) || [];
      const affectedPlayerIds = new Set<string>();

      for (const player of players.value) {
        if (!player.id) continue;
        const hasHistoryHere = player.matchHistory?.some(
          (h) => h.playerId === editedFixture.id,
        );
        const hasNewStat = currentStatPlayerIds.includes(player.id);
        if (hasHistoryHere || hasNewStat) affectedPlayerIds.add(player.id);
      }

      for (const playerId of affectedPlayerIds) {
        const player = players.value.find((p) => p.id === playerId);
        if (!player || !player.id) continue;

        let history: MatchPlayerStat[] = (player.matchHistory || []).filter(
          (h) => h.playerId !== editedFixture.id,
        );
        const newStat = editedFixture.matchStats?.find(
          (s) => s.playerId === player.id,
        );
        if (newStat) history.push({ ...newStat, playerId: editedFixture.id! });

        await updateDoc(doc(db, "players", player.id), {
          matchHistory: history,
        });
      }

      alert("Jadwal & Statistik berhasil diperbarui!");
      return true;
    } catch (err) {
      alert("Gagal memperbarui pertandingan.");
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // --- CRUD: DELETE FIXTURE ---
  const deleteFixture = async (id: string): Promise<void> => {
    if (!id || !confirm("Hapus jadwal ini?")) return;
    isLoading.value = true;
    try {
      for (const player of players.value) {
        if (!player.id || !player.matchHistory) continue;
        if (player.matchHistory.some((h) => h.playerId === id)) {
          const newHistory = player.matchHistory.filter(
            (h) => h.playerId !== id,
          );
          await updateDoc(doc(db, "players", player.id), {
            matchHistory: newHistory,
          });
        }
      }
      await deleteDoc(doc(db, "fixtures", id));
    } finally {
      isLoading.value = false;
    }
  };

  // --- SEED DEFAULT PLAYERS ---
  const seedPlayersToFirebase = async (): Promise<void> => {
    if (!confirm("Unggah data pemain default ke database Firebase?")) return;
    isLoading.value = true;
    const initialPlayers: Omit<Player, "id">[] = [
      {
        name: "KEVIN IMANUEL",
        category: [],
        photo: "",
        number: 12,
        matchHistory: [],
      },
      {
        name: "KHENICHI",
        category: [],
        photo: "",
        number: 9,
        matchHistory: [],
      },
      { name: "HANSEL", category: [], photo: "", number: 4, matchHistory: [] },
      { name: "MARLON", category: [], photo: "", number: 24, matchHistory: [] },
      { name: "ACEL", category: [], photo: "", number: 15, matchHistory: [] },
      { name: "SONY", category: [], photo: "", number: 11, matchHistory: [] },
      {
        name: "KEVIN TAN",
        category: [],
        photo: "",
        number: 8,
        matchHistory: [],
      },
      {
        name: "VALERIO",
        category: [],
        photo: "",
        number: 10,
        matchHistory: [],
      },
      { name: "KEVIN", category: [], photo: "", number: 7, matchHistory: [] },
    ];
    try {
      for (const p of initialPlayers) {
        await addDoc(collection(db, "players"), p);
      }
      alert("Berhasil! Data Pemain telah diperbarui di Firebase.");
    } catch (err) {
      alert("Gagal! Pastikan Rules Firestore sudah dikonfigurasi.");
    } finally {
      isLoading.value = false;
    }
  };

  return {
    // State
    players,
    fixtures,
    isLoading,
    selectedPlayer,
    selectedFixtureStats,
    // Lifecycle
    initListeners,
    // Helpers
    getPlayerComputedStats,
    formatPlayerCategory,
    getOpponentFromHistory,
    getFixtureDateFromHistory,
    getFixtureScoreFromHistory,
    getMatchTypeFromHistory,
    parseFixtureDate,
    groupFixturesByMonth,
    // CRUD
    addFixture,
    updateFixtureStatus,
    saveEditedFixture,
    deleteFixture,
    seedPlayersToFirebase,
  };
}
