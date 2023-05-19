<template>
  <BasicModal title="站内信详情" @register="innerRegister">
    <Description @register="descriptionRegister" />
  </BasicModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { BasicModal, useModalInner } from '@/components/Modal'
import { Description, useDescription } from '@/components/Description/index'
import { infoSchema, MessageInfo } from './message.data'

defineOptions({ name: 'MessageInfoModal' })

const [innerRegister] = useModalInner((value: MessageInfo) => {
  data.value = value
})

const data = ref<MessageInfo>()
const [descriptionRegister] = useDescription({
  column: 1,
  schema: infoSchema,
  data
})
</script>

<style scoped></style>
