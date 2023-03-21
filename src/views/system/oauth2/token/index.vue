<template>
  <div>
    <BasicTable @register="registerTable">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: 'ant-design:delete-outlined',
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
import { BasicTable, useTable, TableAction } from '@/components/Table'
import { deleteAccessTokenApi, getAccessTokenPageApi } from '@/api/system/oauth2/token'
import { columns, searchFormSchema } from './token.data'
import { useMessage } from '@/hooks/web/useMessage'

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
    width: 100,
    title: '操作',
    dataIndex: 'action',
    fixed: 'right'
  }
})

async function handleDelete(record: Recordable) {
  await deleteAccessTokenApi(record.id)
  createMessage.success('删除成功')
  reload()
}
</script>
