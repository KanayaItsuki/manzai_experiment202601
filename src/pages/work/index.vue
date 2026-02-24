<!-- src/pages/work/index.vue -->
<template>
  <v-container class="py-6">
    
<v-alert
  type="info"
  variant="tonal"
  class="rounded-xl mb-4 task-guide"
  density="comfortable"
  border="start"
  border-color="primary"
  prominent
>
  <div class="d-flex align-start">
    <!-- <v-icon size="28" class="mr-3 mt-1">mdi-clipboard-check-outline</v-icon> -->
    <div>
      <div class="text-subtitle-1 font-weight-bold mb-1">タスク</div>
      <!-- ★説明文を大きく -->
      <!-- v-alert 内の文言だけ置き換え -->
<div class="text-subtitle-1 font-weight-regular leading-tight">
  気になった動画のサムネイルをクリックして動画を視聴してください．
  本ページでは<u>10分間，自由に視聴・切り替え</u>できます．
  <u>10分経過すると自動でアンケート画面に遷移</u>します．
  <b>漫才をほとんど見たことがない友人に対して，その漫才師に興味を持ってもらえそうな動画を2本薦める前提で視聴してください．</b>
</div>
<div class="text-body-2 mt-2 opacity-80">
  ※ 動画は途中で閉じたり，他の動画に切り替えても構いません．
</div>
<div class="text-body-2 mt-2 opacity-80">
  ※ 動画が6つ表示されていない場合は，一度リロードしてください．
</div>

    </div>
  </div>
</v-alert>

<!-- 残り時間の大きめ表示 -->
<div
  class="timebox mt-2"
  :class="{ hurry: isHurry }"
  aria-live="polite"
  :aria-label="`残り時間 ${remainingText}`"
>
  <v-icon icon="mdi-timer-outline" size="28" class="mr-1" />
  <span class="mono">{{ remainingText }}</span>
</div>

<div class="mt-3">
  <v-btn-toggle v-model="sortMode" mandatory class="sort-toggle" density="comfortable">
    <v-btn
      value="new"
      class="pill"
      :class="{ active: sortMode === 'new' }"
      prepend-icon="mdi-update"
      rounded="xl"
    >
      新しい順
    </v-btn>

    <v-btn
      value="popular"
      class="pill"
      :class="{ active: sortMode === 'popular' }"
      prepend-icon="mdi-fire"
      rounded="xl"
    >
      人気の動画
    </v-btn>
  </v-btn-toggle>
</div>


<!-- 残り時間表示の下あたりに追加 -->
<!-- ▼ 半分経過の警告スナックバー -->
<v-snackbar
  v-model="halfWarnOpen"
  timeout="10000"
  location="top"
  multi-line
  color="warning"
  class="rounded-xl text-black"
>
  この組ではまだ動画を再生していません。残り {{ remainingText }} です。
  <template #actions>
    <v-btn variant="text" @click="halfWarnOpen = false">閉じる</v-btn>
  </template>
</v-snackbar>


<v-row v-if="loading" dense>
  <v-col v-for="n in 4" :key="n" cols="12">
    <v-skeleton-loader type="article, image" class="rounded-xl" />
  </v-col>
</v-row>

<v-row v-else dense>
  <v-col
    v-for="v in displayedVideos"
    :key="v.id"
    cols="12" sm="6" md="4" lg="4" xl="4"
  >
    <v-card class="rowcard rounded-xl overflow-hidden hover:shadow-md transition-ease" elevation="0">
      <div class="tile" role="button" tabindex="0"
           @click.stop="openPlayer(v)"
           @keydown.enter="openPlayer(v)"
           @keydown.space.prevent="openPlayer(v)">

        <!-- ★ 動画ごとに固定されたアルファベット -->
        <div class="alpha-chip" :aria-label="`動画 ${videoLabelMap[v.id]}`">
          {{ videoLabelMap[v.id] }}
        </div>

        <v-img :src="v.thumbnailUrl" :aspect-ratio="thumbAspect" cover
               :alt="`${v.title} サムネイル`" class="tile-thumb" />
        <div v-if="v.durationSec" class="badge tile-badge">{{ formatDuration(v.durationSec) }}</div>
      </div>

      <div class="tile-info px-1 pt-2 pb-2">
        <div class="card-title line-2" :title="v.title">{{ v.title }}</div>
        <div class="meta">
          {{ formatViews(v.views) }} 回視聴
          <span v-if="yearsAgoLabel(v)" class="ml-1">・{{ yearsAgoLabel(v) }}</span>
        </div>
      </div>

      <template v-if="isGraphOn && v.graphImageUrl">
        <div class="tile-graph px-1 pb-2">
          <img :src="v.graphImageUrl" :alt="`${v.title} の発話タイムライン`"
               class="graph-img" @click="openGraph(v)" />
        </div>
      </template>
    </v-card>
  </v-col>

  <v-col v-if="!videos.length" cols="12">
    <v-alert type="info" variant="tonal" class="rounded-xl">動画データがありません。</v-alert>
  </v-col>
</v-row>



    <!-- 再生モーダル（上：動画 / 下：グラフ） -->
<v-dialog
  v-model="playerOpen"
  :max-width="dialogMaxWidth" 
  max-height="110vh"
  transition="dialog-bottom-transition"
  @update:modelValue="onPlayerToggle"
>
  <v-card class="player-card rounded-xl">  
    <v-toolbar density="comfortable" flat>
      <v-toolbar-title class="title-full">{{ currentTitle }}</v-toolbar-title>
      <v-btn icon="mdi-close" @click="closePlayer" />
    </v-toolbar>

        <v-responsive :aspect-ratio="16/9">
          <div v-if="playerType === 'youtube'" ref="ytMount" style="width:100%;height:100%"></div>
          <video
            v-else-if="playerType === 'mp4' && playerSrc"
            ref="currentVideoEl"
            :src="playerSrc"
            controls autoplay playsinline
            @ended="postSelectFinal('ended')"
            style="width:100%; height:100%; display:block; background:black;"
          ></video>
        </v-responsive>

      <!-- グラフ -->
      <template v-if="isGraphOn && currentVideo?.graphImageUrl">
        <div class="player-graphBox">
          <img
            :src="currentVideo!.graphImageUrl"
            :alt="'${currentVideo!.title} の発話タイムライン'"
            class="player-graph-img"
          />
          <!-- <div class="graph-overlay-rect" :style="graphOverlayStyle">
            <div class="graph-seekbar" :style="{ left: seekPercent + '%' }"></div>
          </div> -->
          <div class="graph-overlay-rect" :style="graphOverlayStyle">
          <!-- シークバー一式 -->
            <div
              class="graph-seekbar-wrapper"
              :style="{ top: seekBarTopPercent + '%' }"
            >
              <!-- 未再生部分（薄いトラック） -->
              <div class="graph-seekbar-track"></div>

              <!-- 再生済み部分（塗りつぶし） -->
              <div
                class="graph-seekbar-fill"
                :style="{ width: seekPercent + '%' }"
              ></div>

              <!-- 動く丸 -->
              <div
                class="graph-seekbar-thumb"
                :style="{ left: seekPercent + '%' }"
              ></div>
            </div>
          </div>
        </div>
    
      </template>
    
  </v-card>
</v-dialog>



