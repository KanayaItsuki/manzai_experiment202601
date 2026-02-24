<template>
  <v-container class="py-8 max-w-screen-md">
    <v-card class="rounded-xl" elevation="0" variant="outlined">
      <v-toolbar flat density="comfortable">
        <v-toolbar-title>動画視聴後アンケート</v-toolbar-title>
      </v-toolbar>
      <v-divider />

      <v-form ref="formRef" class="p-4 space-y-8">
        <section v-for="q in visibleQuestions" :key="q.id">
          <div class="q-title">{{ q.text }}</div>

          <!-- 単一選択 -->
          <v-radio-group
            v-if="q.type === 'single'"
            v-model="answers[q.id]"
            :rules="[q.required ? req : pass]"
          >
            <v-radio
              v-for="c in q.choices"
              :key="c.id"
              :label="c.label"
              :value="c.id"
            />
          </v-radio-group>


 

          <!-- ランキング（Q1） -->
<v-card
  v-else-if="q.type === 'rank'"
  variant="tonal"
  class="rounded-lg p-2"
>
  <v-list density="comfortable">
    <v-list-item
      v-for="(id, idx) in viewRanking(q)"
      :key="id"
    >
      <template #prepend>
        <v-chip size="small" class="mr-2">{{ idx + 1 }}</v-chip>
      </template>

      <v-list-item-title>{{ findChoiceLabel(q, id) }}</v-list-item-title>

      <template #append>
        <v-btn size="small" icon="mdi-chevron-up" variant="text"
          :disabled="idx === 0"
          :ripple="false"
          @click="moveRank(q, idx, -1)" 
          style="--v-hover-opacity:0; --v-focus-opacity:0; --v-activated-opacity:0;"/>
        <v-btn size="small" icon="mdi-chevron-down" variant="text"
          :disabled="idx === viewRanking(q).length - 1"
          :ripple="false"
          @click="moveRank(q, idx, +1)"
          style="--v-hover-opacity:0; --v-focus-opacity:0; --v-activated-opacity:0;"/>
      </template>
    </v-list-item>
  </v-list>

  <div class="text-right mt-1">
    <v-btn size="small" variant="text" @click="resetRank(q)">初期順に戻す</v-btn>
  </div>

  <v-messages
    :active="true"
    :messages="rankMsg(q)"
    class="text-error"
  />
</v-card>

<!-- ランキング理由（Q2） -->


<!-- 画像＋A〜F 2本選択 -->
<div v-else-if="q.type === 'reco_af_image'">
  <template v-if="getRecoConfig(env.performerId)">
    <!-- <v-img :src="getRecoImage(env.performerId, env.graphOn) || ''" class="rounded-xl mb-3" /> -->

    <!-- ここを answers[q.id] → recoLetters に -->
   <v-btn-toggle v-model="answers[q.id]" multiple class="mb-1 flex-wrap" style="gap:.5rem">

  <v-btn
    v-for="letter in LETTERS"
    :key="letter"
    :value="letter"
    :class="(answers[q.id]||[]).includes(letter) ? 'bg-primary text-white' : ''"
    :disabled="isRecoFull(q.id) && !(answers[q.id]||[]).includes(letter)"
    class="rounded-lg"
    variant="tonal"
  >{{ letter }}</v-btn>
</v-btn-toggle>
    <v-messages :active="true" :messages="recoLettersMsg(q.id)" class="text-error" />
        <!-- 選択中の可視化（A とタイトルを並べて表示） -->
    <div v-if="recoLetters.length" class="mt-1">
      <!-- <v-chip
        v-for="L in recoLetters"
        :key="L"
        class="mr-1 mb-1"
        variant="elevated"
        size="small"
      >
        {{ L }}（{{ letterToTitle(L, env.performerId) }}）
      </v-chip> -->
    </div>
    <v-img :src="getRecoImage(env.performerId, env.graphOn) || ''" class="rounded-xl mb-3" />
    <!-- <v-messages :active="true" :messages="recoLettersMsg(q.id)" class="text-error" /> -->
  </template>

  <template v-else>
    <v-alert type="info" variant="tonal" class="rounded-lg">
      このラウンドは推薦カード設問の対象外です．
    </v-alert>
  </template>
</div>

<!-- 理由：選ばれた2件ぶん（IDキーではなく letter キーで保持） -->
<div v-else-if="q.type === 'recommend_reasons'">
  <div v-if="Array.isArray(answers['q1_recoNo']) && answers['q1_recoNo'].length">
    <div v-for="letter in answers['q1_recoNo']" :key="letter" class="mb-4">
      <div class="font-weight-medium mb-1">
       <strong>{{ letter }}</strong>の推薦理由
      </div>
      <v-textarea
        v-model="answers[q.id][letter]" 
        auto-grow rows="3"
        :rules="[(v: any) => (String(v ?? '').trim().length > 0) || '必須です']"
      />
    </div>
  </div>
  <v-messages :active="true" :messages="recommendWhyMsg()" class="text-error" />
