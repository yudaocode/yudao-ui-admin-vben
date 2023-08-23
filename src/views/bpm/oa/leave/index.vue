<script lang="ts" setup>
import { columns, searchFormSchema } from './leave.data'
import { useI18n } from '@/hooks/web/useI18n'
import { IconEnum } from '@/enums/appEnum'
import { BasicTable, TableAction, useTable } from '@/components/Table'
import { getLeavePage } from '@/api/bpm/leave'
import { useGo } from '@/hooks/web/usePage'
import { useMessage } from '@/hooks/web/useMessage'
import { cancelProcessInstance } from '@/api/bpm/processInstance'

defineOptions({ name: 'BpmLeave' })

const { t } = useI18n()
const go = useGo()
const { createMessage } = useMessage()

const [registerTable, { reload }] = useTable({
  title: '请假列表',
  api: getLeavePage,
  columns,
  formConfig: { labelWidth: 120, schemas: searchFormSchema },
  useSearchForm: true,
  showTableSetting: true,
  actionColumn: {
    width: 160,
    title: t('common.action'),
    dataIndex: 'action',
    fixed: 'right',
  },
})

/** 添加操作 */
function handleCreate() {
  go({ name: 'OALeaveCreate' })
}

/** 详情操作 */
function handleDetail(row) {
  go({
    name: 'OALeaveDetail',
    query: {
      id: row.id,
    },
  })
}

/** 取消请假操作 */
async function cancelLeave(row) {
  // // 二次确认
  // const { value } = await ElMessageBox.prompt('请输入取消原因', '取消流程', {
  //   confirmButtonText: t('common.ok'),
  //   cancelButtonText: t('common.cancel'),
  //   inputPattern: /^[\s\S]*.*\S[\s\S]*$/, // 判断非空，且非空格
  //   inputErrorMessage: '取消原因不能为空',
  // })
  const value = ''
  // 发起取消
  await cancelProcessInstance(row.id, value)
  createMessage.success(t('common.delSuccessText'))
  reload()
}

/** 审批进度 */
function handleProcessDetail(row) {
  go({
    name: 'BpmProcessInstanceDetail',
    query: {
      id: row.processInstanceId,
    },
  })
}
</script>

<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" :pre-icon="IconEnum.ADD" @click="handleCreate">
          发起请假
        </a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              { icon: IconEnum.SEARCH, label: t('action.detail'), auth: 'bpm:oa-leave:query', onClick: handleDetail.bind(null, record) },
              { icon: IconEnum.LOG, label: '进度', auth: 'bpm:oa-leave:query', onClick: handleProcessDetail.bind(null, record) },
              {
                icon: IconEnum.DELETE,
                danger: true,
                label: t('action.cancel'),
                auth: 'bpm:oa-leave:create',
                ifShow: () => {
                  return record.result === 1
                },
                onClick: cancelLeave.bind(null, record),
              },
            ]"
          />
        </template>
      </template>
    </BasicTable>
  </div>
</template>
