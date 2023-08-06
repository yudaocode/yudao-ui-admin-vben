<script lang="ts" setup>
import MenuModal from './MenuModal.vue'
import { columns, searchFormSchema } from './menu.data'
import { handleTree } from '@/utils/tree'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { useModal } from '@/components/Modal'
import { IconEnum } from '@/enums/appEnum'
import { BasicTable, TableAction, useTable } from '@/components/Table'
import { deleteMenu, getMenuList } from '@/api/system/menu'

defineOptions({ name: 'SystemMenu' })

const { t } = useI18n()
const { createMessage } = useMessage()
const [registerModal, { openModal }] = useModal()

const [register, { expandAll, collapseAll, getForm, reload }] = useTable({
  title: '菜单列表',
  api: getList,
  columns,
  rowKey: 'id',
  formConfig: { labelWidth: 120, schemas: searchFormSchema },
  isTreeTable: true,
  pagination: false,
  striped: false,
  useSearchForm: true,
  showTableSetting: true,
  bordered: true,
  showIndexColumn: false,
  canResize: false,
  actionColumn: {
    width: 140,
    title: t('common.action'),
    dataIndex: 'action',
    fixed: 'right',
  },
})
async function getList() {
  const res = await getMenuList(getForm().getFieldsValue() as any)
  return handleTree(res, 'id')
}

function handleCreate() {
  openModal(true, { isUpdate: false })
}

function handleEdit(record: Recordable) {
  openModal(true, { record, isUpdate: true })
}

async function handleDelete(record: Recordable) {
  await deleteMenu(record.id)
  createMessage.success(t('common.delSuccessText'))
  reload()
}
</script>

<template>
  <div>
    <BasicTable @register="register">
      <template #toolbar>
        <a-button v-auth="['system:menu:create']" type="primary" :pre-icon="IconEnum.ADD" @click="handleCreate">
          {{ t('action.create') }}
        </a-button>
        <a-button type="info" @click="expandAll">
          {{ t('component.tree.expandAll') }}
        </a-button>
        <a-button type="info" @click="collapseAll">
          {{ t('component.tree.unExpandAll') }}
        </a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              { icon: IconEnum.EDIT, label: t('action.edit'), auth: 'system:menu:update', onClick: handleEdit.bind(null, record) },
              {
                icon: IconEnum.DELETE,
                color: 'error',
                label: t('action.delete'),
                auth: 'system:menu:delete',
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
    <MenuModal @register="registerModal" @success="reload()" />
  </div>
</template>
