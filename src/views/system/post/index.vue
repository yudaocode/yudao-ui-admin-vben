<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" @click="handleCreate"> 新增 </a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: 'clarity:note-edit-line',
                onClick: handleEdit.bind(null, record)
              },
              {
                icon: 'ant-design:delete-outlined',
                color: 'error',
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
    <PostModel @register="registerModal" @success="handleSuccess" />
  </div>
</template>
<script lang="ts" setup name="Post">
import { BasicTable, useTable, useRender, TableAction, BasicColumn, FormSchema } from '@/components/Table'
import { getPostPageApi } from '@/api/system/post'
import { useModal } from '@/components/Modal'
import PostModel from './PostModel.vue'
import { DICT_TYPE } from '@/utils/dict'

const columns: BasicColumn[] = [
  {
    title: '岗位编号',
    dataIndex: 'id',
    width: 100
  },
  {
    title: '岗位名称',
    dataIndex: 'name',
    width: 180
  },
  {
    title: '岗位编码',
    dataIndex: 'code',
    width: 100
  },
  {
    title: '岗位顺序',
    dataIndex: 'sort',
    width: 120
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.COMMON_STATUS)
    }
  },
  {
    title: '备注',
    dataIndex: 'remark'
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    }
  }
]

const searchFormSchema: FormSchema[] = [
  {
    field: 'name',
    label: '岗位名称',
    component: 'Input',
    colProps: { span: 8 }
  },
  {
    field: 'code',
    label: '岗位编码',
    component: 'Input',
    colProps: { span: 8 }
  },
  {
    field: 'status',
    label: '状态',
    component: 'Select',
    componentProps: {
      options: [
        { label: '启用', value: '0' },
        { label: '停用', value: '1' }
      ]
    },
    colProps: { span: 8 }
  }
]
const [registerModal, { openModal }] = useModal()
const [registerTable, { reload }] = useTable({
  title: '岗位列表',
  api: getPostPageApi,
  columns,
  formConfig: {
    labelWidth: 120,
    schemas: searchFormSchema
  },
  useSearchForm: true,
  showTableSetting: true,
  // bordered: true,
  // showIndexColumn: false,
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
  openModal(true, {
    record,
    isUpdate: true
  })
}

function handleDelete(record: Recordable) {
  console.log(record)
}

function handleSuccess() {
  reload()
}
</script>
