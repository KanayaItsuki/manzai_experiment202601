<template>
  <v-container class="py-10 max-w-screen-md">
    <v-card class="rounded-xl" elevation="0" variant="outlined">
      <v-toolbar flat density="comfortable">
        <v-toolbar-title>実験は以上です．ご協力ありがとうございました！</v-toolbar-title>
      </v-toolbar>
      <v-divider />

      <div class="p-6 space-y-6">
        <!-- 完了コード -->
        <section>
          <div class="sec-title">完了コード</div>
          <v-alert type="success" variant="tonal" class="rounded-xl">
            <div class="flex items-center justify-between gap-4">
              <div class="text-lg font-semibold tracking-wider">{{ completionCode || '—' }}</div>
              <!-- <v-btn variant="tonal" prepend-icon="mdi-content-copy" @click="copyCode" :disabled="!completionCode">
                コードをコピー
              </v-btn> -->
            </div>
          </v-alert>
        </section>

        <!-- 報酬案内（例） -->
        <section>
          <div class="sec-title">報酬について</div>
          <ul class="list">
            <li>謝礼：<strong>1,250円</strong></li>
            <li>受け取り方法：後日，中野キャンパス1008中村聡史研究室に取りに来ていただきます．</li>
            <li>上に表示されている完了コードと，この画面をスクリーンショットしていただき，<strong>コードとスクショの2つをFMS Slackの「B4-3-17 金谷一輝」のDMに送ってください．</strong></li>
            <li>データ確認後，報酬の受取日に関するご連絡をさせていただきます．</li>
          </ul>
        </section>

        <!-- 連絡先 -->
        <section>
          <div class="sec-title">お問い合わせ</div>
          <p class="text-gray-700">
            本研究に関するお問い合わせは下記までお願いします．<br>
            連絡先：<strong>（FMS中村聡史研究室・金谷一輝・kanaya@nkmr-lab.org）</strong>
          </p>
        </section>
      </div>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const COMPLETION_KEY = 'manzai-completion-code-v1'
const USER_ID_KEY = 'manzai-user-id-v1'
const completionCode = ref<string>('')
const participantId = ref<string>('') 

onMounted(() => {
  try { completionCode.value = localStorage.getItem(COMPLETION_KEY) || '' } catch { }
  try { participantId.value = localStorage.getItem(USER_ID_KEY) || '' } catch {} 
  // 念のため、コードが無ければ発行（直リンク対策）
  if (!completionCode.value) {
    completionCode.value = genFallbackCode()
    try { localStorage.setItem(COMPLETION_KEY, completionCode.value) } catch {}
  }
})

function genFallbackCode() {
  const r = () => Math.random().toString(36).slice(2,6).toUpperCase()
  return `MZ-${r()}-${r()}`
}

async function copyCode() {
  if (!completionCode.value) return
  try {
    await navigator.clipboard.writeText(completionCode.value)
    // 軽いトースト代わり
    alert('完了コードをコピーしました')
  } catch {
    alert('コピーに失敗しました。手動で控えてください。')
  }
}

function toTop() {
  router.replace({ path: '/' })
}

function openPolicy() {
  // 研究説明PDFなどに差し替え
  window.open('/consent.pdf', '_blank')
}
</script>

<style scoped>
.max-w-screen-md{ max-width: 860px; margin-inline: auto; }
.p-6{ padding: 1.5rem; }
.space-y-6 > * + *{ margin-top: 1.5rem; }
.sec-title{ font-weight: 700; margin-bottom: .25rem; }
.list{ padding-left: 1.2rem; }
.list li{ list-style: disc; margin: .25rem 0; }
</style>
