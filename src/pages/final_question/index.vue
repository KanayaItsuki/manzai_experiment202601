<template>
  <v-container class="py-8 max-w-screen-md">
    <v-card class="rounded-xl" elevation="0" variant="outlined">
      <v-toolbar flat density="comfortable">
        <v-toolbar-title>実験参加者の属性に関するアンケート（最後）</v-toolbar-title>
      </v-toolbar>
      <v-divider />

      <v-form ref="formRef" class="p-4 space-y-8">
        <!-- 注意書き -->
        <v-alert type="info" variant="tonal" class="rounded-xl">
          このアンケートは研究目的のみで用います．個人を特定できる情報は収集しません．
        </v-alert>

        <!-- Q1 -->
        <section>
          <div class="q-title">Q1：実験前，この漫才師を知っていましたか？（4組それぞれ）</div>

          <div
            v-for="(c, idx) in comedians"
            :key="c.id"
            class="rounded-xl border p-3 mb-4"
          >
            <div class="font-semibold pp-3 mb-1">　#{{ idx + 1 }}：{{ c.name }}</div>
            <v-img
              :src="c.thumbnail"
              :alt="c.name"
              max-width="320"
              class="rounded-lg   mb-2 "
              cover
            />

            <!-- Q1-知っていたか -->
            <v-radio-group
              v-model="ans.preKnowledge[c.id].know"
              :rules="[req]"
              class="ml-1"
            >
              <v-radio label="はい" value="yes" />
              <v-radio label="いいえ" value="no" />
            </v-radio-group>

            <!-- Q1 追質問：はい のときだけ -->
            <!-- <div v-if="ans.preKnowledge[c.id].know === 'yes'" class="mt-2"> -->
              <div class="q-title text-sm">この漫才師の芸風を知っていましたか？（なんとなくでも可）</div>
              <v-radio-group
                v-model="ans.preKnowledge[c.id].style"
                :rules="[req]"
                class="ml-1"
              >
                <v-radio label="はい" value="yes" />
                <v-radio label="いいえ" value="no" />
              </v-radio-group>

              <!-- ★ 追加：style が yes のときは記述式も -->
              <!-- <div v-if="ans.preKnowledge[c.id].style === 'yes'"> -->
                <div class="q-title text-sm">どんな芸風だと認識していましたか？（簡単に）</div>
                <v-textarea
                  v-model="ans.preKnowledge[c.id].styleText"
                  auto-grow
                  rows="2"
                  :rules="[req]"   
                  placeholder="例：しゃべくり漫才／コント漫才／ボケ・ツッコミの発話が多い 等"
                  class="ml-1"
                />
            <!-- </div> -->
          <!-- </div> -->

          </div>
        </section>

        <!-- Q2 -->
        <section>
          <div class="q-title">Q2：どのような検索語で漫才を検索したことがありますか？</div>
          <v-text-field
            v-model="ans.searchStyleDetail"
            :rules="[req]"
            placeholder="例：芸人名、番組名、ネタ名 など"
          />

            <!-- Q2の追質問（yesのときだけ表示 & 必須） -->
          <!-- <div v-if="ans.searchStyle === 'yes'" class="mt-2">
          <div class="q-title text-sm">どのような検索語で探しましたか？（具体名で）</div>
          <v-text-field
            v-model="ans.searchStyleDetail"
            :rules="[req]"
            placeholder="例：芸人名、番組名、ネタ名 など"
          />
          </div> -->
        </section>

        <!-- Q3 -->
        <section>
          <div class="q-title">Q3：インターネットで漫才をどのくらいの頻度で見ますか？</div>
          <v-radio-group v-model="ans.frequency" :rules="[req]">
            <v-radio label="年に数回程度" value="rarely" />
            <v-radio label="月に1回程度" value="monthly" />
            <v-radio label="週に1回程度" value="weekly" />
            <v-radio label="週に3~4回程度" value="several_per_week" />
            <v-radio label="ほぼ毎日" value="daily" />

         
          </v-radio-group>
        </section>

        <section class="q-block">
          <div class="q-title">Q4：漫才はどのくらい好きですか？ </div>
        

          <div class="scale-row">
            <div class="scale-anchor">0（テレビで見る程度）</div>

            <v-radio-group
              v-model="ans.manzaiLike"
              :rules="[req]"
              inline  
              class="dots-row"
              density="compact"
            >
              <v-radio v-for="n in 5" :key="n-1" :value="String(n-1)" class="dot" />
            </v-radio-group>

            <div class="scale-anchor">4（劇場に通う程度）</div>
          </div>
          
          <div class="scale-labels">
            <div v-for="n in 5" :key="n-1" class="label-item">{{ n-1}}</div>
          </div>
        </section>

        <section class="q-block">
          <div class="q-title">Q5：このシステムをどれだけ友人に薦めたいですか？</div>

          <div class="scale-row">
            <div class="scale-anchor">0（薦めたくない）</div>

            <v-radio-group
              v-model="ans.npsRecommend"
              :rules="[req]"
              inline  
              class="dots-row"
              density="compact"
            >
              <v-radio v-for="n in 11" :key="n-1" :value="String(n-1)" class="dot" />
            </v-radio-group>

            <div class="scale-anchor">10（薦めたい）</div>
          </div>
          
          <div class="scale-labels">
            <div v-for="n in 11" :key="n-1" class="label-item">{{ n - 1 }}</div>
          </div>
        </section>