</div>

<!-- 画像＋A〜F 複数選択（Q5） -->
<div v-else-if="q.type === 'af_image_multi'">
  <template v-if="getRecoConfig(env.performerId)">
    <v-btn-toggle v-model="answers[q.id]" multiple class="mb-1 flex-wrap" style="gap:.5rem">
      <v-btn
        v-for="letter in LETTERS"
        :key="letter"
        :value="letter"
        :class="(answers[q.id]||[]).includes(letter) ? 'bg-primary text-white' : ''"
        class="rounded-lg"
        variant="tonal"
      >{{ letter }}</v-btn>
    </v-btn-toggle>

    <!-- 任意：選択中の可視化 -->
    <!--
    <div v-if="(answers[q.id]||[]).length" class="mt-1">
      <v-chip
        v-for="L in answers[q.id]"
        :key="L"
        class="mr-1 mb-1"
        variant="elevated"
        size="small"
      >{{ L }}（{{ letterToTitle(L, env.performerId) }}）</v-chip>
    </div>
    -->

    <v-img :src="getRecoImage(env.performerId, env.graphOn) || ''" class="rounded-xl mb-3" />
  </template>

  <template v-else>
    <v-alert type="info" variant="tonal" class="rounded-lg">
      このラウンドは対象外です．
    </v-alert>
  </template>
</div>





          <!-- 複数選択 -->
          <!-- <v-checkbox-group
            v-else-if="q.type === 'multi'"
            v-model="answers[q.id]"
            :rules="[q.required ? atLeastOne : pass]"
          >
            <v-checkbox
              v-for="c in q.choices"
              :key="c.id"
              :label="c.label"
              :value="c.id"
            />
          </v-checkbox-group> -->

          <!-- 記述（1行） -->
          <v-text-field
            v-else-if="q.type === 'text'"
            v-model="answers[q.id]"
            :placeholder="q.placeholder"
            :rules="[q.required ? req : pass]"
          />

          <!-- 記述（複数行） -->
          <v-textarea
            v-else-if="q.type === 'textarea'"
            v-model="answers[q.id]"
            :placeholder="q.placeholder"
            auto-grow rows="3"
            :rules="[q.required ? req : pass]"
          />

          <!-- 他タイプはここに追加 -->
        </section>

        <div class="sticky-actions">
          <v-btn
            color="primary"
            size="large"
            class="rounded-xl"
            :loading="submitting"
            :disabled="!formOK"
            @click="onSubmit"
          >
            回答を送信
          </v-btn>
          <div class="helper text-gray-500 text-sm mt-1">未回答があると送信できません．画面が切り替わらない場合は，一度リロードをしてください．</div>
        </div>
      </v-form>
    </v-card>

    
    
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
const route = useRoute()
const router = useRouter()
const BASE = import.meta.env.BASE_URL.replace(/\/?$/, '/')

//アンケートに関するデータ定義
// ★あなたの内部 performer_id を鍵にする（例: 'milkboy', 'kabeposter', 'duo3', 'duo4'）
type RecoConfig = {
  // A〜F の動画IDと（任意）タイトル
  letters: Record<'A'|'B'|'C'|'D'|'E'|'F', { id: string; title?: string }>
  // グラフあり/なしで出し分ける1枚画像のパス（/public 配下を推奨）
  images: { on: string; off: string }
}

const RECO_REGISTRY: Record<string, RecoConfig> = {
  milkboy: {
    letters: {
      A: { id: 'milkboy-007' }, B: { id: 'milkboy-006' }, C: { id: 'milkboy-005' },
      D: { id: 'milkboy-004' }, E: { id: 'milkboy-003' }, F: { id: 'milkboy-002' },
    },
    images: {
      on:  `${BASE}reco/milkboy_ongraph.png`,
      off: `${BASE}reco/milkboy_offgraph.png`, 
    },
  },
  kabeposter: {
    letters: {
      A:{ id:'kabeposter-007' }, B:{ id:'kabeposter-006' }, C:{ id: 'kabeposter-005' },
      D:{ id:'kabeposter-004' }, E:{ id:'kabeposter-003' }, F:{ id: 'kabeposter-002' },
    },
    images: {
      on:  `${BASE}reco/kabeposter_ongraph.png`,   
      off: `${BASE}reco/kabeposter_offgraph.png`,  
    },
  },
  sayaka: {
    letters: {
      A:{ id: 'sayaka-007' }, B:{ id: 'sayaka-006' }, C:{ id: 'sayaka-005' },
      D:{ id: 'sayaka-004' }, E:{ id: 'sayaka-003' }, F:{ id: 'sayaka-002' },
    },
    images: {
      on:   `${BASE}reco/sayaka_ongraph.png`,
      off:  `${BASE}reco/sayaka_offgraph.png`,
    },
  },
  mitorizu: {
    letters: {
      A:{ id: 'mitorizu-007' }, B:{ id: 'mitorizu-006' }, C:{ id: 'mitorizu-005' },
      D:{ id: 'mitorizu-004' }, E:{ id: 'mitorizu-003' }, F:{ id: 'mitorizu-002' },
    },
    images: {
      on:  `${BASE}reco/mitorizu_ongraph.png`,
      off: `${BASE}reco/mitorizu_offgraph.png`,
    },
  },
}

