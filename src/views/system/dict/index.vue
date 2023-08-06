<script lang="ts" setup>
import { reactive } from 'vue'
import DictData from './DictData.vue'
import DictTypeModal from './DictTypeModal.vue'
import { typeColumns, typeSearchFormSchema } from './dict.type'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { useModal } from '@/components/Modal'
import { IconEnum } from '@/enums/appEnum'
import { BasicTable, TableAction, useTable } from '@/components/Table'
import { deleteDictType, getDictTypePage } from '@/api/system/dict/type'

defineOptions({ name: 'SystemDict' })

const { t } = useI18n()
const { createMessage } = useMessage()
const [registerModal, { openModal }] = useModal()
const searchInfo = reactive<Recordable>({})

const [registerTable, { reload }] = useTable({
  title: '字典分类列表',
  api: getDictTypePage,
  columns: typeColumns,
  formConfig: {
    labelWidth: 120,
    schemas: typeSearchFormSchema,
  },
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

function handleRowClick(record) {
  searchInfo.dictType = record.type
}

function handleCreate() {
  openModal(true, { isUpdate: false })
}

function handleEdit(record: Recordable) {
  openModal(true, { record, isUpdate: true })
}

async function handleDelete(record: Recordable) {
  await deleteDictType(record.id)
  createMessage.success(t('common.delSuccessText'))
  reload()
}
</script>

<template>
  <div class="flex">
    <BasicTable class="w-1/2" @register="registerTable" @row-click="handleRowClick">
      <template #toolbar>
        <a-button v-auth="['system:dict:create']" type="primary" :pre-icon="IconEnum.ADD" @click="handleCreate">
          {{ t('action.create') }}
        </a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              { icon: IconEnum.EDIT, label: t('action.edit'), auth: 'system:dict:update', onClick: handleEdit.bind(null, record) },
              {
                icon: IconEnum.DELETE,
                color: 'error',
                label: t('action.delete'),
                auth: 'system:dict:delete',
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
    <DictData class="w-1/2" :search-info="searchInfo" />
    <DictTypeModal @register="registerModal" @success="reload()" />
  </div>
</template>
