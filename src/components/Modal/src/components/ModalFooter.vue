<script lang="ts" setup>
import { basicProps } from '../props'

defineOptions({ name: 'BasicModalFooter' })

defineProps(basicProps)

const emit = defineEmits(['ok', 'cancel'])

function handleOk(e: Event) {
  emit('ok', e)
}

function handleCancel(e: Event) {
  emit('cancel', e)
}
</script>

<template>
  <div>
    <slot name="insertFooter" />
    <a-button v-if="showCancelBtn" v-bind="cancelButtonProps" @click="handleCancel">
      {{ cancelText }}
    </a-button>
    <slot name="centerFooter" />
    <a-button v-if="showOkBtn" :type="okType" :loading="confirmLoading" v-bind="okButtonProps" @click="handleOk">
      {{ okText }}
    </a-button>
    <slot name="appendFooter" />
  </div>
</template>
