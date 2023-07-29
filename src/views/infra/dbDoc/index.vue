<script setup lang="ts" name="InfraDbDoc">
import { onMounted, ref } from 'vue'
import { PageWrapper } from '@/components/Page'
import { useI18n } from '@/hooks/web/useI18n'
import { IFrame } from '@/components/IFrame'
import * as DbDocApi from '@/api/infra/dbDoc'
import { downloadByData } from '@/utils/file/download'

const { t } = useI18n()
const src = ref('')
/** 页面加载 */
async function init() {
  const res = await DbDocApi.exportHtml()
  const blob = new Blob([res], { type: 'text/html' })
  const blobUrl = window.URL.createObjectURL(blob)
  src.value = blobUrl
}
/** 处理导出  */
async function handleExport(type: string) {
  if (type === 'HTML') {
    const res = await DbDocApi.exportHtml()
    downloadByData(res, '数据库文档.html')
  }
  if (type === 'Word') {
    const res = await DbDocApi.exportWord()
    downloadByData(res, '数据库文档.doc')
  }
  if (type === 'Markdown') {
    const res = await DbDocApi.exportMarkdown()
    downloadByData(res, '数据库文档.md')
  }
}
onMounted(async () => {
  await init()
})
</script>

<template>
  <PageWrapper>
    <div class="mb-3">
      <a-button type="primary" size="small" class="mr-1" @click="handleExport('HTML')">
        {{ `${t('action.export')}Html` }}
      </a-button>
      <a-button type="primary" size="small" class="mr-1" @click="handleExport('Word')">
        {{ `${t('action.export')}Word` }}
      </a-button>
      <a-button type="primary" size="small" @click="handleExport('Markdown')">
        {{ `${t('action.export')}Markdown` }}
      </a-button>
    </div>
    <IFrame :src="src" />
  </PageWrapper>
</template>
