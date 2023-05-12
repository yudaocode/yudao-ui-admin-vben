<template>
  <BasicModal @register="registerModal" title="Cron表达式" width="800px" @ok="onOk">
    <CronTab v-bind="attrs" />
  </BasicModal>
</template>

<script lang="ts" setup>
import { useAttrs } from '@/hooks/core/useAttrs'
import { BasicModal, useModalInner } from '@/components/Modal'
import CronTab from './CronTabInner.vue'

defineOptions({ name: 'CronTabModal', inheritAttrs: false })

const attrs = useAttrs()
const [registerModal, { closeModal }] = useModalInner()

function onOk() {
  closeModal()
}
</script>
