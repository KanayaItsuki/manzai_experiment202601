<template>
  <div class="home">
    <v-row class="mt-1 mb-16">
      <v-col cols="12">
        <v-card class="mx-auto my-7" max-width="800" variant="outlined">
          <v-card-title class="py-5 pl-4">
            【PC限定】漫才動画を視聴し，アンケートに回答してもらう実験
          </v-card-title>
          <v-divider class="mx-4" />

          <!-- エラー帯（未チェックがある時だけ表示） -->
          <v-alert
            v-if="showError"
            type="error"
            variant="tonal"
            class="mx-6 mt-4"
            closable
            @click:close="showError=false"
          >
            すべての説明を読み，各行のチェックボックスにチェックを入れてください（残り {{ missingKeys.length }} 件）．
          </v-alert>

          <div class="px-6 py-3">
            <!-- リード文 -->
            <div class="pt-5">
              <ul class="ul-none">
                <li class="indent">
                  <strong>※各行の説明を読んだら右のチェックボックスを押してください．全て読んでチェックしないと次へ進むことができません．</strong>
                </li>
              </ul>
            </div>

            <!-- 実験手順 -->
            <div class="pt-5">
              <strong><u><h3 class="pb-3">実験手順</h3></u></strong>
              <ol class="ol-tight">
                <template v-for="(p,i) in procedure" :key="p.id">
                  <v-row no-gutters align="start" class="row-line">
                    <!-- 左: テキスト -->
                    <v-col class="pr-2">
                      <!-- <li>
                        {{ p.text }}
                      </li> -->
                       <li v-html="p.text"></li>
                    </v-col>
                    <!-- 右: チェックボックス（固定幅） -->
                    <v-col cols="auto" class="right-col">
                      <v-checkbox
                        :id="p.id"
                        v-model="checked"
                        :value="p.id"
                        density="compact"
                        hide-details
                        :ripple="false"
                      />
                    </v-col>
                  </v-row>
                </template>

                <v-row no-gutters align="center" class="row-line">
                  <v-col class="pr-2">
                    手順2~4を<strong>全4回</strong>繰り返していただきます．
                  </v-col>
                  <!-- <v-col cols="auto" class="right-col">
                    <v-checkbox
                      id="repeat"
                      v-model="checked"
                      value="repeat"
                      density="compact"
                      hide-details
                      :ripple="false"
                    />
                  </v-col> -->
                </v-row>
              </ol>
            </div>
            <!-- シナリオ -->
            <div class="pt-8">
              <strong><u><h3 class="pb-3">シナリオ</h3></u></strong>
              <ul class="ul-none">
                <template v-for="c in situation" :key="c.id">
                  <v-row no-gutters align="start" class="row-line">
                    <v-col class="pr-2">
                      <li v-html="c.text"></li>
                    </v-col>
                  </v-row>
                </template>
                <v-row no-gutters align="center" class="row-line">
                  <v-col class="pr-2">
                    この指示について理解しました．
                  </v-col>
                  <v-col cols="auto" class="right-col">
                    <v-checkbox
                      id="repeat"
                      v-model="checked"
                      value="scenario"
                      density="compact"
                      hide-details
                      :ripple="false"
                    />
                  </v-col>
                </v-row>
              </ul>
            </div>

            <!-- 注意 -->
            <div class="pt-8">
              <strong><u><h3 class="pb-3">注意</h3></u></strong>
              <ul class="ul-tight">
                <template v-for="c in cautions" :key="c.id">
                  <v-row no-gutters align="start" class="row-line">
                    <v-col class="pr-2">
                      <li v-html="c.text"></li>
                    </v-col>
                    <v-col cols="auto" class="right-col">
                      <v-checkbox
                        :id="c.id"
                        v-model="checked"
                        :value="c.id"
                        density="compact"
                        hide-details
                        :ripple="false"
                      />
                    </v-col>
                  </v-row>
                </template>
              </ul>
            </div>

            <!-- 問い合わせ先 -->
            <div class="pt-7">
              <strong><u><h3 class="pb-3">問い合わせ先</h3></u></strong>
              <ul class="ul-none pt-3">
                <li>氏名：金谷一輝　所属：明治大学</li>
                <li class="py-2">メール：kanaya@nkmr-lab.org</li>
              </ul>
            </div>
          </div>

          <!-- 下部フォーム＆開始ボタン -->
          <div class="text-center py-4">
            <v-col cols="12">
              <v-row justify="space-around">
                <v-col class="d-flex" cols="12" sm="4">
                  <v-text-field v-model="faculty" label="学部" variant="outlined"  hide-details="auto" placeholder="例）総合数理学部" />
                </v-col>
                <v-col class="d-flex" cols="12" sm="4">
                  <v-select v-model="grade" :items="grades" label="学年" variant="outlined"  hide-details="auto" placeholder="学年を選択" />
                </v-col>
                <v-col class="d-flex" cols="12" sm="4">
                  <v-text-field v-model="fullname" label="氏名" variant="outlined" hide-details="auto" placeholder="例）山田太郎"/>
                </v-col>
                <v-col class="d-flex" cols="12" sm="4">
                  <v-select v-model="sex" :items="sexes" label="性別" variant="outlined" hide-details="auto"/>
                </v-col>
                <v-col class="d-flex" cols="12" sm="4">
                <v-text-field v-model="age" label="年齢（半角数字で入力）" variant="outlined" type="number" hide-details="auto"/>
                </v-col>
                <v-col class="d-flex" cols="12" sm="4">
                  <v-btn
                    color="primary"
                    size="x-large"
                    :disabled="!formReady"
                    @click="startResearch"
                  >
                    <strong>実験を開始する</strong>
                  </v-btn>
                </v-col>
              </v-row>
            </v-col>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePerformerRounds } from '@/composables/usePerformerRounds'

