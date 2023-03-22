<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" :preIcon="IconEnum.UPLOAD" @click="handleAdd"> 上传文件 </a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: IconEnum.DELETE,
                color: 'error',
                label: t('action.delete'),
                popConfirm: {
                  title: t('common.delMessage'),
                  placement: 'left',
                  confirm: handleDelete.bind(null, record)
                }
              }
            ]"
          />
        </template>
      </template>
    </BasicTable>
  </div>
</template>
<script lang="ts" setup name="File">
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { IconEnum } from '@/enums/appEnum'
import { BasicTable, useTable, TableAction } from '@/components/Table'
import { deleteFileApi, getFilePageApi } from '@/api/infra/file'
import { columns, searchFormSchema } from './file.data'

const { t } = useI18n()
const { createMessage } = useMessage()

const [registerTable, { reload }] = useTable({
  title: '文件列表',
  api: getFilePageApi,
  columns,
  formConfig: {
    labelWidth: 120,
    schemas: searchFormSchema
  },
  useSearchForm: true,
  showTableSetting: true,
  showIndexColumn: false,
  actionColumn: {
    width: 140,
    title: t('common.action'),
    dataIndex: 'action',
    fixed: 'right'
  }
})

function handleAdd() {
  console.info(1)
}

async function handleDelete(record: Recordable) {
  await deleteFileApi(record.id)
  createMessage.success(t('common.delSuccessText'))
  reload()
}
</script>
