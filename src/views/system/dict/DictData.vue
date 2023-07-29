<script lang="ts" setup>
import { watch } from 'vue'
import DictDataModal from './DictDataModal.vue'
import { dataColumns, dataSearchFormSchema } from './dict.data'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { useModal } from '@/components/Modal'
import { IconEnum } from '@/enums/appEnum'
import { BasicTable, TableAction, useTable } from '@/components/Table'
import { deleteDictData, getDictDataPage } from '@/api/system/dict/data'

defineOptions({ name: 'SystemDictData' })

const props = defineProps({
  searchInfo: {
    type: Object as PropType<Recordable>,
    default: () => ({}),
  },
})

const { t } = useI18n()
const { createMessage } = useMessage()
const [registerModal, { openModal }] = useModal()

const [registerTable, { reload }] = useTable({
  title: '字典数据列表',
  api: getDictDataPage,
  columns: dataColumns,
  formConfig: {
    labelWidth: 120,
    schemas: dataSearchFormSchema,
    autoSubmitOnEnter: true,
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

function handleCreate() {
  openModal(true, {
    record: props.searchInfo.dictType,
    isUpdate: false,
  })
}

function handleEdit(record: Recordable) {
  openModal(true, { record, isUpdate: true })
}

async function handleDelete(record: Recordable) {
  await deleteDictData(record.id)
  createMessage.success(t('common.delSuccessText'))
  reload()
}

watch(
  () => props.searchInfo,
  (val) => {
    val && reload()
  },
  { deep: true },
)
</script>

<template>
  <div>
    <BasicTable :search-info="searchInfo" @register="registerTable">
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
    <DictDataModal @register="registerModal" @success="reload()" />
  </div>
</template>
