<script lang="ts" setup>
import { Button, theme } from 'ant-design-vue'
import type { ComponentOptionsMixin } from 'vue'
import { computed, unref } from 'vue'
import { buttonProps } from './props'
import { useAttrs } from '@/hooks/core/useAttrs'
import { Icon } from '@/components/Icon'

defineOptions({ name: 'AButton', extends: Button as ComponentOptionsMixin, indeterminate: false })
const props = defineProps(buttonProps)
const { useToken } = theme
const { token } = useToken()
// get component class
const attrs = useAttrs({ excludeDefaultKeys: false })
const getButtonClass = computed(() => {
  const { disabled } = props
  return [
    {
      'is-disabled': disabled,
    },
  ]
})

// get inherit binding value
const getBindValue = computed(() => ({ ...unref(attrs), ...props }))
</script>

<template>
  <Button
    v-bind="getBindValue" :style="{
      backgroundColor: color
        ? (
          color === 'primary'
            ? token.colorPrimary
            : (
              color === 'error'
                ? token.colorError
                : (
                  color === 'warning'
                    ? token.colorWarning
                    : (color === 'success' ? token.colorSuccess : '')
                )
            )
        )
        : '',
    }" :class="getButtonClass" @click="onClick"
  >
    <template #icon>
      <slot name="icon" />
    </template>
    <template #default="data">
      <Icon v-if="preIcon" :icon="preIcon" :size="iconSize" />
      <slot v-bind="data || {}" />
      <Icon v-if="postIcon" :icon="postIcon" :size="iconSize" />
    </template>
  </Button>
</template>
