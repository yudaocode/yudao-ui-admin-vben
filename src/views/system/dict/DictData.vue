<template>
  <div>
    <BasicTable @register="registerTable">
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
// import { reactive } from 'vue'
import { BasicTable, useTable, TableAction } from '@/components/Table'
import { useModal } from '@/components/Modal'
import DictDataModel from './DictDataModel.vue'
import { dataColumns, dataSearchFormSchema } from './dict.data'
import { getDictDataPageApi } from '@/api/system/dict/data'

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
    isUpdate: false
  })
}

function handleEdit(record: Recordable) {
  console.log(record)
  openModal(true, {
    record,
    isUpdate: true
  })
}

function handleDelete(record: Recordable) {
  console.log(record)
}

// function handleSuccess({ isUpdate, values }) {
//   if (isUpdate) {
//     // 演示不刷新表格直接更新内部数据。
//     // 注意：updateTableDataRecord要求表格的rowKey属性为string并且存在于每一行的record的keys中
//     const result = updateTableDataRecord(values.id, values)
//     console.log(result)
//   } else {
//     reload()
//   }
// }

// function handleSelect(deptId = '') {
//   searchInfo.deptId = deptId
//   reload()
// }
</script>