<section v-if="graphOn" class ="q-block">
  <div class="q-title">Q6：サムネイルの下にあったグラフは，動画の選択にどの程度参考になりましたか？</div>

  <div class="scale-row">
    <div class="scale-anchor">0（参考にしていない）</div>

    <v-radio-group
      v-model="ans.graphHelpfulness"
      :rules="[req]"
      inline 
      class="dots-row"
      density="compact"
    >
      <v-radio v-for="n in 7" :key="n" :value="String(n-1)" class="dot" />
    </v-radio-group>

    <div class="scale-anchor">6（かなり参考にした）</div>
  </div>

  <div class="scale-labels scale-labels-q5">
    <div v-for="n in 7" :key="n" class="label-item">{{ n-1 }}</div>
  </div>
</section>

<!-- ★ Q7 を追加 -->
<section v-if="graphOn" class="q-block">
  <div class="q-title">Q7：動画の下に表示されていたグラフに関して，どういうことを読み取りましたか？</div>
  <v-textarea
    v-model="ans.graphUnderstanding"
    auto-grow
    rows="3"
    :rules="[req]"
    
  />
</section>

        <!-- 自由記述（任意） -->
        <section>
          <div class="q-title">本実験・インタフェースに関するご意見（任意）</div>
          <v-textarea
            v-model="ans.freeText"
            auto-grow
            rows="3"
            placeholder="気になった点・良かった点などがあればご記入ください"
          />
        </section>

        <!-- 送信ボタン -->
        <div class="sticky-actions">
          <v-btn
            color="primary"
            size="large"
            class="rounded-xl"
            :loading="submitting"
            :disabled="!formOK"
            @click="onSubmit"
          >
            送信して終了
          </v-btn>
          <div class="helper text-gray-500 text-sm mt-1">未回答があると送信できません</div>
        </div>
      </v-form>
    </v-card>
  </v-container>
  

</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
const BASE = import.meta.env.BASE_URL.replace(/\/?$/, '/')

const GRAPH_FLAG_KEY = 'manzai-graph-flag'
const graphOn = ref(false)
onMounted(() => {
  try { graphOn.value = (localStorage.getItem(GRAPH_FLAG_KEY) === '1') } catch { }
})

const comedians = [
  // ★ここを実データに差し替え
  { id: 'kabeposter', name: 'カベポスター', thumbnail: `${BASE}thumbs/kabeposter/kabeposter_6th.png` },
  { id: 'milkboy', name: 'ミルクボーイ', thumbnail: `${BASE}thumbs/milkboy/milkboy_6th.png` },
  { id: 'mitorizu', name: '見取り図', thumbnail: `${BASE}thumbs/mitorizu/mitorizu_6th.png` },
  { id: 'sayaka', name: 'さや香', thumbnail: `${BASE}thumbs/sayaka/sayaka_6th.png` },
] as const

type FinalSurvey = {
  frequency: string | null
  graphHelpfulness: string | null
  graphUnderstanding: string 
  freeText: string               
  searchStyleDetail: string               

  // 追加
  preKnowledge: PreKnowledge
  npsRecommend: string | null
  manzaiLike: string | null
  
}

const STORAGE_KEY = 'manzai-final-survey-v1'

