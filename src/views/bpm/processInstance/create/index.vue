<script lang="ts" setup>
import { Card, Steps } from 'ant-design-vue'
import { ref } from 'vue'
import { columns } from './create.data'
import { useGo } from '@/hooks/web/usePage'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'
import { PageWrapper } from '@/components/Page'
import { IconEnum } from '@/enums/appEnum'
import Icon from '@/components/Icon'
import { BasicTable, TableAction, useTable } from '@/components/Table'
import { getProcessDefinitionBpmnXML, getProcessDefinitionList } from '@/api/bpm/definition'
import { createProcessInstance } from '@/api/bpm/processInstance'

defineOptions({ name: 'BpmProcessInstanceCreate' })

const go = useGo()
const { t } = useI18n()
const { createMessage } = useMessage()
const current = ref(0)

const bpmnXML = ref(null) // BPMN 数据
const selectProcessInstance = ref() // 选择的流程实例

const [registerTable] = useTable({
  api: getProcessDefinitionList,
  columns,
  actionColumn: {
    width: 140,
    title: t('common.action'),
    dataIndex: 'action',
    fixed: 'right',
  },
})

/** 处理选择流程的按钮操作 */
async function handleSelect(row) {
  // 设置选择的流程
  selectProcessInstance.value = row

  // 情况一：流程表单
  if (row.formType === 10) {
    // 设置表单
    // setConfAndFields2(detailForm, row.formConf, row.formFields)
    // 加载流程图
    bpmnXML.value = await getProcessDefinitionBpmnXML(row.id)
    // 情况二：业务表单
  }
  else if (row.formCustomCreatePath) {
    await go({
      path: row.formCustomCreatePath,
    })
    // 这里暂时无需加载流程图，因为跳出到另外个 Tab；
  }
}

/** 提交按钮 */
async function submitForm(formData) {
  // if (!fApi.value || !selectProcessInstance.value)
  //   return

  // // 提交请求
  // fApi.value.btn.loading(true)
  try {
    await createProcessInstance({
      processDefinitionId: selectProcessInstance.value.id,
      variables: formData,
    })
    // 提示
    createMessage.success('发起流程成功')
    go()
  }
  finally {
    // fApi.value.btn.loading(false)
  }
}
</script>

<template>
  <PageWrapper>
    <div class="mx-auto my-0 mt-2.5 w-200">
      <Steps :current="current">
        <Steps.Step title="选择流程" />
        <Steps.Step title="流程提交" />
      </Steps>
    </div>
    <div class="m-5">
      <BasicTable v-if="!selectProcessInstance" @register="registerTable">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <TableAction
              :actions="[
                { icon: IconEnum.SEND, label: '选择', onClick: handleSelect.bind(null, record) },
              ]"
            />
          </template>
        </template>
      </BasicTable>
      <div v-if="selectProcessInstance">
        <Card :title="`申请信息——【${selectProcessInstance.name}】`">
          <template #extra>
            <a-button type="primary" @click="selectProcessInstance = undefined">
              <Icon icon="ep:delete" /> 选择其它流程
            </a-button>
          </template>
          <p>表单</p>
          <a-button type="primary" @click="submitForm">
            提交
          </a-button>
          <p>流程图</p>
        </Card>
      </div>
    </div>
  </PageWrapper>
</template>
