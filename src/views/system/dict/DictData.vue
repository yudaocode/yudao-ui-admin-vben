<template>
  <div>
    <BasicTable @register="registerTable" :searchInfo="searchInfo">
      <template #toolbar>
        <a-button type="primary" @click="handleCreate"> {{ t('action.create') }}</a-button>
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
    <DictDataModal @register="registerModal" @success="reload()" />
  </div>
</template>
<script lang="ts" setup name="DictData">
import { watch } from 'vue'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { useModal } from '@/components/Modal'
import DictDataModal from './DictDataModal.vue'
import { BasicTable, useTable, TableAction } from '@/components/Table'
import { dataColumns, dataSearchFormSchema } from './dict.data'
import { deleteDictDataApi, getDictDataPageApi } from '@/api/system/dict/data'

const props = defineProps({
  searchInfo: {
    type: Object as PropType<Recordable>,
    default: () => ({})
  }
})

const { t } = useI18n()
const { createMessage } = useMessage()
const [registerModal, { openModal }] = useModal()

const [registerTable, { reload }] = useTable({
  title: '字典数据列表',
  api: getDictDataPageApi,
  columns: dataColumns,
  formConfig: {
    labelWidth: 120,
    schemas: dataSearchFormSchema,
    autoSubmitOnEnter: true
  },
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

function handleCreate() {
  openModal(true, {
    record: props.searchInfo.dictType,
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
  await deleteDictDataApi(record.id)
  createMessage.success(t('common.delSuccessText'))
  reload()
}

watch(
  () => props.searchInfo,
  (val) => {
    console.info(val)
    val && reload()
  },
  { deep: true }
)
</script>
