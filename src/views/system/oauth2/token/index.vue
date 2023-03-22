<template>
  <div>
    <BasicTable @register="registerTable">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: IconEnum.DELETE,
                color: 'error',
                label: '强退',
                popConfirm: {
                  title: '是否确认强退',
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
<script lang="ts" setup name="Token">
import { useI18n } from '@/hooks/web/useI18n'
import { IconEnum } from '@/enums/appEnum'
import { BasicTable, useTable, TableAction } from '@/components/Table'
import { deleteAccessTokenApi, getAccessTokenPageApi } from '@/api/system/oauth2/token'
import { columns, searchFormSchema } from './token.data'
import { useMessage } from '@/hooks/web/useMessage'

const { t } = useI18n()
const { createMessage } = useMessage()
const [registerTable, { reload }] = useTable({
  title: 'Token列表',
  api: getAccessTokenPageApi,
  columns,
  formConfig: {
    labelWidth: 120,
    schemas: searchFormSchema
  },
  useSearchForm: true,
  showTableSetting: true,
  showIndexColumn: false,
  actionColumn: {
    width: 60,
    title: t('common.action'),
    dataIndex: 'action',
    fixed: 'right'
  }
})

async function handleDelete(record: Recordable) {
  await deleteAccessTokenApi(record.id)
  createMessage.success(t('common.delSuccessText'))
  reload()
}
</script>