const LETTERS: Array<'A'|'B'|'C'|'D'|'E'|'F'> = ['A','B','C','D','E','F']

function getRecoConfig(pid: string | null): RecoConfig | null {
  return pid ? (RECO_REGISTRY[pid] || null) : null
}
function getRecoImage(pid: string | null, graphOn: boolean): string | null {
  const conf = getRecoConfig(pid)
  if (!conf) return null
  return graphOn ? conf.images.on : conf.images.off
}
function letterToId(letter: string, pid: string | null): string {
  const conf = getRecoConfig(pid)
  return conf?.letters?.[letter as keyof RecoConfig['letters']].id || ''
}
function letterToTitle(letter: string, pid: string | null): string {
  const conf = getRecoConfig(pid)
  return conf?.letters?.[letter as keyof RecoConfig['letters']].title || letter
}
function recommendLettersRule(v:any, pid:string|null): true | string {
  // レジストリが無い組では必須にしない
  if (!getRecoConfig(pid)) return true
  const arr = Array.isArray(v) ? v : []
  return arr.length === 2 ? true : '2つ選んでください'
}
function recoLettersMsg(qid:string): string[] {
  const res = recommendLettersRule(answers.value[qid], env.value.performerId)
  return res === true ? [] : [res]
}
function isRecoFull(qid:string): boolean {
  const arr = answers.value[qid] || []
  return Array.isArray(arr) && arr.length >= 2
}
const recoLetters = computed<string[]>({
  get: () => (answers.value['q1_recoNo'] ?? []) as string[],
  set: v  => { answers.value['q1_recoNo'] = Array.isArray(v) ? v : [] }
})

// 理由は「選んだ2本（IDキー）」が非空
function recommendWhyRule(): true | string {
  const letters: string[] = answers.value['q1_recoNo'] || []
  if (!getRecoConfig(env.value.performerId)) return true
  if (letters.length !== 2) return '先に2つ選んでください'
  const obj = answers.value['q2_recoWhy'] || {}
  const ok = letters.every(L => ((obj[L] ?? '').trim().length > 0))
  return ok ? true : '選んだ2本それぞれの理由が必須です'
}

function recommendWhyMsg(): string[] {
  const r = recommendWhyRule()
  return r === true ? [] : [r]
}



/** ========= 1) 実験状態（graphOn）を取得 ========= */
const GRAPH_FLAG_KEY = 'manzai-graph-flag'
const graphOn = ref(false)
onMounted(() => {
  try { graphOn.value = (localStorage.getItem(GRAPH_FLAG_KEY) === '1') } catch {}
})

const answers = ref<Record<string, any>>({})

function isFilled(q: Question, val: any) {
  if (!q.required) return true
  if (q.type === 'rank') return rankingRule(q, viewRanking(q)) === true
  if (q.type === 'rank_reasons') {
    const base = questionsById.value['q3_rank']
    return base ? (rankWhyRule(viewRanking(base), answers.value[q.id] ?? {}) === true) : false
  }
  if (q.type === 'reco_af_image')
    return recommendLettersRule(val, env.value.performerId) === true
  if (q.type === 'recommend_reasons')
    return recommendWhyRule() === true
  if (q.type === 'af_image_multi')
    return Array.isArray(val) && val.length > 0           // ← 必須にしたい場合
  if (q.type === 'multi') return Array.isArray(val) && val.length > 0
  return val !== undefined && val !== null && String(val).trim() !== ''
}



// ★追加：アンケート開始時刻の保存キー（reloadに強くするため sessionStorage を使う）
const SURVEY_START_KEY = 'manzai-survey-start-ms'


// Question の <script setup> 内（送信処理の直前）
const NEXT_ON_RETURN_KEY = 'manzai-go-next-on-return'
const BLOCK_START_KEY = (pid: string) => `manzai-block-start-${pid}`




/** ========= 2) スキーマ定義（ここに質問を足すだけ） ========= */
type Choice = { id: string; label: string; showIf?: Partial<Env> }
type QType = 'single' | 'multi' | 'text' | 'textarea' | 'rank' | 'rank_reasons' | 'reco_af_image' | 'recommend_reasons' | 'af_image_multi'
type Question = {
  id: string
  text: string
  type: QType
  required?: boolean | ((env: Env) => boolean)
  placeholder?: string
  choices?: Choice[]
  showIf?: Partial<Env> // 質問丸ごと条件
}
type Env = {
  graphOn: boolean;
  q3_rankTop?: string | null
  performerId: string | null
} 

