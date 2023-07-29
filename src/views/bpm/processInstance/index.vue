<script lang="ts" setup>
import { columns, searchFormSchema } from './processInstance.data'
import { useGo } from '@/hooks/web/usePage'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { BasicTable, TableAction, useTable } from '@/components/Table'
import { IconEnum } from '@/enums/appEnum'
import { cancelProcessInstance, getMyProcessInstancePage } from '@/api/bpm/processInstance'

defineOptions({ name: 'InfraApiErrorLog' })

const go = useGo()
const { t } = useI18n()
const { createMessage } = useMessage()
const [registerTable, { reload }] = useTable({
  title: '我的流程列表',
  api: getMyProcessInstancePage,
  columns,
  formConfig: { labelWidth: 120, schemas: searchFormSchema },
  useSearchForm: true,
  showTableSetting: true,
  actionColumn: {
    width: 140,
    title: t('common.action'),
    dataIndex: 'action',
    fixed: 'right',
  },
})

/** 发起流程操作 */
function handleCreate() {
  go({ name: 'BpmProcessInstanceCreate' })
}

/** 查看详情 */
function handleDetail(record: Recordable) {
  go({ name: 'BpmProcessInstanceDetail', query: { id: record.id } })
}

/** 取消按钮操作 */
async function handleCancel(record: Recordable) {
  await cancelProcessInstance(record.id, 'TODO')
  createMessage.success('取消成功')
  reload()
}
</script>

<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button v-auth="['bpm:process-instance:query']" type="warning" :pre-icon="IconEnum.ADD" @click="handleCreate">
          发起流程
        </a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: IconEnum.VIEW,
                label: t('action.detail'),
                auth: 'bpm:process-instance:query',
                onClick: handleDetail.bind(null, record),
              },
              {
                icon: IconEnum.DELETE,
                color: 'error',
                label: t('action.cancel'),
                ifShow: record.result === 1,
                auth: 'bpm:process-instance:cancel',
                popConfirm: {
                  title: t('action.cancel'),
                  placement: 'left',
                  confirm: handleCancel.bind(null, record),
                },
              },
            ]"
          />
        </template>
      </template>
    </BasicTable>
  </div>
</template>
