<script lang="ts" setup>
import { ref } from 'vue'
import { logSchema } from './mailLog.data'
import { BasicModal, useModalInner } from '@/components/Modal'
import { Description, useDescription } from '@/components/Description/index'

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
    width: '100px',
  },
})
</script>

<template>
  <BasicModal v-bind="$attrs" title="发送邮件详情" width="800px" @register="registerModalInner" @ok="closeModal">
    <Description @register="registerDescription" />
  </BasicModal>
</template>