<!-- ▼グラフ拡大モーダル（新規追加） -->
<!-- <v-dialog v-model="graphOpen" max-width="96vw" transition="dialog-bottom-transition">
  <v-card class="rounded-xl overflow-hidden">
    <v-toolbar flat density="comfortable">
      <v-toolbar-title class="text-truncate">{{ graphTitle }}</v-toolbar-title>
      <v-spacer />
      <v-btn icon="mdi-close" @click="graphOpen = false" />
    </v-toolbar>
    <v-img :src="graphSrc ?? ''" :alt="graphTitle" cover style="max-height:80vh;" />
  </v-card>
</v-dialog> -->

  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeUnmount, onActivated, reactive } from 'vue'
import { nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePerformerRounds } from '@/composables/usePerformerRounds'


type VideoItem = {
  id: string
  title: string
  performerId?: string
  performerName?: string
  youtubeId?: string
  videoUrl?: string
  videoURL?: string
  thumbnailUrl: string
  graphImageUrl?: string
  views: number
  durationSec?: number
  publishedAt?: string
}

const halfWarnOpen = ref(false)
const halfWarnShown = ref(false)
// ★ このブロックで動画を1本でも開いたかを管理
const openedOnceThisBlock = ref(false)
function saveOpenedFlag(pid: string) {
  try { sessionStorage.setItem(`manzai-opened-once-${pid}`, '1') } catch {}
  openedOnceThisBlock.value = true
}
function loadOpenedFlag(pid: string): boolean {
  try { return sessionStorage.getItem(`manzai-opened-once-${pid}`) === '1' } catch { return false }
}

function getTaskIndexForSend(): number {
  // 1) work で setTaskIndexForCurrent() 済みの値を第一候補
  try {
    const v = Number(sessionStorage.getItem(TASK_INDEX_KEY))
    if (Number.isFinite(v) && v > 0) return v
  } catch {}
  // 2) 念のためのフォールバック：完了済み組数 + 1
  try {
    return loadCompletedSet().size + 1
  } catch {}
  return 1
}


const rounds = usePerformerRounds()
const ROUND_SIZE = 4
const TARGET_PERFORMERS = ROUND_SIZE

const loading = ref(true)
const router = useRouter()

const videos = ref<VideoItem[]>([])

// --- グラフ表示の切替（graph=0:なし / graph=1:あり）---
 const route = useRoute()
// 既定: 0=なし / 1=あり
 const GRAPH_DEFAULT = 1 as const
 const isGraphOn = computed<boolean>(() => {
   const raw = route.query.graph
   const val = Array.isArray(raw) ? raw[0] : raw
   if (val === '0') return false
   if (val === '1') return true
   return GRAPH_DEFAULT === 1
 })

 // ★ 追加：1組あたりの制限時間（10分）
const BLOCK_LIMIT_MS = 10 * 60 * 1000

// ★ 追加：この“漫才師ブロック”のタイマー状態
let blockTimer: number | null = null
const blockStartedAt = ref<number | null>(null)  // ms
const remainingMs = ref<number>(BLOCK_LIMIT_MS)

// 永続化キー（リロードに強くする）
const BLOCK_START_KEY = (pid: string) => `manzai-block-start-${pid}`
const NEXT_ON_RETURN_KEY = 'manzai-go-next-on-return'

 
 // 他ページ参照用に保存
 const GRAPH_FLAG_KEY = 'manzai-graph-flag'
 watch(isGraphOn, (v) => {
   try { localStorage.setItem(GRAPH_FLAG_KEY, v ? '1' : '0') } catch {}
 }, { immediate: true })

 // ▼追加：モード切替（'zoom' = 今までの幅 + クリック拡大 / 'large' = モーダルを広めに）
const GRAPH_MODAL_MODE = 'zoom' as 'zoom' | 'large'
// ▼追加：モーダルの最大幅を計算（largeの時だけ広く）
const dialogMaxWidth = computed(() => {
  const hasGraph = isGraphOn.value && !!currentVideo.value?.graphImageUrl
  if (!hasGraph) return '48vw'         // グラフ無し：標準幅
  return GRAPH_MODAL_MODE === 'large' ? '80vw' : '48vw'
})

//サムネ上のアルファベット
const alphaLabel = (idx: number) => {
  // A～F の6文字のみを繰り返す
  // const letters = ["A", "B", "C", "D", "E", "F"] 　これじゃうまくいかないので力業でAスタートにした
  const letters = ["F", "E", "D", "C", "B", "A"]
  return letters[(idx % letters.length + letters.length) % letters.length]
}

const videoLabelMap = ref<Record<string, string>>({})

// 2) もし初期割当てを watch でやるなら videos を監視する
watch(videos, (newVideos) => {
  let next = Object.keys(videoLabelMap.value).length
  for (const v of newVideos) {
    if (!videoLabelMap.value[v.id]) {
      videoLabelMap.value[v.id] = alphaLabel(next)
      next++
    }
  }
}, { immediate: true })


// ---- 視聴時間（＝モーダル開放時間）の計測 ----
// モーダル計時タイマー（このファイル内に定義されていることを確認）
// ---- モーダル滞在時間の計測（厳密版） ----
const modalOpenMs = ref(0)
let modalTimer: number | null = null
let modalOpenedAt: number | null = null
let timing = false // ★ ガード

function startModalTimer() {
  if (timing) return                // 既に起動中なら何もしない
  timing = true
  modalOpenedAt = performance.now()
  modalOpenMs.value = 0
  modalTimer = window.setInterval(() => {
    if (modalOpenedAt != null) {
      modalOpenMs.value = Math.round(performance.now() - modalOpenedAt)
    }
  }, 250)
}

function stopModalTimer(finalize = false) {
  if (!timing) return               // 動いていないなら何もしない
  if (finalize && modalOpenedAt != null) {
    modalOpenMs.value = Math.max(
      modalOpenMs.value,
      Math.round(performance.now() - modalOpenedAt)
    )
  }
  if (modalTimer !== null) { clearInterval(modalTimer); modalTimer = null }
  modalOpenedAt = null
  timing = false
}

// 念のためクリーンアップ
onBeforeUnmount(() => stopModalTimer(true))



// DBへのデータ送信用
const USER_ID_KEY = 'manzai-user-id-v1'
const DEMO_KEY = 'manzai-demographics'
const TASK_INDEX_KEY = 'manzai-current-task-index'

// 今の参加者属性
function getUserBasics() {
  let sex: string | null = null, age: string | null = null
  try {
    const raw = localStorage.getItem(DEMO_KEY)
    if (raw) { const o = JSON.parse(raw); sex = o?.sex ?? null; age = o?.age ?? null }
  } catch {}
  return { sex, age }
}
// 0/1 の graph フラグ
function getGraphFlag(): 0 | 1 {
  try { return (localStorage.getItem(GRAPH_FLAG_KEY) === '1') ? 1 : 0 } catch { return 0 }
}
// タスク番号（= これまで見終えた本数 + 1）
function calcTaskIndex(): number {
  try {
    const raw = localStorage.getItem(WATCHED_MAP_KEY)
    if (raw) {
      const map = JSON.parse(raw) as Record<string,string[]>
      const total = Object.values(map).reduce((s, arr) => s + (Array.isArray(arr) ? arr.length : 0), 0)
      return total + 1
    }
  } catch {}
  // フォールバック：roundsの合計
  const st = (rounds.state() as any) || {}
  const watchedByPid: Record<string, string[]> = st.watched || {}
  const done = Object.values(watchedByPid).reduce((s, a: any) => s + (Array.isArray(a) ? a.length : 0), 0)
  return done + 1
}

