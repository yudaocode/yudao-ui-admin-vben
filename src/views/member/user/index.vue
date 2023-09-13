<script lang="ts" setup>
import UserModal from './UserModal.vue'
import UserDetailDrawer from './UserDetailDrawer.vue'
import UpdateLevelModal from './UpdateLevelModal.vue'
import { columns, searchFormSchema } from './user.data'
import { useI18n } from '@/hooks/web/useI18n'
import { useModal } from '@/components/Modal'
import { useDrawer } from '@/components/Drawer'
import { IconEnum } from '@/enums/appEnum'
import { BasicTable, TableAction, useTable } from '@/components/Table'
import { getUserPage } from '@/api/member/user'

defineOptions({ name: 'MemberUser' })

const { t } = useI18n()
const [registerModal, { openModal }] = useModal()
const [registerDetailDrawer, { openDrawer }] = useDrawer()
const [registerUpdateLevelModal, { openModal: openUpdateLevelModal }] = useModal()
const [registerTable, { reload }] = useTable({
  title: '会员列表',
  api: getUserPage,
  columns,
  formConfig: { labelWidth: 120, schemas: searchFormSchema },
  useSearchForm: true,
  showTableSetting: true,
  showIndexColumn: false,
  actionColumn: {
    width: 240,
    title: t('common.action'),
    dataIndex: 'action',
    fixed: 'right',
  },
})

function handleDetail(record: Recordable) {
  openDrawer(true, record)
}

function handleEdit(record: Recordable) {
  openModal(true, { record, isUpdate: true })
}

function updateLevelFormRef(record: Recordable) {
  openUpdateLevelModal(true, { record, isUpdate: true })
}
</script>

<template>
  <div>
    <BasicTable @register="registerTable">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              { icon: IconEnum.VIEW, label: t('action.detail'), auth: 'member:user:update', onClick: handleDetail.bind(null, record) },
              { icon: IconEnum.EDIT, label: t('action.edit'), auth: 'member:user:update', onClick: handleEdit.bind(null, record) },
              { icon: IconEnum.EDIT, label: '修改等级', auth: 'member:user:update-level', onClick: updateLevelFormRef.bind(null, record) },
            ]"
          />
        </template>
      </template>
    </BasicTable>
    <UserModal @register="registerModal" @success="reload()" />
    <UpdateLevelModal @register="registerUpdateLevelModal" @success="reload()" />
    <UserDetailDrawer @register="registerDetailDrawer" />
  </div>
</template>
