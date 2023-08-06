<script lang="ts" setup>
import MpUserModal from './MpUserModal.vue'
import { columns, searchFormSchema } from './mpuser.data'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { useModal } from '@/components/Modal'
import { IconEnum } from '@/enums/appEnum'
import { BasicTable, TableAction, useTable } from '@/components/Table'
import { getUserPage, syncUser } from '@/api/mp/mpuser'

defineOptions({ name: 'MpUser' })

const { t } = useI18n()
const { createConfirm, createMessage } = useMessage()
const [registerModal, { openModal }] = useModal()

const [registerTable, { getForm, reload }] = useTable({
  title: '公众号账号列表',
  api: getUserPage,
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

/** 同步按钮操作 */
async function handleSync() {
  createConfirm({
    title: t('action.sync'),
    iconType: 'warning',
    content: '是否确认同步粉丝?',
    async onOk() {
      await syncUser(getForm().getFieldsValue().accountId)
      createMessage.success('开始从微信公众号同步粉丝信息，同步需要一段时间，建议稍后再查询')
    },
  })
}

/** 修改按钮操作 */
function handleEdit(record: Recordable) {
  openModal(true, { record })
}
</script>

<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button v-auth="['mp:user:sync']" type="primary" :pre-icon="IconEnum.RESET" @click="handleSync">
          {{ t('action.sync') }}
        </a-button>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[{ icon: IconEnum.EDIT, label: t('action.edit'), auth: 'mp:user:update', onClick: handleEdit.bind(null, record) }]"
          />
        </template>
      </template>
    </BasicTable>
    <MpUserModal @register="registerModal" @success="reload()" />
  </div>
</template>
