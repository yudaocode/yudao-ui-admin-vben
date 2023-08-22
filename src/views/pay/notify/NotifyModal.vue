<script lang="ts" setup>
import { ref } from 'vue'
import { Divider } from 'ant-design-vue'
import { descColumns, descSchema } from './notify.data'
import { BasicModal, useModalInner } from '@/components/Modal'
import { Description } from '@/components/Description'
import { BasicTable } from '@/components/Table'
import { getNotifyTaskDetail } from '@/api/pay/notify'

defineOptions({ name: 'PayNotifyDetail' })

const notifyData = ref<any>()

const notifyLogs = ref<any[]>([])

const [registerModal, { setModalProps }] = useModalInner(async (data) => {
  const res = await getNotifyTaskDetail(data.record.id)
  notifyData.value = res
  if (res.logs)
    notifyLogs.value = res.logs
  setModalProps({ confirmLoading: false })
})
</script>

<template>
  <BasicModal v-bind="$attrs" width="60%" title="通知详情" :show-ok-btn="false" @register="registerModal">
    <Description :bordered="false" :column="3" :data="notifyData" :schema="descSchema" />
    <Divider />
    <BasicTable
      title="回调日志" :columns="descColumns" :data-source="notifyLogs" :bordered="true" :pagination="false"
      :can-resize="true" :max-height="400"
    />
  </BasicModal>
</template>
