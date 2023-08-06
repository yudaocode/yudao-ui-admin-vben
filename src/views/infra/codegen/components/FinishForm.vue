<script lang="ts" setup>
import { Result } from 'ant-design-vue'
import { useRoute } from 'vue-router'
import PreviewModal from './PreviewModal.vue'
import { useModal } from '@/components/Modal'
import { useGo } from '@/hooks/web/usePage'
import { useI18n } from '@/hooks/web/useI18n'
import { useTabs } from '@/hooks/web/useTabs'
import { useMessage } from '@/hooks/web/useMessage'
import { downloadCodegen, getCodegenTable } from '@/api/infra/codegen'

const go = useGo()
const { closeCurrent } = useTabs()
const { query } = useRoute()
const { t } = useI18n()
const { createMessage } = useMessage()
const [registerPreviewModal, { openModal: openPreviewModal }] = useModal()

function handlePreview() {
  const tableId = query.id as unknown as number
  const record = { id: tableId }
  openPreviewModal(true, { record })
}

async function handleGenTable() {
  const tableId = query.id as unknown as number
  const res = await getCodegenTable(tableId)
  await downloadCodegen(res.table)
  createMessage.success(t('common.successText'))
}

function handleGoList() {
  closeCurrent()
  go('/infra/codegen')
}
</script>

<template>
  <div class="m-5 result-success">
    <Result status="success" title="代码生成成功" sub-title="可点击下方按钮预览、下载，或返回列表页。">
      <template #extra>
        <a-button key="console" type="primary" @click="handleGoList">
          返回列表
        </a-button>
        <a-button key="preview" @click="handlePreview">
          预览
        </a-button>
        <a-button key="download" @click="handleGenTable">
          生成
        </a-button>
      </template>
    </Result>
    <PreviewModal @register="registerPreviewModal" />
  </div>
</template>

<style lang="less" scoped>
.result-success {
  padding: 48px 32px;
  background-color: var(--component-background);

  &__content {
    padding: 24px 40px;
    background-color: @background-color-light;
  }
}
</style>
