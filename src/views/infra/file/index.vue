<script lang="ts" setup>
import { ref, unref } from 'vue'
import { columns, searchFormSchema } from './file.data'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { useCopyToClipboard } from '@/hooks/web/useCopyToClipboard'
import { IconEnum } from '@/enums/appEnum'
import { BasicUpload } from '@/components/Upload'
import { BasicTable, TableAction, useTable } from '@/components/Table'
import { deleteFile, getFilePage } from '@/api/infra/file'
import { getAccessToken, getTenantId } from '@/utils/auth'
import { uploadApi } from '@/api/base/upload'

defineOptions({ name: 'InfraFile' })

const { t } = useI18n()
const { createMessage } = useMessage()
const { clipboardRef, copiedRef } = useCopyToClipboard()

const uploadParams = ref({
  'Authorization': `Bearer ${getAccessToken()}`,
  'tenant-id': getTenantId(),
})

const [registerTable, { reload }] = useTable({
  title: '文件列表',
  api: getFilePage,
  columns,
  formConfig: { labelWidth: 120, schemas: searchFormSchema },
  useSearchForm: true,
  showTableSetting: true,
  showIndexColumn: false,
  actionColumn: {
    width: 160,
    title: t('common.action'),
    dataIndex: 'action',
    fixed: 'right',
  },
})

function handleChange() {
  reload()
}

function handleCopy(record: Recordable) {
  clipboardRef.value = record.url
  if (unref(copiedRef))
    createMessage.warning('复制成功')
}

async function handleDelete(record: Recordable) {
  await deleteFile(record.id)
  createMessage.success(t('common.delSuccessText'))
  reload()
}
</script>

<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <BasicUpload
          :max-size="20"
          :max-number="10"
          :empty-hide-preview="true"
          :upload-params="uploadParams"
          :api="uploadApi"
          class="my-5"
          :accept="['image/*']"
          @change="handleChange"
        />
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              { icon: IconEnum.VIEW, label: '复制链接', onClick: handleCopy.bind(null, record) },
              {
                icon: IconEnum.DELETE,
                color: 'error',
                label: t('action.delete'),
                auth: 'infra:file:delete',
                popConfirm: {
                  title: t('common.delMessage'),
                  placement: 'left',
                  confirm: handleDelete.bind(null, record),
                },
              },
            ]"
          />
        </template>
      </template>
    </BasicTable>
  </div>
</template>