//シークバー操作ログ取得
// 追加: シークログの型＆バッファ
type SeekLog =
  | { type: 'seek'; from: number; to: number; reason: 'user' | 'program' | 'paused-scrub'; ts: number }
  | { type: 'play' | 'pause' | 'ended' | 'buffering' | 'cued'; t: number; ts: number }
  | { type: 'ratechange'; rate: number; t: number; ts: number };

const seekLogs = ref<SeekLog[]>([]);
const SEEK_POLL_MS = 250;
const SEEK_THRESHOLD = 1.0; // 秒差がこの値以上なら「シーク」と判定

function pushSeekLog(e: SeekLog) {
  seekLogs.value.push(e);
}
function clearSeekLogs() {
  seekLogs.value = [];
}

// 視聴済みを永続化したキー（question側で保存している前提）
const WATCHED_MAP_KEY = 'manzai-watched-by-performer-v1'

function watchedIdsFor(pid: string): string[] {
  const fromRounds = (rounds.state()?.watched?.[pid] ?? []) as string[]
  let fromLocal: string[] = []
  try {
    const raw = localStorage.getItem(WATCHED_MAP_KEY)
    const map = raw ? JSON.parse(raw) as Record<string,string[]> : {}
    if (Array.isArray(map?.[pid])) fromLocal = map[pid]
  } catch {}
  return Array.from(new Set([...(fromRounds || []), ...(fromLocal || [])]))
}


async function postToDB(payload: any) {
  const url = 'https://kanaya.nkmr.io/manzai_system/manzai_system_dcc42_api.php'
  try {
    // console.log('[DB] sending', payload)
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
      credentials: 'omit',
    })
    const text = await res.text()
    // console.log('[DB] response', res.status, text)
    if (!res.ok || !/\"ok\"\s*:\s*true/.test(text)) {
      // console.error('[DB] server NG', text)
    }
  } catch (e) {
    // console.error('[DB] fetch failed', e)
  }
}
 
// サムネ設定
const thumbWidth = 240
const thumbAspect = 16 / 9

// 今ラウンドの漫才師
const currentPerformerId = ref<string | null>(null)
const currentPerformerName = ref<string>('')

// ▼追加：グラフ拡大用
const graphOpen = ref(false)
const graphSrc  = ref<string | null>(null)
const graphTitle = ref('')

function openGraph(v: VideoItem) {
  if (!v.graphImageUrl) return
  graphSrc.value = v.graphImageUrl
  graphTitle.value = `${v.title} の発話タイムライン`
  graphOpen.value = true
}

function loadBlockStart(pid: string): number | null {
  try {
    const raw = localStorage.getItem(BLOCK_START_KEY(pid))
    if (!raw) return null
    const t = Number(raw)
    if (!Number.isFinite(t)) return null
    const now = Date.now()

    // ① 未来時刻（端末時計ズレ対策）：無効
    if (t > now) return null

    // ② 有効期限（10分超過してたら無効）
    if (now - t >= BLOCK_LIMIT_MS) return null

    // ③ さらに保守的に24時間超過でも無効（任意）
    const ONE_DAY = 24 * 60 * 60 * 1000
    if (now - t > ONE_DAY) return null

    return t
  } catch {
    return null
  }
}


function saveBlockStart(pid: string, t: number) {
  try { localStorage.setItem(BLOCK_START_KEY(pid), String(t)) } catch {}
}

function clearBlockStart(pid: string) {
  try { localStorage.removeItem(BLOCK_START_KEY(pid)) } catch {}
}

function startBlockTimerFor(pid: string, reset = false) {
  stopBlockTimer()

  const now = Date.now()
  let start: number | null = null

  if (!reset) {
    start = loadBlockStart(pid)   // ← 有効期限チェック込み
  }
  if (start == null) {
    // 復元できなかった or 古かった → 新規開始
    start = now
    clearBlockStart(pid)
  }

  blockStartedAt.value = start
  saveBlockStart(pid, start)

  tickBlockTimer(pid) // 即時更新
  blockTimer = window.setInterval(() => tickBlockTimer(pid), 250)
}



function stopBlockTimer() {
  if (blockTimer != null) { clearInterval(blockTimer); blockTimer = null }
}

function tickBlockTimer(pid: string) {
  if (blockStartedAt.value == null) { remainingMs.value = BLOCK_LIMIT_MS; return }
  const elapsed = Date.now() - blockStartedAt.value
  const remain  = Math.max(0, BLOCK_LIMIT_MS - elapsed)
  remainingMs.value = remain

  // ★ 半分経過していてまだ動画を1本も開いていないなら警告
  if (!halfWarnShown.value && elapsed >= BLOCK_LIMIT_MS / 2) {
    const opened = openedOnceThisBlock.value || loadOpenedFlag(pid)
    if (!opened) {
      halfWarnShown.value = true
      halfWarnOpen.value = true
    }
  }

  if (remain <= 0) onTimeUp(pid)
}



function onTimeUp(pid: string) {
   if (blockTimer == null) return
  stopBlockTimer()

  // もし再生中なら watch_end を先に送る（既存）
  if (playerOpen.value && currentVideo.value) {
    stopModalTimer(true)
    finalSelectSent.value = true
    postWatchEndEvent(currentVideo.value, 'timeup')
  }

  // ★★★ ここで「動画文脈」を必ずクリア（未視聴遷移のときが肝）
  try {
    sessionStorage.setItem('manzai-current-performer-id', pid)
    sessionStorage.setItem('manzai-current-performer-name', currentPerformerName.value || '')
    sessionStorage.removeItem('manzai-current-video-id')
    sessionStorage.removeItem('manzai-current-video-title')
    sessionStorage.removeItem('manzai-watchend-pending') // 念のため
  } catch {}

  stopModalTimer(true)
  playerOpen.value = false
  if (ytPlayer) { ytPlayer.destroy?.(); ytPlayer = null }
  playerSrc.value = null

  // flow=timeup を明示
  router.push({ path: '/question', query: { flow: 'timeup', pid } })
  try { markPerformerCompleted(pid) } catch {}


  // 時間切れ → 次インデックスへ前進
  try {
    const q = loadQueue()
    let idx = loadIndex()
    const curPos = q.indexOf(pid)
    if (curPos >= 0) idx = curPos + 1
    else idx = idx + 1
    saveIndex(idx)
  } catch {}
}

// 投稿日の計算 
function calcYearsAgoFromDate(dateStr?: string): number | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return null

  const now = new Date()
  let y = now.getFullYear() - d.getFullYear()

  // 今年の誕生日（=月日）がまだ来ていなければ 1 年引く
  const notPassedYet =
    now.getMonth() < d.getMonth() ||
    (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())
  if (notPassedYet) y -= 1

  return Math.max(0, y)
}

function yearsAgoLabel(v: VideoItem): string {
  const y = calcYearsAgoFromDate(v.publishedAt)
  if (y == null) return ''
  // 0年は「今年」と表現。0年前と出したい場合は次行を `${y}年前` に変更
  return y === 0 ? '今年' : `${y}年前`
}

// ---- 動画順のランダム保持 ----
const VIDEO_ORDER_KEY = 'manzai-video-order'
function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