const JUSTIFY_TOP_N = 3 // ← 何位まで理由必須にするか（必要に応じて変更）

const QUESTIONS: Question[] = [
   {
    id: 'q1_recoNo',
    text: 'Q1：友人に推薦する動画を下のA〜Fの中から2つ選んでください．',
    type: 'reco_af_image',
    required: true,        // ※実際の必須判定は「該当レジストリがある時のみ」にします
  },
  {
    id: 'q2_recoWhy',
    text: 'Q2：選んだ各動画の推薦理由を記述してください．',
    type: 'recommend_reasons',
    required: true,
  },
  {
    id: 'q3_rank',
    text: 'Q3：動画を選択するときに参考にした要素を重要度順に並べてください（上が最重要）．右側の∧∨で順位を入れ替えることができます．',
    type: 'rank',
    required: true,
    choices: [
      { id: 'view',      label: '再生回数' },
      { id: 'thumbnail', label: 'サムネイル' },
      { id: 'title',     label: 'タイトル' },
      { id: 'time',      label: '動画時間' },
      { id: 'year',      label: '投稿年' },
      { id: 'graph',     label: 'グラフ', showIf: { graphOn: true } },
      // { id: 'other',     label: 'その他' },
    ],
  },
  {
    id: 'q4_rankWhy',
    text: 'Q4：この順位にした理由を自由に記述してください．',
    type: 'textarea',
    required: true,
  },
  {
  id: 'q5_seenBefore',
  text: 'Q5：もし実験前に視聴したことがあった動画があれば選択してください（複数選択可）．',
  type: 'af_image_multi',
  required: false, // 任意回答（必要なら true に）
},
  // {
  //   id: 'q5_impression_match',
  //   text: 'Q5：【Q1で「グラフ」を最上位にした方】視聴前の印象と視聴後の印象は一致していましたか？その理由や気づいた違いがあれば自由に記述してください',
  //   type: 'textarea',
  //   required: (env: Env) => env.q1Top === 'graph',
  //   placeholder: '例：視聴前は○○だと思っていたが，実際は△△だった／想像通りだった等',
  //   showIf: { graphOn: true },
  // },
]

// 質問定義の下あたりに追記
const q3_rank_ORDER_KEY = 'manzai-q3_rank-order-v1'

