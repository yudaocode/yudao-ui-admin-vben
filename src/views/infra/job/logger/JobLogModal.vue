<template>
  <BasicModal v-bind="$attrs" @register="registerModal" title="查看详情">
    <Description :column="2" @register="registerDesc" />
  </BasicModal>
</template>
<script lang="ts" setup name="InfraJobLogModal">
import { Description, useDescription } from '@/components/Description'
import { BasicModal, useModalInner } from '@/components/Modal'
import { descSchema } from './jobLog.data'
import { getJobLog } from '@/api/infra/jobLog'
import { ref } from 'vue'

const datas = ref()

const [registerDesc] = useDescription({
  schema: descSchema,
  data: datas
})

const [registerModal, { setModalProps }] = useModalInner(async (data) => {
  setModalProps({ confirmLoading: false })
  const res = await getJobLog(data.record.id)
  datas.value = res
})
</script>