const videoById = computed<Record<string, VideoItem>>(() =>
  Object.fromEntries(videos.value.map(v => [v.id, v]))
)
const videoOrder = ref<Record<string, string[]>>({})
const groupKey = (v?: any) => v?.performerId || v?.id?.split('-')[0] || ''

function ensureVideoOrder() {
  const groups: Record<string, string[]> = {}
  for (const v of videos.value) {
    const pid = groupKey(v)
    ;(groups[pid] ||= []).push(v.id)
  }
  let saved: Record<string, string[]> | null = null
  try { saved = JSON.parse(localStorage.getItem(VIDEO_ORDER_KEY) || 'null') } catch {}
  const out: Record<string, string[]> = {}
  for (const pid of Object.keys(groups)) {
    const allIds = groups[pid]
    if (saved?.[pid]) {
      const base = saved[pid].filter(id => allIds.includes(id))
      const newcomers = allIds.filter(id => !base.includes(id))
      shuffle(newcomers)
      out[pid] = base.concat(newcomers)
    } else {
      out[pid] = shuffle([...allIds])
    }
  }
  videoOrder.value = out
  try { localStorage.setItem(VIDEO_ORDER_KEY, JSON.stringify(out)) } catch {}
}

// 並び替えモード：デフォルトは新しい順
const sortMode = ref<'new' | 'popular'>('new')

// 投稿日のタイムスタンプ取得（未設定は 0 で最後尾）
function publishedTs(v: VideoItem): number {
  const t = v.publishedAt ? new Date(v.publishedAt).getTime() : NaN
  return Number.isFinite(t) ? t : 0
}

// 置き換え版 displayedVideos（並び替えロジックをここで反映）
const displayedVideos = computed(() => {
  const pid = currentPerformerId.value
  if (!pid) return []

  const watchedIds = watchedIdsFor(pid)
  const allOfThisPerformer = videos.value.filter(v => groupKey(v) === pid)

  // ← ここも .value が必要
  let next = Object.keys(videoLabelMap.value).length
  for (const v of allOfThisPerformer) {
    if (!videoLabelMap.value[v.id]) {
      videoLabelMap.value[v.id] = alphaLabel(next)
      next++
    }
  }

  const remaining = allOfThisPerformer.filter(v => !watchedIds.includes(v.id))

  if (sortMode.value === 'new') {
    remaining.sort((a, b) => publishedTs(b) - publishedTs(a) || (b.views - a.views))
  } else if (sortMode.value === 'popular') {
    remaining.sort((a, b) => (b.views - a.views) || (publishedTs(b) - publishedTs(a)))
  }
  return remaining
})


// === 選択時間の計測（一覧が描画された瞬間の時刻） ===
const selectionShownAt = ref<number>(Date.now())

// 一覧が見えるタイミングを明示的に記録する関数
function markListShown() {
  selectionShownAt.value = Date.now()
  // console.log('[selectTimer] list shown at', new Date(selectionShownAt.value).toISOString())
}


// 一覧の中身が変わったら（初回描画を含む）記録
watch(displayedVideos, (list) => {
  // markListShown()
  const pid = currentPerformerId.value || ''
  // console.log('[selectTimer] items=', list.length, 'watchedIds=', pid ? watchedIdsFor(pid) : [])
})

// 漫才師が切り替わったときにも記録（最初の1本の基準）
watch(currentPerformerId, () => {
  markListShown()
})


// performer が切り替わったときにもリセット（抜け漏れ防止）
watch(currentPerformerId, (pid) => {
  selectionShownAt.value = Date.now()
  // console.log('[selectTimer] performer changed to', pid, 'at', new Date(selectionShownAt.value).toISOString())
})

// いま表示されているタイルの中での位置(1..N) — 見つからなければ -1
function positionInGrid(v: VideoItem): number {
  const idx = displayedVideos.value.findIndex(x => x.id === v.id)
  return idx >= 0 ? (idx + 1) : -1
}

function setRoundFromState() {
  const q = loadQueue()
  let idx = loadIndex()
  if (q.length === 0) return

  // すべて終わっていたら最終へ
  if (idx >= Math.min(q.length, TARGET_PERFORMERS)) {
    router.replace({ path: '/final_question' })
    return
  }

  const pid = q[idx]
  // 画面＆タイマー開始（復元なのでreset=false）
  setCurrentPerformer(pid, /*resetTimer=*/false)
  // console.log('[WORK] now performer (queue)=', pid, 'idx=', idx, 'queue=', q)
}
startBlockTimerFor(currentPerformerId.value!, /*reset=*/true)