const router = useRouter()
const rounds = usePerformerRounds()

const loading = ref(true)
const err = ref('')

/** 行データ */
const procedure = [
  { id: 'p1', text: '以下の情報を入力し，「実験を開始する」のボタンを押すと実験が開始します．' },
  { id: 'p2', text: '<strong>動画のサムネイルをクリックすると動画が再生</strong>されます．' },
  { id: 'p3', text: '1組の漫才師につき，<strong>10分間</strong>で自由に動画を視聴してください．'},
  { id: 'p4', text: '10分経過すると，自動でアンケート画面に遷移するので回答してください．' },
  { id: 'p5', text: '最後に，参加者自身の属性に関するアンケートに回答してください．'},
] as const

const cautions = [
  { id: 'c1', text: 'ブラウザは<strong>Google Chrome・Edge</strong>のどちらかを使用してください．' },
  { id: 'c2', text: '一時停止した際や，動画の最後に表示される関連動画はクリックしないでください．' },
  { id: 'c3', text: '原則，ブラウザのリロードや戻るボタンを使用しないでください．' },
  { id: 'c4', text: '実験は途中で一時停止または中断できません．<strong>1時間しっかり確保するようお願いします．'},
] as const

const situation = [
  { id: 's1', text: 'あなたには漫才をほとんど見たことがない友人がいます．' },
  { id: 's2', text: 'この友人に対して，<strong>その漫才師に興味を持ってもらうために2本ネタ動画を薦めます．</strong>' },
  { id: 's3', text: 'どの動画を推薦するか，またその推薦理由を意識しながら，動画を視聴してください．'},
]

/** チェック状態 */
const checked = ref<string[]>([])

/** 必須キー */
const requiredKeys = computed<string[]>(() => [
  ...procedure.map(p => p.id),
   'scenario',
  ...cautions.map(c => c.id),
])

/** 未チェック・表示制御 */
const missingKeys = computed(() =>
  requiredKeys.value.filter(k => !checked.value.includes(k))
)
const showError = ref(false)

/** セレクト */
const ages = ['10代','20代','30代','40代','50代','60代以上']
const sexes = ['男性','女性','その他']
const sex = ref<string | null>(null)
const age = ref<string | null>(null)

// ★上段用の状態を追加（既存ロジックは変更しません）
const faculty  = ref<string>('')           // 学部（記述）
const grade    = ref<string | null>(null)  // 学年（選択）
const fullname = ref<string>('')           // 氏名（記述）

// 学年リスト（お好みで調整可）
const grades = ['1年','2年','3年','4年','院1年','院2年','その他']


/** PC限定チェック */
const userAgent = ref(''); const mobile = ref<boolean | null>(null)
onMounted(() => {
  userAgent.value = navigator.userAgent.toLowerCase()
  const ua = navigator.userAgent
  mobile.value =
    ua.includes('iPhone') || ua.includes('iPod') ||
    (ua.includes('Android') && ua.includes('Mobile')) ||
    ua.includes('iPad') || ua.includes('Android')
})

