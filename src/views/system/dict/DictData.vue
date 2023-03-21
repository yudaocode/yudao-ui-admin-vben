<template>
  <div>
    <BasicTable @register="registerTable" :searchInfo="searchInfo">
      <template #toolbar>
        <a-button type="primary" @click="handleCreate">新增字典数据</a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: 'clarity:note-edit-line',
                tooltip: '编辑字典数据',
                onClick: handleEdit.bind(null, record)
              },
              {
                icon: 'ant-design:delete-outlined',
                color: 'error',
                tooltip: '删除字典数据',
                popConfirm: {
                  title: '是否确认删除',
                  placement: 'left',
                  confirm: handleDelete.bind(null, record)
                }
              }
            ]"
          />
        </template>
      </template>
    </BasicTable>
    <DictDataModel @register="registerModal" @success="reload()" />
  </div>
</template>
<script lang="ts" setup name="DictData">
import { watch } from 'vue'
import { BasicTable, useTable, TableAction } from '@/components/Table'
import { useModal } from '@/components/Modal'
import DictDataModel from './DictDataModel.vue'
import { dataColumns, dataSearchFormSchema } from './dict.data'
import { deleteDictDataApi, getDictDataPageApi } from '@/api/system/dict/data'
import { useMessage } from '@/hooks/web/useMessage'

const props = defineProps({
  searchInfo: {
    type: Object as PropType<Recordable>,
    default: () => ({})
  }
})

const { createConfirm, createMessage } = useMessage()
const [registerModal, { openModal }] = useModal()
// const searchInfo = reactive<Recordable>({})

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
    width: 120,
    title: '操作',
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

function handleDelete(record: Recordable) {
  createConfirm({
    title: '删除',
    iconType: 'warning',
    content: '是否要删除数据？',
    async onOk() {
      await deleteDictDataApi(record.id)
      createMessage.success('删除成功')
      reload()
    }
  })
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