// ---- JSON 読み込み ----
onMounted(async () => {
  if (import.meta.env.DEV) {
  localStorage.removeItem('manzai-watched-by-performer-v1');
  sessionStorage.removeItem('manzai-completed-performers');
  sessionStorage.removeItem('manzai-go-next-on-return');
}
  const base = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/')
  const jsonPath = `${base}data/manzai_data.json`
  // const jsonPath = `${base}data/else_manzai_data.json`
  try {
    const res = await fetch(jsonPath, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('application/json')) {
      const text = await res.text()
      throw new Error(`Not JSON (content-type='${ct}'): sample=${text.slice(0,80)}`)
    }
    const payload = await res.json()
    const withBase = (p?: string) => (!p || /^https?:\/\//i.test(p)) ? p : base + p.replace(/^\//, '')
    const arr = Array.isArray(payload?.videos) ? payload.videos : []
    videos.value = arr.map((v: any) => {
      const raw = v.videoUrl ?? v.videoURL ?? (v.youtubeId ? `https://www.youtube.com/watch?v=${v.youtubeId}` : undefined)
      return { ...v, thumbnailUrl: withBase(v.thumbnailUrl), graphImageUrl: withBase(v.graphImageUrl), videoUrl: withBase(raw) }
    })
  } catch (e) {
    // console.error('[work] json load error =>', e)
  } finally {
    loading.value = false
  }
})

watch(loading, (isLoading) => {
  if (isLoading) return
  if (!videos.value.length) return

  if (!rounds.currentId()) {
    rounds.start(videos.value, ROUND_SIZE)
    // console.log('[WORK] performer order (fallback start)=', rounds.state())
  }
  ensureVideoOrder()
  // ★ 初回だけユニーク漫才師キューを作る（セッション永続）
let q = loadQueue()
if (q.length === 0) {
  q = buildUniquePerformerIds()
  // 必要ならここでシャッフル
  q.sort(() => Math.random() - 0.5)
  // 4組だけ使うならスライス
  if (q.length > TARGET_PERFORMERS) q = q.slice(0, TARGET_PERFORMERS)
  saveQueue(q)
  saveIndex(0) // 最初の組から
}


  // まず戻り処理（必要なら中で setCurrentPerformer 済む）
  if (maybeAdvanceAfterReturn()) return

  // 通常復元
  setRoundFromState()
})

onActivated(() => {
  if (maybeAdvanceAfterReturn()) return
  setRoundFromState()
})

function setCurrentPerformer(pid: string, resetTimer = false) {
  halfWarnShown.value = false
halfWarnOpen.value = false
openedOnceThisBlock.value = loadOpenedFlag(pid)

  // 画面側
  currentPerformerId.value = pid
  const any = videos.value.find(v => groupKey(v) === pid)
  currentPerformerName.value = any?.performerName || pid
  startBlockTimerFor(pid, /*reset=*/resetTimer)
  try { sessionStorage.setItem('manzai-current-performer-id', pid) } catch {}

  // rounds 側も同期（存在チェックを厳密に）
  const r: any = rounds
  try {
    if (r && typeof r.setCurrentId === 'function') {
      r.setCurrentId(pid)
      return
    }

    if (
      r &&
      typeof r.forceAdvance === 'function' &&
      typeof r.currentId === 'function'
    ) {
      let guard = 0
      while (r.currentId() !== pid && guard++ < 16) {
        const nxt = r.forceAdvance()
        if (!nxt) break
        if (nxt === pid) break
      }
    }
  } catch { }
  setTaskIndexForCurrent()
}

// ★ 漫才師キュー管理（重複防止＆確実に前進）
const PERFORMER_QUEUE_KEY = 'manzai-performer-queue-v1'
const PERFORMER_INDEX_KEY = 'manzai-performer-index-v1'

// ユニークな漫才師ID列（動画から抽出）
function buildUniquePerformerIds(): string[] {
  const ids = new Set<string>()
  for (const v of videos.value) ids.add(groupKey(v))
  return Array.from(ids)
}

// セッションにキューを保存/読込
function loadQueue(): string[] {
  try {
    const raw = sessionStorage.getItem(PERFORMER_QUEUE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}
function saveQueue(q: string[]) {
  try { sessionStorage.setItem(PERFORMER_QUEUE_KEY, JSON.stringify(q)) } catch {}
}
function loadIndex(): number {
  try { return Math.max(0, Number(sessionStorage.getItem(PERFORMER_INDEX_KEY) || 0)) } catch { return 0 }
}
function saveIndex(i: number) {
  try { sessionStorage.setItem(PERFORMER_INDEX_KEY, String(i)) } catch {}
}



onActivated(() => {
   if (maybeAdvanceAfterReturn()) return
  // 戻りフラグが無い場合は“現行漫才師で復元再開”
  const pid = rounds.currentId()
  if (pid) {
    currentPerformerId.value = pid
    const any = videos.value.find(v => groupKey(v) === pid)
    currentPerformerName.value = any?.performerName || pid
    startBlockTimerFor(pid, /*reset=*/false)
  }
})

//タスク内での動画の順番を保存
// ▼ 採番状態（タスクごとに初期化）
const INDEX_STATE_KEY = 'manzai-indexnum-state-v2'
// 形: { lastTaskIndex: number, perPid: Record<string, number> }

function loadIndexState() {
  try { return JSON.parse(sessionStorage.getItem(INDEX_STATE_KEY) || 'null') || {} } catch { return {} }
}
function saveIndexState(s: any) {
  try { sessionStorage.setItem(INDEX_STATE_KEY, JSON.stringify(s)) } catch {}
}
function ensureIndexState() {
  const curTask = getTaskIndexForSend()
  const st = loadIndexState()
  if (!st.lastTaskIndex || st.lastTaskIndex !== curTask) {
    const fresh = { lastTaskIndex: curTask, perPid: {} as Record<string, number> }
    saveIndexState(fresh)
    return fresh
  }
  return st
}

// この漫才師ブロックで「次の番号」を採番して返す（毎回openで+1）
function nextIndexForOpen(pid: string): number {
  const st = ensureIndexState()
  const cur = (st.perPid[pid] || 0) + 1
  st.perPid[pid] = cur
  saveIndexState(st)
  return cur
}

// 今開いている動画インスタンス（この回）の mode / indexNum
const currentOpenIndexNum = ref<number | null>(null)
const currentOpenMode = ref<'new' | 'popular' | null>(null)


// ---- プレイヤー ----
const playerOpen = ref(false)
const playerSrc  = ref<string | null>(null)
const playerType = ref<'youtube' | 'mp4' | 'unknown'>('unknown')
const currentTitle = ref('')
const currentVideo = ref<VideoItem | null>(null)


function parseYouTubeId(url: string): string | null {
  try {
    const u = new URL(url, window.location.origin)
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1)
    const v = u.searchParams.get('v'); if (v) return v
    const m = u.pathname.match(/\/(embed|shorts)\/([A-Za-z0-9_-]{6,})/); return m ? m[2] : null
  } catch {
    const m2 = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{6,})/); return m2 ? m2[1] : null
  }
}
const ytMount = ref<HTMLDivElement | null>(null)
let ytPlayer: any = null
let ytApiReady: Promise<void> | null = null
let building = false

function ensureYTAPI(): Promise<void> {
  if (ytApiReady) return ytApiReady
  ytApiReady = new Promise<void>((resolve) => {
    if ((window as any).YT?.Player) return resolve()
    const s = document.createElement('script')
    s.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(s)
    ;(window as any).onYouTubeIframeAPIReady = () => resolve()
  })
  return ytApiReady
}

const currentTimeSec = ref(0); 

async function createYTPlayer(id: string) {
  if (building) return
  building = true
  try {
    await ensureYTAPI()
    await nextTick() // ダイアログ描画完了を待つ
    if (!ytMount.value) return
    if (ytPlayer) { ytPlayer.destroy?.(); ytPlayer = null }

    const YTGlobal = (window as any).YT
    if (!YTGlobal?.Player) {
      // console.error('[YT] API not ready')
      return
    }

    ytPlayer = new YTGlobal.Player(ytMount.value, {
      videoId: id,
      host: 'https://www.youtube-nocookie.com',
      playerVars: {
        autoplay: 1,
        playsinline: 1,
        rel: 0,
        modestbranding: 1,
        controls: 1,
      },
      events: {
        onReady: (e: any) => { 
          startYTSeekPolling();
           try {
            const t = ytPlayer?.getCurrentTime?.() ?? 0;
             const r = ytPlayer?.getPlaybackRate?.() ?? 1;
            playerDurationSec.value = ytPlayer?.getDuration?.() ?? 0;
            pushSeekLog({ type: 'ratechange', rate: r, t, ts: Date.now() });
      } catch {}
         },
        onStateChange: (e:any) => {
          const YT = (window as any).YT
          const t = ytSafeTime();
          const ts = Date.now();
          if (e.data === YT.PlayerState.PLAYING)  pushSeekLog({ type:'play',  t, ts });
          if (e.data === YT.PlayerState.PAUSED)   pushSeekLog({ type:'pause', t, ts });
          if (e.data === YT.PlayerState.ENDED)    { pushSeekLog({ type:'ended', t, ts }); postSelectFinal('ended'); }
          if (e.data === YT.PlayerState.BUFFERING)pushSeekLog({ type:'buffering', t, ts });
          if (!YT) return
          if (e.data === YT.PlayerState.ENDED) {
            postSelectFinal('ended')
          }
        },
        onPlaybackRateChange: (ev: any) => {
          const t = ytSafeTime();
          pushSeekLog({ type: 'ratechange', rate: ev.data, t, ts: Date.now() });
        },
      }
    })

    const loop = () => {
      if (ytPlayer?.getCurrentTime) {
        currentTimeSec.value = ytPlayer.getCurrentTime();
        // console.log(currentTimeSec.value);
      }
      requestAnimationFrame(loop);
    };
    loop(); 
  } catch (err) {
    // console.error('[YT] build error', err)
  } finally {
    building = false
  }
}



//シークバー操作ログ関連
// 追加: YT用シーク検出ループ
let ytSeekTimer: number | null = null;
let ytLastTickMs = 0;
let ytLastTime = 0;
let ytLastState: number | null = null;

