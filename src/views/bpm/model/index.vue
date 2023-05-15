<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <a-button type="primary" v-auth="['bpm:model:create']" :preIcon="IconEnum.ADD" @click="handleCreate">
          {{ t('action.create') }}
        </a-button>
        <BasicUpload
          :maxSize="20"
          :maxNumber="1"
          :emptyHidePreview="true"
          @change="reload"
          :uploadParams="uploadParams"
          :api="importModel"
          class="my-5"
          :accept="['.bpmn', '.xml']"
        />
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[{ icon: IconEnum.EDIT, label: t('action.edit'), auth: 'bpm:model:update', onClick: handleEdit.bind(null, record) }]"
            :dropDownActions="[
              { icon: IconEnum.EDIT, label: '设计流程', auth: 'bpm:model:update', onClick: handleDesign.bind(null, record) },
              { icon: IconEnum.EDIT, label: '分配规则', auth: 'bpm:task-assign-rule:query', onClick: handleAssignRule.bind(null, record) },
              {
                icon: IconEnum.EDIT,
                label: '发布流程',
                auth: 'bpm:model:deploy',
                popConfirm: {
                  title: t('common.delMessage'),
                  placement: 'left',
                  confirm: handleDeploy.bind(null, record)
                }
              },
              {
                icon: IconEnum.EDIT,
                label: '流程定义',
                auth: 'bpm:process-definition:query',
                onClick: handleDefinitionList.bind(null, record)
              },
              {
                icon: IconEnum.DELETE,
                color: 'error',
                label: t('action.delete'),
                auth: 'bpm:model:delete',
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
    <ModelModal @register="registerModal" @success="reload()" />
  </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue'
import { useGo } from '@/hooks/web/usePage'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { useModal } from '@/components/Modal'
import ModelModal from './ModelModal.vue'
import { IconEnum } from '@/enums/appEnum'
import { BasicUpload } from '@/components/Upload'
import { BasicTable, useTable, TableAction } from '@/components/Table'
import { deleteModel, deployModel, getModelPage, importModel } from '@/api/bpm/model'
import { columns, searchFormSchema } from './model.data'
import { getAccessToken, getTenantId } from '@/utils/auth'

defineOptions({ name: 'BpmModel' })

const go = useGo()
const { t } = useI18n()
const { createMessage } = useMessage()
const [registerModal, { openModal }] = useModal()

const uploadParams = ref({
  Authorization: 'Bearer ' + getAccessToken(),
  'tenant-id': getTenantId()
})

const [registerTable, { reload }] = useTable({
  title: '流程模型图列表',
  api: getModelPage,
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

/** 设计流程 */
function handleDesign(record: Recordable) {
  go({ name: 'BpmModelEditor', query: { modelId: record.id } })
}

/** 点击任务分配按钮 */
function handleAssignRule(record: Recordable) {
  go({ name: 'BpmTaskAssignRuleList', query: { modelId: record.id } })
}

/** 发布流程 */
async function handleDeploy(record: Recordable) {
  await deployModel(record.id)
  createMessage.success(t('common.successText'))
  reload()
}

/** 跳转到指定流程定义列表 */
function handleDefinitionList(record: Recordable) {
  go({ name: 'BpmProcessDefinition', query: { modelId: record.key } })
}

async function handleDelete(record: Recordable) {
  await deleteModel(record.id)
  createMessage.success(t('common.delSuccessText'))
  reload()
}
</script>
