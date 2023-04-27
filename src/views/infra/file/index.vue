<template>
  <div>
    <BasicTable @register="registerTable">
      <template #toolbar>
        <BasicUpload
          :maxSize="20"
          :maxNumber="10"
          @change="handleChange"
          :uploadParams="uploadParams"
          :api="uploadApi"
          class="my-5"
          :accept="['image/*']"
        />
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <TableAction
            :actions="[
              {
                icon: IconEnum.DELETE,
                color: 'error',
                label: t('action.delete'),
                auth: 'infra:file:delete',
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
  </div>
</template>
<script lang="ts" setup name="InfraFile">
import { ref } from 'vue'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { IconEnum } from '@/enums/appEnum'
import { BasicUpload } from '@/components/Upload'
import { BasicTable, useTable, TableAction } from '@/components/Table'
import { deleteFile, getFilePage } from '@/api/infra/file'
import { columns, searchFormSchema } from './file.data'
import { getAccessToken, getTenantId } from '@/utils/auth'
import { uploadApi } from '@/api/base/upload'

const { t } = useI18n()
const { createMessage } = useMessage()

const uploadParams = ref({
  Authorization: 'Bearer ' + getAccessToken(),
  'tenant-id': getTenantId()
})

const [registerTable, { reload }] = useTable({
  title: '文件列表',
  api: getFilePage,
  columns,
  formConfig: { labelWidth: 120, schemas: searchFormSchema },
  useSearchForm: true,
  showTableSetting: true,
  showIndexColumn: false,
  actionColumn: {
    width: 140,
    title: t('common.action'),
    dataIndex: 'action',
    fixed: 'right'
  }
})

function handleChange() {
  reload()
}

async function handleDelete(record: Recordable) {
  await deleteFile(record.id)
  createMessage.success(t('common.delSuccessText'))
  reload()
}
</script>
