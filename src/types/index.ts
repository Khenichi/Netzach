// ========================================
// SHARED TYPES - Dipakai di seluruh aplikasi
// ========================================

export type GeneralPosition =
  | "Goal Keeper"
  | "Defender"
  | "Midfielder"
  | "Forward";
export type MatchType = "Futsal" | "Mini Soccer" | "Football";
export type MatchStatus = "NEXT MATCH" | "UPCOMING" | "FINISHED";

export interface MatchPlayerStat {
  playerId: string;
  playerName: string;
  goals: number;
  assists: number;
  goalsConceded?: number;
  rating: number;
  minutesPlayed?: number;
}

export interface Player {
  id?: string;
  name: string;
  category: GeneralPosition | GeneralPosition[];
  photo: string;
  number: number;
  matchHistory?: MatchPlayerStat[];
}

export interface Fixture {
  id?: string;
  home: string;
  away: string;
  date: string;
  time: string;
  status: MatchStatus;
  matchStats?: MatchPlayerStat[];
  homeScore?: number | null;
  awayScore?: number | null;
  matchType?: MatchType | null;
}

export interface NewsItem {
  id: number;
  category: string;
  title: string;
  date: string;
  image: string;
}

export interface PlayerStats {
  matches: number;
  goals: number;
  assists: number;
  rating: number;
  goalsConceded: number;
}

export interface NavLink {
  name: string;
  path: string;
}

// Grouped fixtures by month
export type FixtureGroups = Record<string, Fixture[]>;
