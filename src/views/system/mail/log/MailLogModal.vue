<template>
  <BasicModal v-bind="$attrs" title="发送邮件详情" @register="registerModalInner" @ok="closeModal" width="800px">
    <Description @register="registerDescription" />
  </BasicModal>
</template>

<script setup lang="ts">
import { BasicModal, useModalInner } from '@/components/Modal'
import { Description, useDescription } from '@/components/Description/index'
import { ref } from 'vue'
import { logSchema } from './mailLog.data'

defineOptions({ name: 'MailLogModal' })

const logData = ref()
const [registerModalInner, { closeModal }] = useModalInner((record: Recordable) => {
  logData.value = record
})

const [registerDescription] = useDescription({
  column: 1,
  schema: logSchema,
  data: logData,
  labelStyle: {
    width: '100px'
  }
})
</script>

<style scoped></style>
