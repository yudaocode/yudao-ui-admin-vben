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
                label: '测试',
                onClick: handleSendSms.bind(null, record)
              },
              {
                icon: 'clarity:note-edit-line',
                label: '修改',
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
    <SmsTemplateModel @register="registerModal" @success="reload()" />
  </div>
</template>
<script lang="ts" setup name="SmsTemplate">
import { BasicTable, useTable, TableAction } from '@/components/Table'
import { SmsTemplateExportReqVO, deleteSmsTemplateApi, exportSmsTemplateApi, getSmsTemplatePageApi } from '@/api/system/sms/smsTemplate'
import { useModal } from '@/components/Modal'
import SmsTemplateModel from './SmsTemplateModel.vue'
import { columns, searchFormSchema } from './smsTemplate.data'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'

const { t } = useI18n()
const { createConfirm, createMessage } = useMessage()
const [registerModal, { openModal }] = useModal()
const [registerTable, { getForm, reload }] = useTable({
  title: '短信模版列表',
  api: getSmsTemplatePageApi,
  columns,
  formConfig: {
    labelWidth: 120,
    schemas: searchFormSchema
  },
  useSearchForm: true,
  showTableSetting: true,
  showIndexColumn: false,
  actionColumn: {
    width: 240,
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

function handleSendSms(record: Recordable) {
  console.info(record)
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
      await exportSmsTemplateApi(getForm().getFieldsValue() as SmsTemplateExportReqVO)
      createMessage.success(t('common.exportSuccessText'))
    }
  })
}

async function handleDelete(record: Recordable) {
  await deleteSmsTemplateApi(record.id)
  createMessage.success('删除成功')
  reload()
}
</script>
