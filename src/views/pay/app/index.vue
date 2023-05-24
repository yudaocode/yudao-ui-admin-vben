<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" v-auth="['pay:app:create']" :preIcon="IconEnum.ADD" @click="handleCreate">
          {{ t('action.create') }}
        </a-button>
        <a-button type="warning" v-auth="['pay:app:export']" :preIcon="IconEnum.EXPORT" @click="handleExport">
          {{ t('action.export') }}
        </a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === PayChannelEnum.ALIPAY_APP.code">
          <a-button
            type="primary"
            shape="circle"
            v-if="record.channelCodes.indexOf(PayChannelEnum.ALIPAY_APP.code) !== -1"
            @click="openChannel(record, PayChannelEnum.ALIPAY_APP.code, PayType.ALIPAY, true)"
          >
            <Icon icon="ant-design:check-outlined" />
          </a-button>
          <a-button
            v-else
            type="primary"
            shape="circle"
            danger
            @click="openChannel(record, PayChannelEnum.ALIPAY_APP.code, PayType.ALIPAY, false)"
          >
            <Icon icon="ant-design:close-outlined" />
          </a-button>
        </template>
        <template v-if="column.key === PayChannelEnum.ALIPAY_PC.code">
          <a-button
            type="primary"
            shape="circle"
            v-if="record.channelCodes.indexOf(PayChannelEnum.ALIPAY_PC.code) !== -1"
            @click="openChannel(record, PayChannelEnum.ALIPAY_PC.code, PayType.ALIPAY, true)"
          >
            <Icon icon="ant-design:check-outlined" />
          </a-button>
          <a-button
            v-else
            type="primary"
            shape="circle"
            danger
            @click="openChannel(record, PayChannelEnum.ALIPAY_PC.code, PayType.ALIPAY, false)"
          >
            <Icon icon="ant-design:close-outlined" />
          </a-button>
        </template>
        <template v-if="column.key === PayChannelEnum.ALIPAY_WAP.code">
          <a-button
            type="primary"
            shape="circle"
            v-if="record.channelCodes.indexOf(PayChannelEnum.ALIPAY_WAP.code) !== -1"
            @click="openChannel(record, PayChannelEnum.ALIPAY_WAP.code, PayType.ALIPAY, true)"
          >
            <Icon icon="ant-design:check-outlined" />
          </a-button>
          <a-button
            v-else
            type="primary"
            shape="circle"
            danger
            @click="openChannel(record, PayChannelEnum.ALIPAY_WAP.code, PayType.ALIPAY, false)"
          >
            <Icon icon="ant-design:close-outlined" />
          </a-button>
        </template>
        <template v-if="column.key === PayChannelEnum.ALIPAY_QR.code">
          <a-button
            type="primary"
            shape="circle"
            v-if="record.channelCodes.indexOf(PayChannelEnum.ALIPAY_QR.code) !== -1"
            @click="openChannel(record, PayChannelEnum.ALIPAY_QR.code, PayType.ALIPAY, true)"
          >
            <Icon icon="ant-design:check-outlined" />
          </a-button>
          <a-button
            v-else
            type="primary"
            shape="circle"
            danger
            @click="openChannel(record, PayChannelEnum.ALIPAY_QR.code, PayType.ALIPAY, false)"
          >
            <Icon icon="ant-design:close-outlined" />
          </a-button>
        </template>
        <template v-if="column.key === PayChannelEnum.ALIPAY_BAR.code">
          <a-button
            type="primary"
            shape="circle"
            v-if="record.channelCodes.indexOf(PayChannelEnum.ALIPAY_BAR.code) !== -1"
            @click="openChannel(record, PayChannelEnum.ALIPAY_BAR.code, PayType.ALIPAY, true)"
          >
            <Icon icon="ant-design:check-outlined" />
          </a-button>
          <a-button
            v-else
            type="primary"
            shape="circle"
            danger
            @click="openChannel(record, PayChannelEnum.ALIPAY_BAR.code, PayType.ALIPAY, false)"
          >
            <Icon icon="ant-design:close-outlined" />
          </a-button>
        </template>
        <template v-if="column.key === PayChannelEnum.WX_LITE.code">
          <a-button
            type="primary"
            shape="circle"
            v-if="record.channelCodes.indexOf(PayChannelEnum.WX_LITE.code) !== -1"
            @click="openChannel(record, PayChannelEnum.WX_LITE.code, PayType.WECHAT, true)"
          >
            <Icon icon="ant-design:check-outlined" />
          </a-button>
          <a-button
            v-else
            type="primary"
            shape="circle"
            danger
            @click="openChannel(record, PayChannelEnum.WX_LITE.code, PayType.WECHAT, false)"
          >
            <Icon icon="ant-design:close-outlined" />
          </a-button>
        </template>
        <template v-if="column.key === PayChannelEnum.WX_PUB.code">
          <a-button
            type="primary"
            shape="circle"
            v-if="record.channelCodes.indexOf(PayChannelEnum.WX_PUB.code) !== -1"
            @click="openChannel(record, PayChannelEnum.WX_PUB.code, PayType.WECHAT, true)"
          >
            <Icon icon="ant-design:check-outlined" />
          </a-button>
          <a-button
            v-else
            type="primary"
            shape="circle"
            danger
            @click="openChannel(record, PayChannelEnum.WX_PUB.code, PayType.WECHAT, false)"
          >
            <Icon icon="ant-design:close-outlined" />
          </a-button>
        </template>
        <template v-if="column.key === PayChannelEnum.WX_APP.code">
          <a-button
            type="primary"
            shape="circle"
            v-if="record.channelCodes.indexOf(PayChannelEnum.WX_APP.code) !== -1"
            @click="openChannel(record, PayChannelEnum.WX_APP.code, PayType.WECHAT, true)"
          >
            <Icon icon="ant-design:check-outlined" />
          </a-button>
          <a-button
            v-else
            type="primary"
            shape="circle"
            danger
            @click="openChannel(record, PayChannelEnum.WX_APP.code, PayType.WECHAT, false)"
          >
            <Icon icon="ant-design:close-outlined" />
          </a-button>
        </template>
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              { icon: IconEnum.EDIT, label: t('action.edit'), auth: 'pay:app:update', onClick: handleEdit.bind(null, record) },
              {
                icon: IconEnum.DELETE,
                color: 'error',
                label: t('action.delete'),
                auth: 'pay:app:delete',
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
    <AppModal @register="registerModal" @success="reload()" />
    <ChannelModal @register="registerChannelModal" @success="reload()" />
  </div>
</template>
<script lang="ts" setup>
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { useModal } from '@/components/Modal'
import AppModal from './AppModal.vue'
import ChannelModal from './ChannelModal.vue'
import { PayChannelEnum, PayType } from '@/enums/systemEnum'
import { IconEnum } from '@/enums/appEnum'
import { Icon } from '@/components/Icon'
import { BasicTable, useTable, TableAction } from '@/components/Table'
import { AppExportReqVO, deleteApp, getAppPage, exportApp } from '@/api/pay/app'
import { columns, searchFormSchema } from './app.data'

defineOptions({ name: 'PayApp' })

const { t } = useI18n()
const { createConfirm, createMessage } = useMessage()
const [registerModal, { openModal }] = useModal()
const [registerChannelModal, { openModal: openChannelModal }] = useModal()

const [registerTable, { getForm, reload }] = useTable({
  title: '应用列表',
  api: getAppPage,
  columns,
  formConfig: { labelWidth: 120, schemas: searchFormSchema },
  useSearchForm: true,
  showTableSetting: true,
  actionColumn: {
    width: 140,
    title: t('common.action'),
    dataIndex: 'action',
    fixed: 'right'
  }
})

function handleCreate() {
  openModal(true, { isUpdate: false })
}

function handleEdit(record: Recordable) {
  openModal(true, { record, isUpdate: true })
}

async function handleExport() {
  createConfirm({
    title: t('common.exportTitle'),
    iconType: 'warning',
    content: t('common.exportMessage'),
    async onOk() {
      await exportApp(getForm().getFieldsValue() as AppExportReqVO)
      createMessage.success(t('common.exportSuccessText'))
    }
  })
}

async function handleDelete(record: Recordable) {
  await deleteApp(record.id)
  createMessage.success(t('common.delSuccessText'))
  reload()
}

function openChannel(record: Recordable, payCode: string, type: string, isUpdate: boolean) {
  openChannelModal(true, { record, payCode, type, isUpdate })
}
</script>
