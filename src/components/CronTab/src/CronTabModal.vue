<script lang="ts" setup>
import CronTab from './CronTabInner.vue'
import { useAttrs } from '@/hooks/core/useAttrs'
import { BasicModal, useModalInner } from '@/components/Modal'

defineOptions({ name: 'CronTabModal', inheritAttrs: false })

const attrs = useAttrs()
const [registerModal, { closeModal }] = useModalInner()

function onOk() {
  closeModal()
}
</script>

<template>
  <BasicModal title="Cron表达式" width="800px" @register="registerModal" @ok="onOk">
    <CronTab v-bind="attrs" />
  </BasicModal>
</template>
