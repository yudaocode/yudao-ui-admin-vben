<script lang="ts" setup>
import { ArrowLeftOutlined } from '@ant-design/icons-vue'
import { BasicTitle } from '@/components/Basic'
import { propTypes } from '@/utils/propTypes'

defineOptions({ name: 'BasicDrawerHeader' })

defineProps({
  isDetail: propTypes.bool,
  showDetailBack: propTypes.bool,
  title: propTypes.string,
})
const emit = defineEmits(['close'])

function handleClose() {
  emit('close')
}
</script>

<template>
  <BasicTitle v-if="!isDetail" class="h-full flex items-center">
    <slot name="title" />
    {{ !$slots.title ? title : '' }}
  </BasicTitle>

  <div v-else>
    <span class="flex-1">
      <span v-if="showDetailBack" @click="handleClose">
        <ArrowLeftOutlined class="cursor-pointer px-3" />
      </span>
      <span v-if="title">{{ title }}</span>
    </span>

    <span class="pr-12.5">
      <slot name="titleToolbar" />
    </span>
  </div>
</template>