// 再現性のある乱数（seed付き）— Mulberry32
function mulberry32(seed: number) {
  return function() {
    let t = seed += 0x6D2B79F5
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
// 「QUESTIONS」定義のすぐ後ろあたりに追記
const randomizedq3_rankIds = ref<string[]>([])

function initQ1OrderForThisSurvey() {
  const startRaw = sessionStorage.getItem(SURVEY_START_KEY) || ''
  const KEY = `manzai-q3_rank-order-${startRaw || 'nostart'}`
  const cached = sessionStorage.getItem(KEY)
  if (cached) {
    try {
      const ids = JSON.parse(cached)
      if (Array.isArray(ids) && ids.length) {
        randomizedq3_rankIds.value = ids
        // console.log('[q3_rank order cached]', ids)
        return
      }
    } catch {}
  }
  const q3_rank = QUESTIONS.find(q => q.id === 'q3_rank')
  const base = (q3_rank?.choices ?? []).map(c => c.id)
  const seed = startRaw ? Math.floor(Number(startRaw)) : Date.now()
  const order = shuffleWithSeed(base, seed)
  randomizedq3_rankIds.value = order
  sessionStorage.setItem(KEY, JSON.stringify(order))
  // console.log('[q3_rank order new]', order, 'seed=', seed)
}

function baseChoiceIds(q: Question): string[] {
  // Q1 は今回アンケート専用のランダム順
  if (q.id === 'q3_rank') return randomizedq3_rankIds.value
  return (q.choices ?? []).map(c => c.id)
}


// シャッフル（Fisher–Yates, seeded）
function shuffleWithSeed<T>(arr: T[], seed: number): T[] {
  const rand = mulberry32(seed)
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}


function visibleChoiceIds(q: Question): string[] {
  const base = baseChoiceIds(q)
  const orig = QUESTIONS.find(x => x.id === q.id)
  if (!q.choices) return base
  return base.filter(id => {
    const c = orig?.choices?.find(x => x.id === id)
    return visibleBy(c?.showIf, env.value)
  })
}

// テンプレ用：表示する並び（純粋、書き込みしない）
function viewRanking(q?: Question): string[] {
  if (!q) return []
  const vis = visibleChoiceIds(q)
  const cur = (answers.value[q.id] ?? []) as string[]
  if (!Array.isArray(cur) || cur.length === 0) return vis.slice()   // 読むだけ
  // curを保ちつつ可視性に合わせてマージ（書き込みしない）
  return [
    ...cur.filter(id => vis.includes(id)),
    ...vis.filter(id => !cur.includes(id)),
  ]
}
function currentPerformerId(): string | null {
  const routePid = (typeof route.query.pid === 'string') ? route.query.pid : null
  const pend = (()=>{ try{ return JSON.parse(sessionStorage.getItem('manzai-watchend-pending')||'null') }catch{return null} })()
  const pidSS = sessionStorage.getItem('manzai-current-performer-id') || null
  return pidSS ?? pend?.performer_id ?? routePid ?? null
}

const env = computed<Env>(() => {
  const rank = (answers.value['q3_rank'] ?? []) as string[]
  return {
    graphOn: graphOn.value,
    q3_rankTop: Array.isArray(rank) && rank.length ? rank[0] : null,
    performerId: currentPerformerId(),
  }
})


const visibleQuestions = computed(() =>
  QUESTIONS
    .filter(q => visibleBy(q.showIf, env.value))
    .map(q => ({
      ...q,
      required: isQuestionRequired(q, env.value),
      choices: q.choices?.filter(c => visibleBy(c.showIf, env.value)) ?? undefined
    }))
)

const visSig = computed(() =>
  QUESTIONS
    .filter(q => visibleBy(q.showIf, env.value))
    .map(q => ({
      id: q.id,
      type: q.type,
      // ★ ランダム順を反映した可視ID列
      choiceIds: visibleChoiceIds(q)
    }))
)


function arrayEq(a: string[], b: string[]) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

watch(
  visSig,
  (sig) => {
    for (const it of sig) {
      if (it.type === 'rank') {
        const cur = (answers.value[it.id] ?? []) as string[]
        const next = [
          ...cur.filter(id => it.choiceIds.includes(id)),
          ...it.choiceIds.filter(id => !cur.includes(id)),
        ]
        // ★ 変化があるときだけ書き込む（無限ループ防止）
        if (!Array.isArray(cur) || !arrayEq(cur, next)) {
          answers.value[it.id] = next
        }
      }
     if (it.id === 'q3_rank' && (
      answers.value['q3_rank_base'] === undefined ||
      !Array.isArray(answers.value['q3_rank_base']) ||
      answers.value['q3_rank_base'].length === 0
    )) {
  answers.value['q3_rank_base'] = it.choiceIds.slice()
}
      if (it.type === 'reco_af_image' && !answers.value[it.id]) {
        answers.value[it.id] = []   // A〜F の配列を初期化
      }
      if (it.type === 'rank_reasons' && !answers.value[it.id]) {
        answers.value[it.id] = {} // 入れ物だけ
      }
      if (it.type === 'recommend_reasons' && !answers.value[it.id]) {
        answers.value[it.id] = {}               // ← これが無いとテキストエリアが出ない
      }
      if (it.type === 'af_image_multi' && !answers.value[it.id]) {
        answers.value[it.id] = []   // Q5: A〜F 複数選択の初期値
      }
    }
  },
  { immediate: true }
)
watch(
  () => answers.value['q1_recoNo'],
  (letters: string[] = []) => {
    const obj = (answers.value['q2_recoWhy'] ||= {})
    // 選択された2つ分のキーを確保
    letters.forEach(L => { if (typeof obj[L] !== 'string') obj[L] = '' })
    // それ以外は掃除
    Object.keys(obj).forEach(k => { if (!letters.includes(k)) delete obj[k] })
  },
  { deep: false }
)



function visibleBy(cond?: Partial<Env>, e?: Env) {
  if (!cond) return true
  if (!e) return false
  return Object.entries(cond).every(([k, v]) => (e as any)[k] === v)
}



function resetRank(q: Question) {
  answers.value[q.id] = visibleChoiceIds(q).slice()
}


function moveRank(q: Question, index: number, delta: number) {
  const arr = viewRanking(q).slice()
  const ni = index + delta
  if (ni < 0 || ni >= arr.length) return
  ;[arr[index], arr[ni]] = [arr[ni], arr[index]]
  answers.value[q.id] = arr
}

function findChoiceLabel(q: Question, id: string): string {
  const orig = QUESTIONS.find(x => x.id === q.id)
  const c = orig?.choices?.find(c => c.id === id)
  return c?.label ?? id
}

// バリデーション（フォームの isFilled に型を追加）
function rankingRule(q: Question, arr: string[]): true | string {
  const vis = visibleChoiceIds(q)
  const okLen = arr.length === vis.length
  const okSet = new Set(arr).size === arr.length && vis.every(id => arr.includes(id))
  return (okLen && okSet) ? true : 'すべての項目を並べ替えてください'
}

function rankWhyRule(rank: string[], obj: Record<string, string>): true | string {
  const need = rank.slice(0, JUSTIFY_TOP_N)
  const ok = need.every(id => {
    const t = (obj?.[id] ?? '').trim()
    return t.length > 0
  })
  return ok ? true : `上位${JUSTIFY_TOP_N}位の理由は必須です`
}

// メッセージ関数（常に string[] を返す）
function rankMsg(q: Question): string[] {
  const res = rankingRule(q, viewRanking(q))
  return res === true ? [] : [res]
}
// function rankWhyMsg(q: Question): string[] {
//   const base = questionsById.value['q3_rank']
//   if (!base) return []
//   const res = rankWhyRule(viewRanking(base), answers.value[q.id] ?? {})
//   return res === true ? [] : [res]
// }

const questionsById = computed<Record<string, Question>>(
  () => Object.fromEntries(visibleQuestions.value.map(q => [q.id, q]))
)

// visibleQuestions は既存の computed を使用
const formOK = computed(() =>
  visibleQuestions.value.every(q => isFilled(q, answers.value[q.id]))
)



function isQuestionRequired(q: Question, env: Env): boolean {
  if (typeof q.required === 'function') return q.required(env)
  return !!q.required
}

/** ========= 4) 回答状態・バリデーション ========= */

const formRef = ref()
// const formOK = ref(false)
const submitting = ref(false)


const pass = () => true
const req  = (v: any) => !!(Array.isArray(v) ? v.length : v) || '必須項目です'
// const atLeastOne = (v: any[]) => (Array.isArray(v) && v.length > 0) || '少なくとも1つ選択してください'

// 下書き保存（任意）：動画IDなどでキーを変えると安全

const DRAFT_KEY = computed(() =>
  `manzai-q-draft-${route.query.pid ?? 'nopid'}-${route.query.v ?? 'novid'}-${sessionStorage.getItem(SURVEY_START_KEY) ?? 't'}`
)


const TASK_INDEX_KEY = 'manzai-current-task-index'
const WATCHED_MAP_KEY = 'manzai-watched-by-performer-v1'
const COMPLETED_SET_KEY = 'manzai-completed-performers'

function calcTaskIndexFallback(): number {
  // 視聴本数ではなく「完了済み漫才師の数 + 1」
  try {
    const arr = JSON.parse(sessionStorage.getItem(COMPLETED_SET_KEY) || '[]')
    const n = Array.isArray(arr) ? arr.length : 0
    return n 
  } catch { return 1 }
}

onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(DRAFT_KEY.value) || 'null')
    if (saved) answers.value = saved
  } catch {}

  // ▼ ここから：Q2がオブジェクトで残っていたら文字列にマイグレーション
  const q4raw = answers.value['q4_rankWhy']
  if (q4raw && typeof q4raw === 'object') {
    // Q1の現在の並びに沿って、理由をまとめる（空はスキップ）
    const q3_rank = QUESTIONS.find(q => q.id === 'q3_rank')!
    const order = viewRanking(q3_rank)
    const merged = order.map((id, idx) => {
      const reason = (q4raw[id] ?? '').trim()
      return reason ? `${idx + 1}位（${findChoiceLabel(q3_rank, id)}）: ${reason}` : ''
    }).filter(Boolean).join('\n')
    answers.value['q4_rankWhy'] = merged || ''       // 空なら空文字に
  }

  // 新規の場合は空文字で初期化
  if (answers.value['q4_rankWhy'] === undefined) answers.value['q4_rankWhy'] = ''

  // 既存処理
  try {
    if (!sessionStorage.getItem(SURVEY_START_KEY)) {
      const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
      sessionStorage.setItem(SURVEY_START_KEY, String(now))
    }
  } catch {}
  initQ1OrderForThisSurvey()
})




