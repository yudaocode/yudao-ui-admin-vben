<template>
  <div>
    <BasicTable @register="register">
      <template #toolbar>
        <a-button type="primary" @click="expandAll">展开全部</a-button>
        <a-button type="primary" @click="collapseAll">折叠全部</a-button>
      </template>
    </BasicTable>
  </div>
</template>
<script lang="ts" setup name="Post">
import { BasicTable, useTable } from '@/components/Table'
import { getMenuListApi } from '@/api/system/menu'
import { columns, searchFormSchema } from './menu.data'
const [register, { expandAll, collapseAll }] = useTable({
  title: '菜单列表',
  api: getMenuListApi,
  columns,
  rowKey: 'id',
  formConfig: {
    labelWidth: 120,
    schemas: searchFormSchema
  },
  isTreeTable: true,
  useSearchForm: true,
  pagination: false,
  showIndexColumn: false,
  actionColumn: {
    width: 120,
    title: '操作',
    dataIndex: 'action',
    fixed: 'right'
  }
})
</script>
