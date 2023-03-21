<template>
  <div class="flex">
    <BasicTable @register="registerTable" class="w-1/2 xl:w-1/2" @row-click="handleRowClick">
      <template #toolbar>
        <a-button type="primary" @click="handleCreate">新增字典类型</a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: 'clarity:note-edit-line',
                tooltip: '编辑字典分类',
                onClick: handleEdit.bind(null, record)
              },
              {
                icon: 'ant-design:delete-outlined',
                color: 'error',
                tooltip: '删除字典分类',
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
    <DictData class="w-1/2 xl:w-1/2" :searchInfo="searchInfo" />
    <DictTypeModel @register="registerModal" @success="reload()" />
  </div>
</template>
<script lang="ts" setup name="Dict">
import { reactive } from 'vue'
import { BasicTable, useTable, TableAction } from '@/components/Table'
import { useModal } from '@/components/Modal'
import DictData from './DictData.vue'
import DictTypeModel from './DictTypeModel.vue'
import { typeColumns, typeSearchFormSchema } from './dict.type'
import { deleteDictTypeApi, getDictTypePageApi } from '@/api/system/dict/type'
import { useMessage } from '@/hooks/web/useMessage'

const { createConfirm, createMessage } = useMessage()
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
    title: '操作',
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
  createConfirm({
    title: '删除',
    iconType: 'warning',
    content: '是否要删除数据？',
    async onOk() {
      await deleteDictTypeApi(record.id)
      createMessage.success('删除成功')
      reload()
    }
  })
}
</script>
