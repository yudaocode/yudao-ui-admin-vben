<script lang="ts" setup>
import { computed } from 'vue'
import { columns, searchFormSchema } from './my.data'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { IconEnum } from '@/enums/appEnum'
import { BasicTable, TableAction, useTable } from '@/components/Table'
import { getMyNotifyMessagePage, updateAllNotifyMessageRead, updateNotifyMessageRead } from '@/api/system/notify/message'
import MessageInfoModal from '@/views/system/notify/components/MessageInfoModal.vue'
import { useModal } from '@/components/Modal'
import { useUserMessageStore } from '@/store/modules/userMessage'

defineOptions({ name: 'SystemMyMessage' })

const { t } = useI18n()
const { createMessage } = useMessage()
const [registerModal, { openModal }] = useModal()
const store = useUserMessageStore()

const [registerTable, { getSelectRowKeys, clearSelectedRowKeys, reload }] = useTable({
  title: '我的站内信列表',
  api: getMyNotifyMessagePage,
  columns,
  formConfig: { labelWidth: 130, schemas: searchFormSchema },
  rowSelection: {
    type: 'checkbox',
    getCheckboxProps: (record: Recordable) => {
      return {
        // 已读的消息disabled 不可选
        disabled: record.readStatus,
      }
    },
  },
  rowKey: 'id',
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

/**
 * 已读按钮的disabled  未选中则disabled
 */
const readedDisabled = computed<boolean>(() => {
  return getSelectRowKeys().length === 0
})

function handleUpdateList() {
  const ids = getSelectRowKeys()
  handleUpdate(ids)
}

async function handleUpdateSingle(record: Recordable) {
  await handleUpdate([record.id])
}

function afterRead(msg: string) {
  createMessage.success(msg)
  // 更新未读消息
  store.updateUnreadCount()
  // 重加载表格
  reload()
  // 清除选中的行
  clearSelectedRowKeys()
}

async function handleUpdate(ids) {
  await updateNotifyMessageRead(ids)
  afterRead('标记已读成功！')
}

async function handleUpdateAll() {
  await updateAllNotifyMessageRead()
  afterRead('全部已读成功！')
}

function handleInfo(record: any) {
  openModal(true, record)
}
</script>

<template>
  <div>
    <BasicTable bordered @register="registerTable">
      <template #toolbar>
        <a-button pre-icon="solar:check-read-line-duotone" type="primary" :disabled="readedDisabled" @click="handleUpdateList">
          标记已读
        </a-button>
        <a-button pre-icon="solar:check-read-linear" type="primary" @click="handleUpdateAll">
          全部已读
        </a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <!-- 阻止事件冒泡 勾选框 -->
          <TableAction
            stop-button-propagation
            :actions="[
              {
                icon: IconEnum.EDIT,
                label: '已读',
                color: 'warning',
                ifShow: () => {
                  return !record.readStatus
                },
                onClick: handleUpdateSingle.bind(null, record),
              },
              {
                icon: IconEnum.LOG,
                label: '详情',
                onClick: handleInfo.bind(null, record),
              },
            ]"
          />
        </template>
      </template>
    </BasicTable>
    <MessageInfoModal @register="registerModal" />
  </div>
</template>
