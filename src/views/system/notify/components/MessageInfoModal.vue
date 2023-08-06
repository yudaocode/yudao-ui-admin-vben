<script lang="ts" setup>
import { ref } from 'vue'
import type { MessageInfo } from './message.data'
import { infoSchema } from './message.data'
import { BasicModal, useModalInner } from '@/components/Modal'
import { Description, useDescription } from '@/components/Description/index'

defineOptions({ name: 'MessageInfoModal' })

const data = ref<MessageInfo>()

const [innerRegister] = useModalInner((value: MessageInfo) => {
  data.value = value
})

const [descriptionRegister] = useDescription({
  column: 1,
  schema: infoSchema,
  data,
})
</script>

<template>
  <BasicModal title="站内信详情" @register="innerRegister">
    <Description @register="descriptionRegister" />
  </BasicModal>
</template>
