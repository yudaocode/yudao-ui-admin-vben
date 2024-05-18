<script lang="ts" setup>
import Demo02CategoryModal from './Demo02CategoryModal.vue'
import { columns, searchFormSchema } from './demo02Category.data'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { useModal } from '@/components/Modal'
import { BasicTable, TableAction, useTable } from '@/components/Table'
import { deleteDemo02Category, exportDemo02Category, getDemo02CategoryPage } from '@/api/infra/demo/demo02'
import { IconEnum } from '@/enums/appEnum'
import { handleTree } from '@/utils/tree'
import { nextTick } from 'vue'

defineOptions({ name: 'Demo02Category' })

const { t } = useI18n()
const { createConfirm, createMessage } = useMessage()
const [registerModal, { openModal }] = useModal()

const [registerTable, { expandAll, collapseAll, getForm, reload }] = useTable({
  title: '示例分类列表',
  api: getList,
  columns,
  rowKey: 'id',
  formConfig: { labelWidth: 120, schemas: searchFormSchema },
  isTreeTable: true,
  pagination: false,
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

async function getList() {
  const res = await getDemo02CategoryPage(getForm().getFieldsValue() as any)
  return handleTree(res, 'id')
}

function onFetchSuccess() {
  nextTick(expandAll)
}

function handleCreate() {
  openModal(true, { isUpdate: false })
}

function handleEdit(record: Recordable) {
  openModal(true, { record, isUpdate: true })
}

async function handleExport() {
  createConfirm({
    title: t('common.exportTitle'),
    iconType: 'warning',
    content: t('common.exportMessage'),
    async onOk() {
      await exportDemo02Category(getForm().getFieldsValue())
      createMessage.success(t('common.exportSuccessText'))
    }
  })
}

async function handleDelete(record: Recordable) {
  await deleteDemo02Category(record.id)
  createMessage.success(t('common.delSuccessText'))
  reload()
}
</script>
<template>
  <div>
    <BasicTable @register="registerTable" @fetch-success="onFetchSuccess">
      <template #toolbar>
        <a-button type="primary" v-auth="['infra:demo02-category:create']" :preIcon="IconEnum.ADD" @click="handleCreate">
          {{ t('action.create') }}
        </a-button>
        <a-button v-auth="['infra:demo02-category:export']" :preIcon="IconEnum.EXPORT" @click="handleExport">
          {{ t('action.export') }}
        </a-button>
        <a-button type="dashed" @click="expandAll">{{ t('component.tree.expandAll') }}</a-button>
        <a-button type="dashed" @click="collapseAll">{{ t('component.tree.unExpandAll') }}</a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: IconEnum.EDIT,
                label: t('action.edit'),
                auth: 'infra:demo02-category:update',
                onClick: handleEdit.bind(null, record)
              },
              {
                icon: IconEnum.DELETE,
                danger: true,
                label: t('action.delete'),
                auth: 'infra:demo02-category:delete',
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
    <Demo02CategoryModal @register="registerModal" @success="reload()" />
  </div>
</template>
