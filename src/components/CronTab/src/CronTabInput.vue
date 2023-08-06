<script lang="ts" setup>
import { ref, watch } from 'vue'
import { Input } from 'ant-design-vue'
import CronTabModal from './CronTabModal.vue'
import { cronEmits, cronProps } from './cron.data'
import { useDesign } from '@/hooks/web/useDesign'
import { useModal } from '@/components/Modal'
import { propTypes } from '@/utils/propTypes'
import { Icon } from '@/components/Icon'

const props = defineProps({
  ...cronProps,
  placeholder: propTypes.string.def('请输入cron表达式'),
  exeStartTime: propTypes.oneOfType([propTypes.number, propTypes.string, propTypes.object]).def(0),
})
const emit = defineEmits([...cronEmits])
const { prefixCls } = useDesign('cron-input')
const [registerModal, { openModal }] = useModal()
const editCronValue = ref(props.value)

watch(
  () => props.value,
  (newVal) => {
    if (newVal !== editCronValue.value)
      editCronValue.value = newVal
  },
)
watch(editCronValue, (newVal) => {
  emit('change', newVal)
  emit('update:value', newVal)
})

function showConfigModal() {
  if (!props.disabled)
    openModal()
}
</script>

<template>
  <div :class="`${prefixCls}`">
    <Input v-model:value="editCronValue" :placeholder="placeholder" :disabled="disabled">
      <template #addonAfter>
        <a class="open-btn" :disabled="disabled ? 'disabled' : null" @click="showConfigModal">
          <Icon icon="ant-design:setting-outlined" />
          <span>选择</span>
        </a>
      </template>
    </Input>
    <CronTabModal
      v-model:value="editCronValue"
      :exe-start-time="exeStartTime"
      :hide-year="hideYear"
      :remote="remote"
      :hide-second="hideSecond"
      @register="registerModal"
    />
  </div>
</template>

<style lang="less">
@prefix-cls: ~'@{namespace}-cron-input';

.@{prefix-cls} {
  a.open-btn {
    cursor: pointer;

    .app-iconify {
      position: relative;
      top: 1px;
      right: 2px;
    }
  }
}
</style>