function ytSafeTime(): number {
  try { return ytPlayer?.getCurrentTime?.() ?? 0 } catch { return 0 }
}
function ytSafeRate(): number {
  try { return ytPlayer?.getPlaybackRate?.() ?? 1 } catch { return 1 }
}

function startYTSeekPolling() {
  stopYTSeekPolling();
  ytLastTickMs = Date.now();
  ytLastTime = ytSafeTime();
  ytLastState = ytPlayer?.getPlayerState?.() ?? null;
  ytSeekTimer = window.setInterval(() => {
    const now = Date.now();
    const dt = (now - ytLastTickMs) / 1000;
    const cur = ytSafeTime();
    const state = ytPlayer?.getPlayerState?.();
    const rate = ytSafeRate();

    if (state === (window as any).YT?.PlayerState?.PLAYING) {
      const expected = ytLastTime + dt * rate;
      if (Math.abs(cur - expected) >= SEEK_THRESHOLD) {
        pushSeekLog({ type: 'seek', from: ytLastTime, to: cur, reason: 'user', ts: now });
      }
    } else {
      if (Math.abs(cur - ytLastTime) >= SEEK_THRESHOLD) {
        pushSeekLog({ type: 'seek', from: ytLastTime, to: cur, reason: 'paused-scrub', ts: now });
      }
    }

    ytLastTime = cur;
    ytLastTickMs = now;
    ytLastState = state ?? null;
  }, SEEK_POLL_MS);
}
function stopYTSeekPolling() {
  if (ytSeekTimer) { clearInterval(ytSeekTimer); ytSeekTimer = null; }
}



function postSelectFinal(reason: 'ended' | 'switch') {
  if (!currentVideo.value) return
  if (finalSelectSent.value) return
  stopModalTimer(true)
  finalSelectSent.value = true
  // ここを「select」→「watch_end」送信へ
  postWatchEndEvent(currentVideo.value, reason)
}
function onPlayerToggle(isOpen: boolean) {
  if (!isOpen) {
    postSelectFinal('switch')   // ← 中断も watch_end
    markListShown()
  }
  if (!isOpen) stopModalTimer(true)
}


const COMPLETED_SET_KEY = 'manzai-completed-performers'

function loadCompletedSet(): Set<string> {
  try { return new Set(JSON.parse(sessionStorage.getItem(COMPLETED_SET_KEY) || '[]')) } catch { return new Set() }
}
function saveCompletedSet(s: Set<string>) {
  try { sessionStorage.setItem(COMPLETED_SET_KEY, JSON.stringify([...s])) } catch {}
}
function markPerformerCompleted(pid?: string | null) {
  if (!pid) return
  const s = loadCompletedSet()
  s.add(pid)
  saveCompletedSet(s)
}
function setTaskIndexForCurrent() {
  const idx = loadCompletedSet().size + 1
  try { sessionStorage.setItem(TASK_INDEX_KEY, String(idx)) } catch {}
}
const currentVideoEl = ref<HTMLVideoElement | null>(null) // HTML5 video 用

// 追加: MP4用シーク検出
let mp4LastTime = 0;
let mp4SeekingFrom: number | null = null;
let onMp4TimeUpdate: ((e: Event) => void) | null = null;
let onMp4Seeking: ((e: Event) => void) | null = null;
let onMp4Seeked: ((e: Event) => void) | null = null;
let onMp4RateChange: ((e: Event) => void) | null = null;

function attachMp4SeekHandlers() {
  const el = currentVideoEl.value;
  if (!el) return;

  // 初期値
  mp4LastTime = el.currentTime ?? 0;
  mp4SeekingFrom = null;

  // timeupdate: 現在位置を追跡
  onMp4TimeUpdate = () => {
    mp4LastTime = el.currentTime ?? mp4LastTime;
  };

  // seeking: ユーザがシークを始めた瞬間の位置を記録
  onMp4Seeking = () => {
    mp4SeekingFrom = mp4LastTime;
  };

  onMp4RateChange = () => {
    pushSeekLog({ type: 'ratechange', rate: el.playbackRate, t: el.currentTime ?? 0, ts: Date.now() });
  };
  el.addEventListener('ratechange', onMp4RateChange);

  // seeked: シーク完了時に from→to を確定
  onMp4Seeked = () => {
    const to = el.currentTime ?? mp4LastTime;
    const from = mp4SeekingFrom ?? mp4LastTime;
    if (Math.abs(to - from) >= SEEK_THRESHOLD) {
      pushSeekLog({ type: 'seek', from, to, reason: 'user', ts: Date.now() });
    }
    mp4LastTime = to;
    mp4SeekingFrom = null;
  };

  el.addEventListener('timeupdate', onMp4TimeUpdate);
  el.addEventListener('seeking', onMp4Seeking);
  el.addEventListener('seeked', onMp4Seeked);
}

function detachMp4SeekHandlers() {
  const el = currentVideoEl.value;
  if (!el) return;
  if (onMp4TimeUpdate) el.removeEventListener('timeupdate', onMp4TimeUpdate);
  if (onMp4Seeking) el.removeEventListener('seeking', onMp4Seeking);
  if (onMp4Seeked) el.removeEventListener('seeked', onMp4Seeked);
  if (onMp4RateChange) el.removeEventListener('ratechange', onMp4RateChange);
  onMp4TimeUpdate = onMp4Seeking = onMp4Seeked = null;
}


// === 送信フラグ（同じ動画での最終送信の二重防止） ===
const finalSelectSent = ref(false)

// ★ 共通: kind: 'select' を送る関数
async function postSelectEvent(v: VideoItem, extra?: {
  select_ms?: number,
  end_reason?: 'open' | 'ended' | 'switch' | 'timeup',
  watched_ms?: number,
  mode?: 'new' | 'popular',
  index_num?: number
}) {
  const uuid = localStorage.getItem(USER_ID_KEY) || null
  const { sex, age } = getUserBasics()
  const graph = getGraphFlag()
  const taskIndex = getTaskIndexForSend()

  // 一覧上の位置（見つからない場合は 0）
  const pos = (() => {
    const p = positionInGrid(v)
    return Number.isFinite(p) && p > 0 ? p : 0
  })()
  try {
    sessionStorage.setItem(TASK_INDEX_KEY, String(taskIndex))
  } catch{}

  const payload = {
    kind: 'select',
    uuid, sex, age, graph,
    task_index: taskIndex,
    select_ms: Math.max(0, Math.round(extra?.select_ms ?? 0)),
    present_rank: pos,
    performer_id: v.performerId ?? groupKey(v),
    performer_name: v.performerName ?? null,
    video_id: v.id ?? null,
    video_title: v.title ?? null,
    watched_ms: Math.max(0, Math.round(extra?.watched_ms ?? 0)),
    end_reason: extra?.end_reason ?? 'open',   // 参考情報（サーバ側が無視してもOK）
    survey_type: extra?.end_reason ?? 'open',
    mode: extra?.mode ?? (currentOpenMode.value ?? sortMode.value),
    index_num: extra?.index_num ?? (currentOpenIndexNum.value ?? 0),
    timestamp: new Date().toISOString(),
  }

  await postToDB(payload)
}

