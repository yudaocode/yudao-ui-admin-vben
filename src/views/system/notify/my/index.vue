<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" @click="handleUpdateList"> 标记已读 </a-button>
        <a-button type="primary" @click="handleUpdateAll"> 全部已读 </a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction :actions="[{ icon: IconEnum.EDIT, label: '已读', onClick: handleUpdateSingle.bind(null, record) }]" />
        </template>
      </template>
    </BasicTable>
  </div>
</template>
<script lang="ts" setup name="SystemMyMessage">
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { IconEnum } from '@/enums/appEnum'
import { BasicTable, useTable, TableAction } from '@/components/Table'
import { getMyNotifyMessagePage, updateAllNotifyMessageRead, updateNotifyMessageRead } from '@/api/system/notify/message'
import { columns, searchFormSchema } from './my.data'

const { t } = useI18n()
const { createMessage } = useMessage()

const [registerTable, { getSelectRowKeys, reload }] = useTable({
  title: '我的站内信列表',
  api: getMyNotifyMessagePage,
  columns,
  formConfig: { labelWidth: 120, schemas: searchFormSchema },
  rowSelection: { type: 'checkbox' },
  rowKey: 'id',
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

function handleUpdateList() {
  const ids = getSelectRowKeys()
  handleUpdate(ids)
}

async function handleUpdateSingle(record: Recordable) {
  await handleUpdate([record.id])
}

async function handleUpdate(ids) {
  await updateNotifyMessageRead(ids)
  createMessage.success('标记已读成功！')
  reload()
}

async function handleUpdateAll() {
  await updateAllNotifyMessageRead()
  createMessage.success('全部已读成功！')
  reload()
}
</script>
