<template>
  <div class="flex">
    <DeptTree class="w-1/4 xl:w-1/5" @select="handleSelect" />
    <BasicTable @register="registerTable" class="w-3/4 xl:w-4/5" :searchInfo="searchInfo">
      <template #toolbar>
        <a-button type="primary" @click="handleCreate">新增账号</a-button>
        <a-button type="warning" @click="handleExport"> 导出 </a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: 'clarity:note-edit-line',
                label: '编辑',
                onClick: handleEdit.bind(null, record)
              },
              {
                icon: 'ant-design:delete-outlined',
                color: 'error',
                label: '删除',
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
    <UserModel @register="registerModal" @success="reload()" />
  </div>
</template>
<script lang="ts" setup name="User">
import { reactive } from 'vue'
import { BasicTable, useTable, TableAction } from '@/components/Table'
import { useModal } from '@/components/Modal'
import UserModel from './UserModel.vue'
import DeptTree from './DeptTree.vue'
import { columns, searchFormSchema } from './user.data'
import { UserExportReqVO, deleteUserApi, exportUserApi, getUserPageApi } from '@/api/system/user'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'

const { t } = useI18n()
const { createConfirm, createMessage } = useMessage()
const [registerModal, { openModal }] = useModal()
const searchInfo = reactive<Recordable>({})

const [registerTable, { getForm, reload }] = useTable({
  title: '账号列表',
  api: getUserPageApi,
  columns,
  formConfig: {
    labelWidth: 120,
    schemas: searchFormSchema,
    autoSubmitOnEnter: true
  },
  useSearchForm: true,
  showTableSetting: true,
  showIndexColumn: false,
  actionColumn: {
    width: 160,
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

async function handleExport() {
  createConfirm({
    title: '导出',
    iconType: 'warning',
    content: '是否要导出数据？',
    async onOk() {
      await exportUserApi(getForm().getFieldsValue() as UserExportReqVO)
      createMessage.success(t('common.exportSuccessText'))
    }
  })
}

function handleEdit(record: Recordable) {
  openModal(true, {
    record,
    isUpdate: true
  })
}

async function handleDelete(record: Recordable) {
  await deleteUserApi(record.id)
  createMessage.success('删除成功')
  reload()
}

function handleSelect(deptId = '') {
  searchInfo.deptId = deptId
  reload()
}
</script>
