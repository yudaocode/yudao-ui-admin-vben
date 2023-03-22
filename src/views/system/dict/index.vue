<template>
  <div class="flex">
    <BasicTable @register="registerTable" class="w-1/2 xl:w-1/2" @row-click="handleRowClick">
      <template #toolbar>
        <a-button type="primary" @click="handleCreate">{{ t('action.create') }}</a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              { icon: 'clarity:note-edit-line', label: t('action.edit'), onClick: handleEdit.bind(null, record) },
              {
                icon: 'ant-design:delete-outlined',
                color: 'error',
                label: t('action.delete'),
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
    <DictData class="w-1/2 xl:w-1/2" :searchInfo="searchInfo" />
    <DictTypeModel @register="registerModal" @success="reload()" />
  </div>
</template>
<script lang="ts" setup name="Dict">
import { reactive } from 'vue'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { useModal } from '@/components/Modal'
import DictData from './DictData.vue'
import DictTypeModel from './DictTypeModel.vue'
import { BasicTable, useTable, TableAction } from '@/components/Table'
import { typeColumns, typeSearchFormSchema } from './dict.type'
import { deleteDictTypeApi, getDictTypePageApi } from '@/api/system/dict/type'

const { t } = useI18n()
const { createMessage } = useMessage()
const [registerModal, { openModal }] = useModal()
const searchInfo = reactive<Recordable>({})

const [registerTable, { reload }] = useTable({
  title: '字典分类列表',
  api: getDictTypePageApi,
  columns: typeColumns,
  formConfig: {
    labelWidth: 120,
    schemas: typeSearchFormSchema
  },
  useSearchForm: true,
  showTableSetting: true,
  showIndexColumn: false,
  actionColumn: {
    width: 120,
    title: t('common.action'),
    dataIndex: 'action',
    fixed: 'right'
  }
})

function handleRowClick(record) {
  console.info(record.type)
  searchInfo.dictType = record.type
}

function handleCreate() {
  openModal(true, {
    isUpdate: false
  })
}

function handleEdit(record: Recordable) {
  openModal(true, {
    record,
    isUpdate: true
  })
}

async function handleDelete(record: Recordable) {
  await deleteDictTypeApi(record.id)
  createMessage.success(t('common.delSuccessText'))
  reload()
}
</script>
