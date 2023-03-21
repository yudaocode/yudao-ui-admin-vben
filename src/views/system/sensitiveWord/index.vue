<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" @click="handleCreate"> 新增 </a-button>
        <a-button type="warning" @click="handleExport"> 导出 </a-button>
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
    <SensitiveWordModel @register="registerModal" @success="reload()" />
  </div>
</template>
<script lang="ts" setup name="SensitiveWord">
import { BasicTable, useTable, TableAction } from '@/components/Table'
import {
  SensitiveWordExportReqVO,
  deleteSensitiveWordApi,
  exportSensitiveWordApi,
  getSensitiveWordPageApi
} from '@/api/system/sensitiveWord'
import { useModal } from '@/components/Modal'
import SensitiveWordModel from './SensitiveWordModel.vue'
import { columns, searchFormSchema } from './sensitiveWord.data'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'

const { t } = useI18n()
const { createConfirm, createMessage } = useMessage()
const [registerModal, { openModal }] = useModal()
const [registerTable, { getForm, reload }] = useTable({
  title: '敏感词列表',
  api: getSensitiveWordPageApi,
  columns,
  formConfig: {
    labelWidth: 120,
    schemas: searchFormSchema
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
  openModal(true, {
    record,
    isUpdate: true
  })
}

async function handleExport() {
  createConfirm({
    title: '导出',
    iconType: 'warning',
    content: '是否要导出数据？',
    async onOk() {
      await exportSensitiveWordApi(getForm().getFieldsValue() as SensitiveWordExportReqVO)
      createMessage.success(t('common.exportSuccessText'))
    }
  })
}

async function handleDelete(record: Recordable) {
  createConfirm({
    title: '删除',
    iconType: 'warning',
    content: '是否要删除数据？',
    async onOk() {
      await deleteSensitiveWordApi(record.id)
      createMessage.success('删除成功')
      reload()
    }
  })
}
</script>
