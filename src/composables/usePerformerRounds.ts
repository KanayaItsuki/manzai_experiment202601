// src/composables/usePerformerRounds.ts
type RoundState = { performers: string[]; idx: number; size: number; watched: Record<string,string[]> }
const KEY = 'manzai-performer-round'

const safe = {
  read<T>(k: string, d: T | null = null): T | null {
    try { return JSON.parse(localStorage.getItem(k) || 'null') ?? d } catch { return d }
  },
  write<T>(k: string, v: T | null) {
    try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)) } catch {}
  },
}

function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function usePerformerRounds() {
  const read  = () => safe.read<RoundState>(KEY)
  const write = (s: RoundState | null) => safe.write(KEY, s)

  const watchedCountOf = (s: RoundState, pid: string) =>
    (s.watched[pid]?.length ?? 0)

   function uniquePerformers(videos: Array<{ performerId?: string; id: string }>): string[] {
    const set = new Set<string>()
    for (const v of videos) {
      const pid = v.performerId || v.id.split('-')[0]
      if (pid) set.add(pid)
    }
    return Array.from(set)
  }

  return {
    start(videos: any[], size = 4) {
      const existing = read()
      if (existing?.performers?.length) return existing.performers[existing.idx] ?? null
      const performers = shuffle(uniquePerformers(videos)).slice(0, size)
      write({ performers, idx: 0, size, watched: {} })
      return performers[0] || null
    },
    currentId() {
      const s = read(); if (!s) return null
      return s.performers[s.idx] ?? null
    },

    /** ✅ガード付き advance：いまの漫才師が required 本(既定2)見終わるまで進まない */
    advance(required = 2) {
      const s = read(); if (!s) return null
      const pid = s.performers[s.idx]
      if (!pid) return null
      if (watchedCountOf(s, pid) < required) {
        // まだ本数が足りない → 進まない（今の pid を返す）
        return pid
      }
      s.idx++
      write(s)
      return s.performers[s.idx] ?? null
    },

    /** 強制で次へ（最終アンケートへ進める直前など“確実に2本終わってる”場面でだけ使用） */
    forceAdvance() {
      const s = read(); if (!s) return null
      s.idx++
      write(s)
      return s.performers[s.idx] ?? null
    },

    markWatched(pid: string, vid: string) {
      const s = read(); if (!s) return
      if (!s.watched[pid]) s.watched[pid] = []
      if (!s.watched[pid].includes(vid)) s.watched[pid].push(vid)
      write(s)
    },
    watchedCount(pid: string) { const s = read(); return s ? (s.watched[pid]?.length ?? 0) : 0 },
    state() { return read() },
    clear() { safe.write(KEY, null) },
  }
}
