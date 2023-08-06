<script lang="ts" setup>
import RoleModal from './RoleModal.vue'
import RoleMenuModal from './RoleMenuModal.vue'
import RoleScopeModal from './RoleScopeModal.vue'
import { columns, searchFormSchema } from './role.data'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { useModal } from '@/components/Modal'
import { IconEnum } from '@/enums/appEnum'
import { BasicTable, TableAction, useTable } from '@/components/Table'
import type { RoleExportReqVO } from '@/api/system/role'
import { deleteRole, exportRole, getRolePage } from '@/api/system/role'

defineOptions({ name: 'SystemRole' })

const { t } = useI18n()
const { createConfirm, createMessage } = useMessage()
const [registerModal, { openModal }] = useModal()
const [registerMenuModal, { openModal: openMenuModal }] = useModal()
const [registerScopeModal, { openModal: openScopeModal }] = useModal()
const [registerTable, { getForm, reload }] = useTable({
  title: '角色列表',
  api: getRolePage,
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

function handleCreate() {
  openModal(true, { isUpdate: false })
}

function handleEdit(record: Recordable) {
  openModal(true, { record, isUpdate: true })
}

function handleMenu(record: Recordable) {
  openMenuModal(true, { record })
}

function handleDataScope(record: Recordable) {
  openScopeModal(true, { record })
}

async function handleExport() {
  createConfirm({
    title: t('common.exportTitle'),
    iconType: 'warning',
    content: t('common.exportMessage'),
    async onOk() {
      await exportRole(getForm().getFieldsValue() as RoleExportReqVO)
      createMessage.success(t('common.exportSuccessText'))
    },
  })
}

async function handleDelete(record: Recordable) {
  await deleteRole(record.id)
  createMessage.success(t('common.delSuccessText'))
  reload()
}
</script>

<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button v-auth="['system:role:create']" type="primary" :pre-icon="IconEnum.ADD" @click="handleCreate">
          {{ t('action.create') }}
        </a-button>
        <a-button v-auth="['system:role:create']" type="warning" :pre-icon="IconEnum.EXPORT" @click="handleExport">
          {{ t('action.export') }}
        </a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              { icon: IconEnum.EDIT, label: t('action.edit'), auth: 'system:role:update', onClick: handleEdit.bind(null, record) },
            ]"
            :drop-down-actions="[
              {
                icon: IconEnum.EDIT,
                label: '菜单权限',
                auth: 'system:permission:assign-role-menu',
                onClick: handleMenu.bind(null, record),
              },
              {
                icon: IconEnum.EDIT,
                label: '数据权限',
                auth: 'system:permission:assign-role-data-scope',
                onClick: handleDataScope.bind(null, record),
              },
              {
                icon: IconEnum.DELETE,
                color: 'error',
                label: t('action.delete'),
                auth: 'system:role:delete',
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
    <RoleModal @register="registerModal" @success="reload()" />
    <RoleMenuModal @register="registerMenuModal" @success="reload()" />
    <RoleScopeModal @register="registerScopeModal" @success="reload()" />
  </div>
</template>
