<script lang="ts" setup>
import CronTab from './CronTabInner.vue'
import { BasicModal, useModalInner } from '@/components/Modal'

defineOptions({ name: 'CronTabModal', inheritAttrs: false })

const [registerModal, { closeModal }] = useModalInner()

function onOk() {
  closeModal()
}
</script>

<template>
  <BasicModal title="Cron表达式" width="800px" @register="registerModal" @ok="onOk">
    <CronTab v-bind="$attrs" />
  </BasicModal>
</template>
