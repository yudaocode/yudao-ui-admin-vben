<script lang="ts" setup>
import { ref } from 'vue'
import { infoSchema } from './operateLog.data'
import { BasicModal, useModalInner } from '@/components/Modal'
import { Description, useDescription } from '@/components/Description/index'

defineOptions({ name: 'OperLogInfoModal' })

const logData = ref()
const [registerModalInner, { closeModal }] = useModalInner((record: Recordable) => {
  logData.value = record
})

const [registerDescription] = useDescription({
  column: 1,
  schema: infoSchema,
  data: logData,
})
</script>

<template>
  <BasicModal v-bind="$attrs" title="操作日志详情" width="800px" @register="registerModalInner" @ok="closeModal">
    <Description @register="registerDescription" />
  </BasicModal>
</template>
