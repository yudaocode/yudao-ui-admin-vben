<script lang="ts" setup>
import { ref } from 'vue'
import { infoSchema } from './apiAccessLog.data'
import { BasicModal, useModalInner } from '@/components/Modal'
import { Description, useDescription } from '@/components/Description/index'

defineOptions({ name: 'AcessLogModal' })

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
  <BasicModal v-bind="$attrs" title="访问日志详情" width="800px" @register="registerModalInner" @ok="closeModal">
    <Description @register="registerDescription" />
  </BasicModal>
</template>