watch(answers, (v) => {
  try { localStorage.setItem(DRAFT_KEY.value, JSON.stringify(v)) } catch {}
}, { deep: true })

function safeJSON<T=any>(raw: string | null): T | null {
  try { return raw ? JSON.parse(raw) as T : null } catch { return null }
}

function syncRecoIdsFromLetters() {
  // 既存（Q1）
  const letters: string[] = answers.value['q1_recoNo'] || []
  const ids = letters.map(L => letterToId(L, env.value.performerId)).filter(Boolean)
  answers.value['q_reco'] = ids

  const obj = answers.value['q2_recoWhy'] || {}
  const reasonsById: Record<string,string> = {}
  letters.forEach(L => {
    const vid = letterToId(L, env.value.performerId)
    if (vid) reasonsById[vid] = (obj[L] ?? '').trim()
  })
  answers.value['q2_recoWhy_by_id'] = reasonsById

  // 追加（Q5）
  const letters5: string[] = answers.value['q5_seenBefore'] || []
  const ids5 = letters5.map(L => letterToId(L, env.value.performerId)).filter(Boolean)
  answers.value['q5_watched_ids'] = ids5
}



/** ========= 5) 送信 ========= */
async function onSubmit() {
  submitting.value = true
  try {
    syncRecoIdsFromLetters()
    // 1) セッション/ルートから文脈を復元
    const vidFromRoute = (typeof route.query.v === 'string') ? route.query.v : null
    const pidFromRoute = (typeof route.query.pid === 'string') ? route.query.pid : null
    const isTimeup     = route.query.flow === 'timeup'

    const pidSS   = sessionStorage.getItem('manzai-current-performer-id') || null
    const pnameSS = sessionStorage.getItem('manzai-current-performer-name') || null
    const vidSS   = sessionStorage.getItem('manzai-current-video-id') || null
    const vtitleSS = sessionStorage.getItem('manzai-current-video-title') || null

    // watch_end を送ってあればペンディングが残っている可能性
    const pending = safeJSON<any>(sessionStorage.getItem('manzai-watchend-pending'))
    const pidPend    = pending?.performer_id   ?? null
    const pnamePend  = pending?.performer_name ?? null
    const vidPend    = pending?.video_id       ?? null
    const vtitlePend = pending?.video_title    ?? null

    // --- 2) performer は SS → pending → route の順で決定 ---
    const performer_id   = pidSS ?? pidPend ?? pidFromRoute ?? null
    const performer_name = pnameSS ?? pnamePend ?? null

    // --- 3) 「未視聴」の定義 ---
    // timeupで来た / SSにもpendingにもrouteにも video が無い → 未視聴
    const isUnwatched = !!(
      isTimeup ||
      (!vidSS && !vidPend && !vidFromRoute)
    )

    // --- 4) video は「未視聴なら空文字」、視聴ありなら SS→pending→route で決定 ---
    let video_id: string | null = null
    let video_title: string | null = null

    if (!isUnwatched && performer_id) {
      // performer に紐づく video だけ採用（前の組の残骸を排除）
      const fromSS    = (pidSS   && pidSS   === performer_id) ? { id: vidSS,   title: vtitleSS }   : { id: null, title: null }
      const fromPend  = (pidPend && pidPend === performer_id) ? { id: vidPend, title: vtitlePend } : { id: null, title: null }
      const fromRoute = vidFromRoute ? { id: vidFromRoute, title: null } : { id: null, title: null }

      video_id    = fromSS.id   ?? fromPend.id   ?? fromRoute.id   ?? null
      video_title = fromSS.title?? fromPend.title?? fromRoute.title?? null
    }

    // 2) 属性など
    const demo = (() => {
      try { return JSON.parse(localStorage.getItem('manzai-demographics') || '{}') } catch { return {} }
    })()
    const uuid  = localStorage.getItem('manzai-user-id-v1') || null
    const sex   = demo?.sex ?? null
    const age   = demo?.age ?? null
    const graph = (localStorage.getItem('manzai-graph-flag') === '1') ? 1 : 0

 // ★★★ 3) アンケート回答時間を計測（ms → 秒に丸め）
    let survey_ms = 0
    try {
      const startRaw = sessionStorage.getItem(SURVEY_START_KEY)
      const start = startRaw ? Number(startRaw) : null
      const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
      if (Number.isFinite(start as number) && (start as number) > 0) {
        survey_ms = Math.max(1, Math.round(now - (start as number)))
      } else {
        survey_ms = 1
      }
    } catch {
      survey_ms = 1
    }

    // onSubmit() 内、payload を組み立てる直前に追記
let task_index: number | undefined
try {
  const v = Number(sessionStorage.getItem(TASK_INDEX_KEY))
  if (Number.isFinite(v) && v > 0) task_index = v
} catch {}
if (task_index === undefined) task_index = calcTaskIndexFallback()
    // 4) ペイロード（ID/タイトルはセッション優先→ルートfallback）
    const payload: any = {
      kind: 'question',
      uuid, sex, age, graph,
      performer_id:   performer_id,                 // ← その漫才師
      performer_name: performer_name ?? '',         // ← 可能なら名前、無ければ空
      video_id:       isUnwatched ? '' : (video_id ?? ''),     // ← 空文字に正規化
      video_title:    isUnwatched ? '' : (video_title ?? ''),  // ← 空文字に正規化
      watched_ms:     survey_ms,
      task_index,
      survey_type: 'post_video',
      survey_answers_json: answers.value,
      timestamp: new Date().toISOString(),
    }

    await postToDB(payload)

    // 5) 視聴済み管理（vid/pid が揃っていれば記録）
    try {
      const WATCHED_MAP_KEY = 'manzai-watched-by-performer-v1'
      const pid = (payload.performer_id as string | null)
      const vid = (payload.video_id as string | null)
      if (pid && vid) {
        const raw = localStorage.getItem(WATCHED_MAP_KEY)
        const map: Record<string, string[]> = raw ? JSON.parse(raw) : {}
        const arr = Array.isArray(map[pid]) ? map[pid] : []
        if (!arr.includes(vid)) arr.push(vid)
        map[pid] = arr
        localStorage.setItem(WATCHED_MAP_KEY, JSON.stringify(map))
      }
    } catch {}

    // 6) 次の漫才師へ進めるフラグ
    try {
      const pid = performer_id as string | null
      if (pid) {
        sessionStorage.setItem(NEXT_ON_RETURN_KEY, pid)
        localStorage.removeItem(BLOCK_START_KEY(pid))
      }
      localStorage.removeItem(DRAFT_KEY.value)
      sessionStorage.removeItem('manzai-last-watched-ms')
      sessionStorage.removeItem(SURVEY_START_KEY)
      sessionStorage.removeItem(TASK_INDEX_KEY)

        if (pid) {
    const arr = JSON.parse(sessionStorage.getItem(COMPLETED_SET_KEY) || '[]')
    const set = new Set<string>(Array.isArray(arr) ? arr : [])
    set.add(pid) // 重複は自動的に除外される
    sessionStorage.setItem(COMPLETED_SET_KEY, JSON.stringify([...set]))
  }

      // 文脈キーの掃除
      sessionStorage.removeItem('manzai-current-performer-id')
      sessionStorage.removeItem('manzai-current-performer-name')
      sessionStorage.removeItem('manzai-current-video-id')
      sessionStorage.removeItem('manzai-current-video-title')
      sessionStorage.removeItem('manzai-watchend-pending')
    } catch {}

    router.replace({ path: '/work' })
  } finally {
    submitting.value = false
  }
}
// 送信成功後の後片付けに追記（既存の後片付けの try{} 内でOK）
sessionStorage.removeItem(TASK_INDEX_KEY)

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
    //  const text = '{"ok": false, "error": "forced test"}';
    // console.log('[DB] response', res.status, text)
    if (!res.ok || !/\"ok\"\s*:\s*true/.test(text)) {
      try {
        const KEY = 'manzai-offline-queue-v1'
        const raw = localStorage.getItem(KEY)
        const arr = raw ? JSON.parse(raw) : []
        arr.push({ at: new Date().toISOString(), endpoint: url, payload })
        localStorage.setItem(KEY, JSON.stringify(arr))
      } catch {}
      // console.error('[DB] server NG', text)
      alert(`サーバがNGを返しました（${payload.kind}）．\n「OK」を押し，このページを開き直して，もう一度送信をお願いします．`)
      // 回答保持のためのドラフトは既存watchで保存済み。ここではページを再読込。
      setTimeout(() => { location.reload() }, 50)
      throw new Error('server NG')
    }
  } catch (e) {
      try {
      const KEY = 'manzai-offline-queue-v1'
      const raw = localStorage.getItem(KEY)
      const arr = raw ? JSON.parse(raw) : []
      arr.push({ at: new Date().toISOString(), endpoint: url, payload })
      localStorage.setItem(KEY, JSON.stringify(arr))
    } catch {}
    // console.error('[DB] fetch failed', e)
    alert(`送信に失敗しました（${payload.kind}）．\n「OK」を押し，このページを開き直して，もう一度送信をお願いします．`)
    setTimeout(() => { location.reload() }, 50)
    throw e
  }
}