const router = useRouter()
const route  = useRoute()

const formRef = ref()
const submitting = ref(false)
const COMPLETION_KEY = 'manzai-completion-code-v1'

// 必須：Q1(4組) + Q2テキスト + Q3 + (graphOnならQ4) + Q5 + 追質問(yesの時だけ)
const formOK = computed(() => {
  // Q2 は自由記述の必須（searchStyle は使わない）
  const q2TextOK = (ans.value.searchStyleDetail?.trim().length ?? 0) > 0

  // Q3 必須
  const q3OK = !!ans.value.frequency

  // Q1：4組すべて「知っていたか」回答
  const allKnowAnswered = comedians.every(c => !!ans.value.preKnowledge[c.id].know)

  // 「知っていた」なら style が必須
  const allStyleOK = comedians.every(c =>
    ans.value.preKnowledge[c.id].know !== 'yes' ||
    !!ans.value.preKnowledge[c.id].style
  )

  // 「芸風を知っていた」なら記述も必須
  const allStyleTextOK = comedians.every(c =>
    ans.value.preKnowledge[c.id].style !== 'yes' ||
    (ans.value.preKnowledge[c.id].styleText?.trim().length ?? 0) > 0
  )

  // Q4（グラフありの時だけ必須）
  const q4OK = graphOn.value ? !!ans.value.graphHelpfulness : true

  // Q5（NPS 0〜10）必須
  const q5OK = !!ans.value.npsRecommend

    // ★ Q7（グラフありの時だけ必須）
  const q7OK = graphOn.value
    ? (ans.value.graphUnderstanding?.trim().length ?? 0) > 0
    : true

  return q2TextOK && q3OK && allKnowAnswered && allStyleOK && allStyleTextOK && q4OK && q5OK && q7OK
})

const ans = ref<FinalSurvey>({
  frequency: null,
  graphHelpfulness: null,
  graphUnderstanding: '', 
  freeText: '',
  searchStyleDetail: '',                  // ★ 空文字で初期化
  preKnowledge: makePreKnowledge(),
  npsRecommend: null,
  manzaiLike: null,
})

const req = (v: any) => !!v || '必須項目です'

// 下書きの自動保存／復元
onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (saved) {
      ans.value = { ...ans.value, ...saved }
      // ★preKnowledgeのキー補完（新設項目のため）
      const base = makePreKnowledge()
      ans.value.preKnowledge = { ...base, ...(saved.preKnowledge || {}) }
    }
  } catch {}
})

watch(ans, (v) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)) } catch {}
}, { deep: true })

async function onSubmit() {
  if (!formOK.value) return
  submitting.value = true
  try {
    // ローカルストレージから既存の値を“そのまま”読み込む
    const uuid = (() => {
      try { return localStorage.getItem('manzai-user-id-v1') || null } catch { return null }
    })()

    const demo = (() => {
      try { return JSON.parse(localStorage.getItem('manzai-demographics') || '{}') } catch { return {} }
    })()
    const sex = demo?.sex ?? null
    const age = demo?.age ?? null

    const graph = (() => {
      try { return localStorage.getItem('manzai-graph-flag') === '1' ? 1 : 0 } catch { return 0 }
    })()

    // 同じテーブルへ保存：kind は watch_end、区別は survey_type='final_survey'
    const payload = {
      kind: 'survey',
      uuid, sex, age, graph,

        // ★ NOT NULL対策：ダミー値を必ず入れる
      task_index: 5,
      performer_id: 'final_survey',     // ← ここを空にしない
      performer_name: '',               // （nullableなら空文字でOK）
      video_id: 'final_survey',         // ← ここも空にしない
      video_title: 'final_survey',      // （nullableなら空文字でも可）

      // NOT NULL 対策
      watched_ms: 0,
      watched_sec: 0,

      // ここが最終アンケ識別
      survey_type: 'final_survey',
      survey_answers_json: { ...ans.value },

      timestamp: new Date().toISOString(),
    }

    await postToDB(payload)

    // 下書き削除 & 終了画面へ
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
    router.replace({ path: '/end' })
  } finally {
    submitting.value = false
  }
}


