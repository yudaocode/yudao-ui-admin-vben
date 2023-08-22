<script lang="ts" setup>
import UserModal from './UserModal.vue'
import { columns, searchFormSchema } from './user.data'
import { useI18n } from '@/hooks/web/useI18n'
import { useModal } from '@/components/Modal'
import { IconEnum } from '@/enums/appEnum'
import { BasicTable, TableAction, useTable } from '@/components/Table'
import { getUserPage } from '@/api/member/user'

defineOptions({ name: 'MemberUser' })

const { t } = useI18n()
const [registerModal, { openModal }] = useModal()
const [registerTable, { reload }] = useTable({
  title: '用户列表',
  api: getUserPage,
  columns,
  formConfig: { labelWidth: 120, schemas: searchFormSchema },
  useSearchForm: true,
  showTableSetting: true,
  showIndexColumn: false,
  actionColumn: {
    width: 140,
    title: t('common.action'),
    dataIndex: 'action',
    fixed: 'right',
  },
})

function handleEdit(record: Recordable) {
  openModal(true, { record, isUpdate: true })
}
</script>

<template>
  <div>
    <BasicTable @register="registerTable">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              { icon: IconEnum.EDIT, label: t('action.edit'), auth: 'system:notice:update', onClick: handleEdit.bind(null, record) },
            ]"
          />
        </template>
      </template>
    </BasicTable>
    <UserModal @register="registerModal" @success="reload()" />
  </div>
</template>
