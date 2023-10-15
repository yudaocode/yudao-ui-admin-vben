<script lang="ts" setup>
import type { CSSProperties } from 'vue'
import { computed } from 'vue'
import { footerProps } from '../props'

defineOptions({ name: 'BasicDrawerFooter' })

const props = defineProps({
  ...footerProps,
  height: {
    type: String,
    default: '60px',
  },
})
const emit = defineEmits(['ok', 'close'])

const getStyle = computed((): CSSProperties => {
  const heightStr = `${props.height}`
  return {
    height: heightStr,
    lineHeight: `calc(${heightStr} - 1px)`,
  }
})

function handleOk() {
  emit('ok')
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <div
    v-if="showFooter || $slots.footer"
    class="absolute bottom-0 left-0 w-full border-t-1 border-light-200 bg-white pl-5 pr-3 dark:bg-dark"
    :style="getStyle"
  >
    <template v-if="!$slots.footer">
      <slot name="insertFooter" />
      <a-button v-if="showCancelBtn" v-bind="cancelButtonProps" class="mr-2" @click="handleClose">
        {{ cancelText }}
      </a-button>
      <slot name="centerFooter" />
      <a-button
        v-if="showOkBtn" :type="okType" v-bind="okButtonProps" class="mr-2" :loading="confirmLoading"
        @click="handleOk"
      >
        {{ okText }}
      </a-button>
      <slot name="appendFooter" />
    </template>

    <template v-else>
      <slot name="footer" />
    </template>
  </div>
</template>
