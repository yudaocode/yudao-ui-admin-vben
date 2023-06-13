<template>
  <BasicModal v-bind="$attrs" title="访问日志详情" @register="registerModalInner" @ok="closeModal" width="800px">
    <Description @register="registerDescription" />
  </BasicModal>
</template>

<script setup lang="ts">
import { BasicModal, useModalInner } from '@/components/Modal'
import { Description, useDescription } from '@/components/Description/index'
import { ref } from 'vue'
import { infoSchema } from './apiAccessLog.data'

defineOptions({ name: 'AcessLogModal' })

const logData = ref()
const [registerModalInner, { closeModal }] = useModalInner((record: Recordable) => {
  logData.value = record
})

const [registerDescription] = useDescription({
  column: 1,
  schema: infoSchema,
  data: logData
})
</script>

<style scoped></style>