const pidFromPending = (() => {
  try {
    const raw = sessionStorage.getItem('manzai-watchend-pending')
    const p = raw ? JSON.parse(raw) : null
    return p?.performer_id ?? null
  } catch { return null }
})()

const pid = pidFromPending // ← 送った watch_end から performer_id を拾うのが安全

if (pid) {
  sessionStorage.setItem('manzai-go-next-on-return', pid)
  localStorage.removeItem(`manzai-block-start-${pid}`)
  // 送信成功後の後片付けに追記（既存の後片付けの try{} 内でOK）
  sessionStorage.removeItem(TASK_INDEX_KEY)
sessionStorage.removeItem('manzai-current-performer-id')
sessionStorage.removeItem('manzai-current-performer-name')
sessionStorage.removeItem('manzai-current-video-id')
sessionStorage.removeItem('manzai-current-video-title')
}


</script>

<style scoped>
.q-title{ font-weight: 600; margin-bottom: .25rem; }
.max-w-screen-md{ max-width: 860px; margin-inline: auto; }
.space-y-8 > * + *{ margin-top: 2rem; }
.p-4{ padding: 1rem; }
.sticky-actions{
  position: sticky;
  bottom: 0;
  background: linear-gradient(to top, rgba(255,255,255,0.95), rgba(255,255,255,0.65));
  padding-top: .75rem;
  padding-bottom: .25rem;
}
/* 押下時の一瞬の背景色を無効化（必要なら） */
.rank-list :deep(.v-list-item--active),
.rank-list :deep(.v-list-item:active) {
  background-color: transparent !important;
}
.rank-list :deep(.v-ripple__container) { display: none !important; } /* 念のため */

</style>
