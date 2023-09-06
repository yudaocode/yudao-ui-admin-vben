<script lang="ts" setup>
import GroupModal from './GroupModal.vue'
import { columns, searchFormSchema } from './group.data'
import { useI18n } from '@/hooks/web/useI18n'
import { useModal } from '@/components/Modal'
import { IconEnum } from '@/enums/appEnum'
import { BasicTable, TableAction, useTable } from '@/components/Table'
import { getGroupPage } from '@/api/member/group'

defineOptions({ name: 'MemberGroup' })

const { t } = useI18n()
const [registerModal, { openModal }] = useModal()
const [registerTable, { reload }] = useTable({
  title: '会员分组',
  api: getGroupPage,
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
              { icon: IconEnum.EDIT, label: t('action.edit'), auth: 'member:group:update', onClick: handleEdit.bind(null, record) },
            ]"
          />
        </template>
      </template>
    </BasicTable>
    <GroupModal @register="registerModal" @success="reload()" />
  </div>
</template>