/** ボタン活性 */
/** ボタン活性 */
const formReady = computed(() =>
  missingKeys.value.length === 0 &&
  !!sex.value &&
  !!age.value &&
  !!faculty.value?.trim() &&
  !!fullname.value?.trim() &&
  !!grade.value
)


/** ユーザに発行するuuid */
// 追加：キー名を定義（End側と共有）
const USER_ID_KEY = 'manzai-user-id-v1'
const COMPLETION_KEY = 'manzai-completion-code-v1'

// 追加：英数字16桁のIDを生成（大文字）
function genUserId16(): string {
  // 16桁を一気に作る（A-Z,0-9）
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let out = ''
  for (let i = 0; i < 16; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

function startResearch() {
  if (missingKeys.value.length > 0) {
    showError.value = true
    const first = missingKeys.value[0]
    document.getElementById(first)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }

  if (userAgent.value.includes('msie') || userAgent.value.includes('trident')) {
    alert('ご使用のブラウザはInternet Explorerです'); return
  }
  if (userAgent.value.includes('edge') || userAgent.value.includes('edga') || userAgent.value.includes('edgios')) {
    alert('ご使用のブラウザはEdgeです'); return
  }
  if (mobile.value) { alert('この実験はPC限定になっています。'); return }

  // 1. 全画面表示の要求を追加（ここから）
  // const element = document.documentElement; // ページ全体（<html>要素）を対象にする

  // if (element.requestFullscreen) {
  //   element.requestFullscreen()
  //     .catch(err => {
  //       console.warn("フルスクリーン要求に失敗しました:", err);
  //     });
  // } else if ((element as any).mozRequestFullScreen) { // Firefox
  //   (element as any).mozRequestFullScreen();
  // } else if ((element as any).webkitRequestFullscreen) { // Chrome, Safari, Edge
  //   (element as any).webkitRequestFullscreen();
  // } else if ((element as any).msRequestFullscreen) { // IE/Edge (古いバージョン)
  //   (element as any).msRequestFullscreen();
  // }

  if (!sex.value || !age.value) {
    alert(!sex.value && !age.value ? '性別、年齢が未回答です' : (!sex.value ? '性別が未回答です' : '年齢が未回答です'))
    return
  }

  try {
    const uid = genUserId16() // ← 毎回ランダム作成
    localStorage.setItem(USER_ID_KEY, uid)
    localStorage.setItem(COMPLETION_KEY, uid) // Endページの既存UIで表示される

    localStorage.setItem('manzai-demographics', JSON.stringify({
      sex: sex.value,   // 例: '男性'
      age: age.value,   // 例: '20代'
    }))

    // console.log('[manzai] issued NEW user id:', uid)
  } catch (e) {
    // console.warn('Failed to persist user id:', e)
  }
window.scrollTo(0, 0);

router.replace('/work')
}

onMounted(async () => {
  try {
    const base = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/')
    const url  = `${base}data/manzai_data.json`
    // const url  = `${base}data/else_manzai_data.json`
    const res  = await fetch(url, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const list = Array.isArray(data?.videos) ? data.videos : (Array.isArray(data) ? data : [])
    if (!list.length) throw new Error('videos not found')

    // ★ ここで順番を確定（必要なら本数は 3/4 に調整）
    rounds.clear()
    const first = rounds.start(list, 4)

    // ★ コンソールに現在の順番を出す
    const state = rounds.state()
    //const state = "sayaka"

    // console.log('[HOME] performer order:', state?.performers, 'idx=', state?.idx)

    // そのまま /work へ遷移（Home をハブにする場合）
    // router.push('/work')
  } catch (e:any) {
    err.value = e.message || String(e)
    // console.error('[HOME] init error:', e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
/* 右側の謎スペースを消すため、行のパディング・ガターを最小化 */
.row-line { margin: 2px 0; }

/* チェックボックス列は固定幅で右寄せ */
.right-col {
  width: 42px;              /* □の幅＋余白 */
  display: flex;
  justify-content: flex-end;
}

/* リストの見た目調整（画像に寄せる） */
.ul-none { list-style-type: none; padding-left: 0; }
.ul-tight { padding-left: 1.1rem; }
.indent  { padding-left: 1em; text-indent: -1em; }
.ol-tight { padding-left: 1.1rem; }
li { line-height: 1.8; }
</style>

<route lang="yaml">
meta:
  layout: default
</route>
