<script lang="ts" setup>
import { ref } from 'vue'
import { CodeEditor, MODE } from '@/components/CodeEditor'

import { useMessage } from '@/hooks/web/useMessage'
import { copyText } from '@/utils/copyTextToClipboard'

const props = defineProps(
  {
    fileFormat: {
      type: String,
      default: 'json',
    },
    editorJson: {
      type: String,
      default: '',
    },
  },
)

const myEditor = ref(null)

function exportData(data: string, fileName = `file.${props.fileFormat}`) {
  let content = 'data:text/csv;charset=utf-8,'
  content += data
  const encodedUri = encodeURI(content)
  const actions = document.createElement('a')
  actions.setAttribute('href', encodedUri)
  actions.setAttribute('download', fileName)
  actions.click()
}

function handleExportJson() {
  exportData(props.editorJson)
}
const { createMessage } = useMessage()

function handleCopyJson() {
  // 复制数据
  const value = props.editorJson
  if (!value) {
    createMessage.warning('代码为空！')
    return
  }
  copyText(value)
}
</script>

<template>
  <div>
    <div class="v-json-box">
      <CodeEditor ref="myEditor" :value="editorJson" :mode="MODE.JSON" />
    </div>
    <div class="pt-2 text-center">
      <a-button
        type="primary"
        class="mr-2"
        data-clipboard-action="copy"
        :data-clipboard-text="editorJson"
        @click="handleCopyJson"
      >
        复制数据
      </a-button>
      <a-button type="primary" @click="handleExportJson">
        导出代码
      </a-button>
    </div>
  </div>
</template>
