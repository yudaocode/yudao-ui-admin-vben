<script lang="ts" setup>
import { ref } from 'vue'
import { descSchema } from './jobLog.data'
import { Description, useDescription } from '@/components/Description'
import { BasicModal, useModalInner } from '@/components/Modal'
import { getJobLog } from '@/api/infra/jobLog'

defineOptions({ name: 'InfraJobLogModal' })

const datas = ref()

const [registerDesc] = useDescription({
  schema: descSchema,
  data: datas,
})

const [registerModal, { setModalProps }] = useModalInner(async (data) => {
  setModalProps({ confirmLoading: false })
  const res = await getJobLog(data.record.id)
  datas.value = res
})
</script>

<template>
  <BasicModal v-bind="$attrs" title="查看详情" @register="registerModal">
    <Description :column="2" @register="registerDesc" />
  </BasicModal>
</template>
