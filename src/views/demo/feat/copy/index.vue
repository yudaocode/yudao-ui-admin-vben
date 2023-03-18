<template>
  <PageWrapper title="文本复制示例">
    <CollapseContainer class="w-full h-32 bg-white rounded-md" title="Copy Example">
      <div class="flex justify-center">
        <a-input placeholder="请输入" v-model:value="valueRef" />
        <a-button type="primary" @click="handleCopy"> Copy </a-button>
      </div>
    </CollapseContainer>
  </PageWrapper>
</template>
<script lang="ts" setup name="Copy">
import { unref, ref } from 'vue'
import { CollapseContainer } from '@/components/Container'
import { useCopyToClipboard } from '@/hooks/web/useCopyToClipboard'
import { useMessage } from '@/hooks/web/useMessage'
import { PageWrapper } from '@/components/Page'

const valueRef = ref('')
const { createMessage } = useMessage()
const { clipboardRef, copiedRef } = useCopyToClipboard()

function handleCopy() {
  const value = unref(valueRef)
  if (!value) {
    createMessage.warning('请输入要拷贝的内容！')
    return
  }
  clipboardRef.value = value
  if (unref(copiedRef)) {
    createMessage.warning('copy success！')
  }
}
</script>