async function postWatchEndEvent(v: VideoItem, reason: 'ended' | 'switch' | 'timeup') {
  const uuid = localStorage.getItem(USER_ID_KEY) || null
  const { sex, age } = getUserBasics()
  const graph = getGraphFlag()
  const taskIndex = getTaskIndexForSend()

  // question側でも参照できるよう視聴時間をセッションに残す
  try { 
    sessionStorage.setItem('manzai-last-watched-ms', String(modalOpenMs.value))
  } catch {}

  const payload = {
    kind: 'watch_end',
    uuid, sex, age, graph,
    task_index: taskIndex,
    performer_id: v.performerId ?? groupKey(v),
    performer_name: v.performerName ?? null,
    video_id: v.id ?? null,
    video_title: v.title ?? null,
    watched_ms: modalOpenMs.value,
    end_reason: reason,
    survey_type: reason, 
    mode: currentOpenMode.value ?? sortMode.value,
    index_num: currentOpenIndexNum.value ?? 0,
    survey_answers_json: seekLogs.value,
    timestamp: new Date().toISOString(),
  }
  await postToDB(payload)
}



async function openPlayer(v: VideoItem) {
  clearSeekLogs();                   // ★ 新規動画の前にログを空に
  stopYTSeekPolling();               // ★ 前のYTポーリング停止
  detachMp4SeekHandlers();  
  const pid = currentPerformerId.value || groupKey(v)
  if (pid) saveOpenedFlag(pid)

    // ★ ここで「今回の視聴」の indexNum / mode を確定
  const idx = nextIndexForOpen(pid)
  currentOpenIndexNum.value = idx
  currentOpenMode.value = sortMode.value  // 'new' or 'popular'

  modalOpenMs.value = 0
  finalSelectSent.value = false // ← この動画の最終送信はまだ

  // 選択時間
  const selectMsRaw = Date.now() - selectionShownAt.value
  const selectMs = Math.max(0, Math.round(Number.isFinite(selectMsRaw) ? selectMsRaw : 0))

  // ▼ ここを置き換え：初期送信は watched_ms=0, end_reason='open'
  await postSelectEvent(v, {
    select_ms: selectMs,
    end_reason: 'open',
    watched_ms: 0,
    mode: currentOpenMode.value ?? sortMode.value,
    index_num: currentOpenIndexNum.value ?? 0
  })

  // （以下、プレイヤー起動は従来どおり）
  currentTitle.value = v.title
  currentVideo.value = v
  const url = v.videoUrl || ''
  const id  = parseYouTubeId(url) || v.youtubeId || null
  playerOpen.value = true

  await nextTick()
  await new Promise(r => requestAnimationFrame(() => r(null)))
  startModalTimer()

  if (id) {
    playerType.value = 'youtube'
    playerSrc.value = null
    await createYTPlayer(id)
  } else if (/\.(mp4|webm|ogg)(?:\?.*)?$/i.test(url)) {
    playerType.value = 'mp4'
    playerSrc.value = url
    await nextTick();
    attachMp4SeekHandlers(); 
  } else {
    // console.warn('[player] unsupported video url:', url)
    playerType.value = 'unknown'
    playerSrc.value = null
  }

    try {
    sessionStorage.setItem('manzai-current-performer-id', groupKey(v))
    sessionStorage.setItem('manzai-current-performer-name', v.performerName ?? '')
    sessionStorage.setItem('manzai-current-video-id', v.id ?? '')
    sessionStorage.setItem('manzai-current-video-title', v.title ?? '')
  } catch { }
  
}


function maybeAdvanceAfterReturn() {
  // question から戻ってきて「次へ進む」フラグがある？
  let lastPid: string | null = null
  try {
    lastPid = sessionStorage.getItem(NEXT_ON_RETURN_KEY)
    if (!lastPid) return false
    sessionStorage.removeItem(NEXT_ON_RETURN_KEY)
    clearBlockStart(lastPid)
    stopBlockTimer()
  } catch {}

  const q = loadQueue()
  let idx = loadIndex()

  // lastPid の次へ進める（安全側）
  const pos = q.indexOf(lastPid || '')
  if (pos >= 0) idx = pos + 1
  else idx = idx + 1
  saveIndex(idx)

  // 終わってたら最終へ
  if (idx >= Math.min(q.length, TARGET_PERFORMERS)) {
    router.replace({ path: '/final_question' })
    return true
  }

  // 次の漫才師でブロック開始（リセット）
  const nextPid = q[idx]
  setCurrentPerformer(nextPid, /*resetTimer=*/true)
  // console.log('[WORK] advance to next (queue)=', nextPid, 'idx=', idx, 'queue=', q)
  return true
}


function closePlayer() {
  postSelectFinal('switch')
  playerOpen.value = false;
  stopYTSeekPolling(); 
  if (ytPlayer) { ytPlayer.destroy?.(); ytPlayer = null }
  detachMp4SeekHandlers();
  playerSrc.value = null;
  // ×ボタン等で閉じて一覧へ戻った時も記録
  markListShown();
}



onBeforeUnmount(() => {
  stopYTSeekPolling();
  if (ytPlayer) {
    ytPlayer.destroy?.(); ytPlayer = null
  }
  detachMp4SeekHandlers();
})