async function postToDB(payload: any) {
  const url = 'https://kanaya.nkmr.io/manzai_system/manzai_system_dcc42_api.php'
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
      credentials: 'omit',
    })
    const text = await res.text()
    // const text = '{"ok": false, "error": "forced test"}';
    // console.log('[DB]', payload.kind, res.status, text)
    if (!res.ok || !/\"ok\"\s*:\s*true/.test(text)) {
      alert(`サーバがNGを返しました（${payload.kind}）．\n「OK」を押し，このページを開き直して，もう一度送信をお願いします．`)
      // 回答保持のためのドラフトは既存watchで保存済み。ここではページを再読込。
      setTimeout(() => { location.reload() }, 50)
      throw new Error('server NG')
    }
  } catch (e: any) {
    alert(`送信に失敗しました（${payload.kind}）．\n「OK」を押し，このページを開き直して，もう一度送信をお願いします．`)
    setTimeout(() => { location.reload() }, 50)
    throw e
  }
}

// アンケート内容
// 型に自由記述を追加
type YesNo = 'yes' | 'no' | null
type PreKnowledge = Record<string, { know: YesNo; style: YesNo; styleText: string }>

// 初期化関数を更新
function makePreKnowledge(): PreKnowledge {
  const obj: PreKnowledge = {}
  for (const c of comedians) obj[c.id] = { know: null, style: null, styleText: '' }
  return obj
}



</script>

<style scoped>
.q-title{
  font-weight: 600;
  margin-bottom: .25rem;
}
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

/* 横並びの行：ここで共通サイズを定義 */
.scale-row{
  --dot-size: 28px;                  /* 丸のサイズをここで一元管理 */
  display:flex; align-items:center; gap:16px;
}

/* 左右ラベルを“丸と同じ高さ”にして中央寄せ */
.scale-anchor{
  display:flex; align-items:center;
  height: var(--dot-size);           /* ← 高さを丸に合わせる */
  min-width: 12em;
  color:#555; font-size:.95rem;
}

/* 真ん中のラジオ群（横並び・余白調整） */
.dots-row{
  flex:1;
  display:flex; flex-direction:row; align-items:center; gap:14px;
  margin: 0 !important;              /* v-radio-group の上下余白を消す */
}

/* 丸だけ表示にしたい場合（数字ラベルを隠す） */
:deep(.dots-row .v-label){ display:none; }
:deep(.dots-row .v-selection-control){ margin:0; padding:0; }
:deep(.dots-row .v-selection-control__wrapper){
  width: var(--dot-size); height: var(--dot-size);
}
:deep(.dots-row .v-icon){
  font-size: calc(var(--dot-size) - 2px);
}


/* ★ 追加：数値ラベルの配置用コンテナ */
.scale-labels{
  display: flex;
  
  /* ドット間の間隔と同じ gap を設定 */
  gap: 14px; /* ドット列全体と同じ位置になるように左右のアンカー幅と gap を空ける */
  margin-left: calc(12em + 20px); 
  margin-right: calc(12em + 20px); 
  /* ラベルの上側の余白を少し調整してドットに近づける */
  margin-top: -8px; 
}

.label-item {
  /* ラベルを中央寄せ */
  text-align: center;
  font-size: 0.85rem;
  color: #555;
  /* 重要な修正: flex-growを削除し、ドットと同じ幅を明示的に設定 */
  /* ドットは --dot-size (28px) の大きさで、その中央に数値が来るように調整します。 */
  min-width: 28px; /* ドットのサイズと一致させる */
  margin-left: -14px; /* 自分の幅の半分を左にずらす */
}

/* セクションを基準に絶対配置できるように */
.q-block { position: relative; }

/* タイトルの右側にスペースを確保（被らないように） */
.q-block .q-title {
  display: block;
  position: relative;
  padding-right: 7.5em; /* タイトル右にメッセージ分の余白を確保 */
}

/* Vuetifyのバリデーション表示（.v-input__details）を動かす */
.q-block :deep(.v-input__details) {
  position: absolute;
  top: 0.1rem;        /* タイトルの行の高さに合わせて微調整 */
  right: 0;           /* 右詰め＝「？」の右あたりに来る */
  margin: 0;
  padding: 0;
  min-height: 0;
  line-height: 1;
  pointer-events: none;  /* クリック干渉を避ける */
}

/* メッセージ自体の体裁（色・折り返し防止） */
.q-block :deep(.v-messages__message) {
  color: #b00020;        /* Vuetifyのerror系カラーに近い */
  font-size: 12px;
  white-space: nowrap;
}


</style>