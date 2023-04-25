<template>
  <div>
    <BasicTable @register="registerTable">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[{ icon: IconEnum.VIEW, label: '消息', auth: 'mp:message:send', onClick: handleEdit.bind(null, record) }]"
          />
        </template>
      </template>
    </BasicTable>
    <AccountModal @register="registerModal" @success="reload()" />
  </div>
</template>
<script lang="ts" setup name="MpMessage">
import { useI18n } from '@/hooks/web/useI18n'
import { useModal } from '@/components/Modal'
import AccountModal from './MessageModal.vue'
import { IconEnum } from '@/enums/appEnum'
import { BasicTable, useTable, TableAction } from '@/components/Table'
import { getMessagePage } from '@/api/mp/message'
import { columns, searchFormSchema } from './message.data'

const { t } = useI18n()
const [registerModal, { openModal }] = useModal()

const [registerTable, { reload }] = useTable({
  title: '公众号消息列表',
  api: getMessagePage,
  columns,
  formConfig: { labelWidth: 120, schemas: searchFormSchema },
  useSearchForm: true,
  showTableSetting: true,
  actionColumn: {
    width: 140,
    title: t('common.action'),
    dataIndex: 'action',
    fixed: 'right'
  }
})

/** 修改按钮操作 */
function handleEdit(record: Recordable) {
  openModal(true, { record })
}
</script>