// ---- 表示フォーマッタ ----
function formatViews(n: number) {
  if (n >= 1_0000_0000) return `${(n / 1_0000_0000).toFixed(1)}億`
  if (n >= 1_0000) return `${Math.round(n / 1_0000)}万`
  return n.toLocaleString()
}
function formatDuration(sec = 0) {
  const m = Math.floor(sec / 60), s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// === 残り時間の表示（mm:ss） ===
const remainingText = computed(() => {
  const ms = Math.max(0, Number(remainingMs.value) || 0)
  const m  = Math.floor(ms / 60000)
  const s  = Math.floor((ms % 60000) / 1000)
  return `${m}:${String(s).padStart(2, '0')}`
})

// プログレス（任意：%）
const progressPct = computed(() => {
  const used = BLOCK_LIMIT_MS - Math.max(0, Number(remainingMs.value) || 0)
  return Math.min(100, Math.max(0, Math.round((used / BLOCK_LIMIT_MS) * 100)))
})

// 色変化用（任意）
const isHurry = computed(() => remainingMs.value <= 60_000) // 残り15秒で赤字

const playerDurationSec = ref(0);


type GraphConfig = {
  imgWidth: number;
  imgHeight: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  seekBarYRatio?: number;
};

const graphConfigMap: Record<string, GraphConfig> = {
  kabeposter: {
    imgWidth: 1084, 
    imgHeight: 245,
    x1: 85,
    y1: 32,
    x2: 1075,
    y2: 187,
    seekBarYRatio: 0.5,
  },
  sayaka: {
    imgWidth: 1067,
    imgHeight: 245,
    x1: 67,
    y1: 34,
    x2: 1034,
    y2: 187,
    seekBarYRatio: 0.5,
  },
  milkboy: {
    imgWidth: 1067,
    imgHeight: 245,
    x1: 68,
    y1: 34,
    x2: 1058,
    y2: 189,
    seekBarYRatio: 0.5,
  },
  mitorizu: {
    imgWidth: 1075,
    imgHeight: 245,
    x1: 76,
    y1: 34,
    x2: 1066,
    y2: 188,
    seekBarYRatio: 0.5,
  },
  takion: {
    imgWidth: 1075,
    imgHeight: 245,
    x1: 76,
    y1: 34,
    x2: 1066,
    y2: 186,
    seekBarYRatio: 0.5,
  },
};

// ---- ② 今の動画に対応する設定を取る computed ----
const currentConfig = computed<GraphConfig>(() => {
  const performerId = currentVideo.value?.performerId ?? "kabeposter";
  return graphConfigMap[performerId] ?? graphConfigMap["kabeposter"];
});

// ---- ③ グラフ上の緑の枠（オーバーレイ）のスタイル ----
const graphOverlayStyle = computed(() => {
  const cfg = currentConfig.value;

  const leftRatio   = cfg.x1 / cfg.imgWidth;
  const topRatio    = cfg.y1 / cfg.imgHeight;
  const widthRatio  = (cfg.x2 - cfg.x1) / cfg.imgWidth;
  const heightRatio = (cfg.y2 - cfg.y1) / cfg.imgHeight;

  return {
    left:   leftRatio   * 100 + '%',
    top:    topRatio    * 100 + '%',
    width:  widthRatio  * 100 + '%',
    height: heightRatio * 100 + '%',
  };
});

const seekBarTopPercent = computed(() => {
  const cfg = currentConfig.value;
  const ratio = cfg.seekBarYRatio ?? 0.5; // 指定なければ真ん中
  return ratio * 100;
});


// ---- ④ シークバーの進行度（これはそのままでOK） ----
const progressRatio = computed(() => {
  const T = playerDurationSec.value || currentVideo.value?.durationSec || 0;
  const t = currentTimeSec.value;
  if (!T) return 0;
  return Math.min(1, Math.max(0, t / T));
});

const seekPercent = computed(() => progressRatio.value * 100);

</script>

<style scoped>
.rowcard{ margin-bottom: 12px; }
.rowgrid{ display: grid; grid-template-columns: auto 1fr; gap: 16px; align-items: stretch; padding: 12px; }
.rowgrid.no-graph{ grid-template-columns: auto; } /* グラフ無し→左カラムのみ */
.left{ min-width: 0; }
.right{ min-width: 0; }
.thumb{ position:relative; cursor: pointer; }
.thumb-img{ display:block; }
.badge{ position:absolute; right:8px; bottom:8px; background:rgba(0,0,0,.85); color:#fff; font-size:12px; padding:2px 6px; border-radius:4px; }
.card-title{ font-weight:600; line-height:1.35; }
.line-2{ display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.meta{ color: rgba(0,0,0,.6); font-size: 15px; margin-top: 2px; }
.graph-wrap{ background: transparent; border-radius: 12px; overflow: hidden; display:flex; align-items:center; height: 100%; }
/* モーダル全体：縦レイアウト＆高さ制限 */
.player-card{
  max-height: 110vh;            /* v-dialog の max-height と揃える */
  display: flex;
  flex-direction: column;
}

.player-graphBox {
  position: relative;
  width: 100%;
}

.player-graph-img {
  display: block;
  width: 100%;
  height: auto;
}

/* グラフ領域（黒い四角と同じ位置・サイズ） */
 /* .graph-overlay-rect {
  position: absolute;  
  border: 2px solid #00c853;
  pointer-events: none;
  box-sizing: border-box;
}

.graph-seekbar {
  position: absolute;   
  top: 0;
  bottom: 0;
  width: 2px;
  background: #000;
  pointer-events: none;
}  */

/* オーバーレイ枠はそのまま */
.graph-overlay-rect {
  position: absolute;
  pointer-events: none;
  box-sizing: border-box;
}

/* シークバー全体のラッパ：縦位置だけを決める */
.graph-seekbar-wrapper {
  position: absolute;
  left: 0;
  right: 0;
  height: 16px;              /* 丸の直径くらい */
  transform: translateY(-50%);
  pointer-events: none;
}

/* 全体トラック（未再生部分） */
.graph-seekbar-track {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 4px;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.2);  /* 薄いグレーっぽい棒 */
}

/* 再生済み部分：左端から丸の位置までだけ表示される */
.graph-seekbar-fill {
  position: absolute;
  left: 0;
  top: 50%;
  height: 4px;
  transform: translateY(-50%);
  background: #333;
}

/* 丸いハンドル */
.graph-seekbar-thumb {
  position: absolute;
  top: 50%;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #333;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.4);
  pointer-events: none;
}



@media (max-width: 959px){
  .rowgrid{ grid-template-columns: 1fr; }
  .thumb-box{ width: 100% !important; }
  .rowcard{ margin-bottom: 16px; }
}


/* タイル（サムネ） */
.tile{
  position: relative;
  border-radius: 12px;
  overflow: hidden;
}
.tile-thumb{
  display:block;
  width:100%;
  height:auto;
}
.tile-badge{
  position:absolute;
  right:8px;
  bottom:8px;
}
.tile-info .card-title{ margin-top: 4px; }

/* グラフ画像（縦積み・クリックで拡大） */
.tile-graph{ width:100%; }
.graph-img{
  display:block;
  width:100%;
  height:auto;
  object-fit:contain;
  background: transparent;
  border-radius: 12px;
  cursor: default;
}

/* 大きめの残り時間バッジ */
.timebox{
  display:inline-flex;
  align-items:center;
  gap:.375rem;
  padding:.25rem .75rem;
  border-radius:12px;
  background:rgba(0,0,0,.04);
  font-size:1.75rem;       /* 大きく表示（≈ text-h4） */
  font-weight:700;
  letter-spacing:.02em;
  line-height:1.1;
}
.timebox .mono{
  font-variant-numeric: tabular-nums; /* 00:00 が揃う */
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Roboto Mono", monospace;
}
.timebox.hurry{
  color:#B00020;                       /* Vuetify error っぽい色 */
  background:rgba(176,0,32,.08);
}
/* ▼ YouTube風ピル */
.sort-toggle { gap: 8px; }
.sort-toggle :deep(.v-btn.pill) {
  border-radius: 9999px;
  font-weight: 600;
  letter-spacing: .01em;
  /* 未選択の薄い背景（ライト） */
  background: rgba(0,0,0,.06);
  color: rgba(0,0,0,.87);
  margin-bottom: 10px
}

/* 選択中（ライト） */
.sort-toggle :deep(.v-btn.pill.active) {
  background: rgba(0,0,0,.85);
  color: #fff;
}

/* ダークテーマ用の調整 */
:deep(.v-theme--dark) .sort-toggle .v-btn.pill {
  background: rgba(255,255,255,.10);
  color: rgba(255,255,255,.90);
}
:deep(.v-theme--dark) .sort-toggle .v-btn.pill.active {
  background: #fff;
  color: #121212;
}
:deep(.v-toolbar-title.title-full){
  white-space: nowrap;       /* 折り返さず */
  overflow: visible;         /* カード枠を超えても表示 */
  text-overflow: unset;      /* …を消す */
  max-width: none;
}

/* ちょい演出（任意） */
.sort-toggle :deep(.v-btn.pill.active) { box-shadow: 0 2px 8px rgba(0,0,0,.18); }

/* カードに重ねるため position を持たせる */
.rowcard { position: relative; }
.tile { position: relative; }
.alpha-chip{
  position: absolute;
  top: 8px; left: 8px;
  width: 50px; height: 50px;
  border-radius: 9999px;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700;
  font-size: 25px;          /* ご指定どおり 12px */
  background: #fff;
  color: #333;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 6px rgba(0,0,0,.12);
  user-select: none;
  pointer-events: none;
  z-index: 3;
}


</style>
