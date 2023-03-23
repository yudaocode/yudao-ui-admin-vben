<template>
  <BasicModal v-bind="$attrs" :width="800" @register="registerModal" title="导入" @ok="handleSubmit">
    <BasicTable @register="registerTable" />
  </BasicModal>
</template>
<script lang="ts" setup name="ImportTableModal">
import { BasicModal, useModalInner } from '@/components/Modal'
import { BasicTable, useTable } from '@/components/Table'
import { importTableColumns, importTableSearchFormSchema } from '../codegen.data'
import { createCodegenList, getSchemaTableList } from '@/api/infra/codegen'

const emit = defineEmits(['success', 'register'])

const [registerTable, { getSelectRowKeys }] = useTable({
  api: getSchemaTableList,
  columns: importTableColumns,
  formConfig: {
    labelWidth: 80,
    schemas: importTableSearchFormSchema
  },
  rowSelection: { type: 'checkbox' },
  rowKey: 'name',
  useSearchForm: true,
  pagination: false,
  showTableSetting: false,
  showIndexColumn: false
})

const [registerModal, { setModalProps, closeModal }] = useModalInner(async () => {
  setModalProps({ confirmLoading: false })
})

async function handleSubmit() {
  const datas = await getSelectRowKeys()
  console.info(datas)
  await createCodegenList({ dataSourceConfigId: 0, tableNames: datas })
  closeModal()
  emit('success')
}
</script>
