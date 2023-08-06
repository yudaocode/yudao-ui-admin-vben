<script lang="ts" setup>
import { computed, ref, unref, watch, watchEffect } from 'vue'
import { InputPassword } from 'ant-design-vue'
import { zxcvbn } from '@zxcvbn-ts/core'
import { useDesign } from '@/hooks/web/useDesign'
import { propTypes } from '@/utils/propTypes'

defineOptions({ name: 'StrengthMeter' })

const props = defineProps({
  value: propTypes.string,
  showInput: propTypes.bool.def(true),
  disabled: propTypes.bool,
})
const emit = defineEmits(['score-change', 'change'])

const innerValueRef = ref('')
const { prefixCls } = useDesign('strength-meter')

const getPasswordStrength = computed(() => {
  const { disabled } = props
  if (disabled)
    return -1
  const innerValue = unref(innerValueRef)
  const score = innerValue ? zxcvbn(unref(innerValueRef)).score : -1
  emit('score-change', score)
  return score
})

function handleChange(e: ChangeEvent) {
  innerValueRef.value = e.target.value
}

watchEffect(() => {
  innerValueRef.value = props.value || ''
})

watch(
  () => unref(innerValueRef),
  (val) => {
    emit('change', val)
  },
)
</script>

<template>
  <div :class="prefixCls" class="relative">
    <InputPassword v-if="showInput" v-bind="$attrs" allow-clear :value="innerValueRef" :disabled="disabled" @change="handleChange">
      <template v-for="item in Object.keys($slots)" #[item]="data">
        <slot :name="item" v-bind="data || {}" />
      </template>
    </InputPassword>
    <div :class="`${prefixCls}-bar`">
      <div :class="`${prefixCls}-bar--fill`" :data-score="getPasswordStrength" />
    </div>
  </div>
</template>

<style lang="less" scoped>
@prefix-cls: ~'@{namespace}-strength-meter';

.@{prefix-cls} {
  &-bar {
    position: relative;
    height: 6px;
    margin: 10px auto 6px;
    background-color: @disabled-color;
    border-radius: 6px;

    &::before,
    &::after {
      position: absolute;
      z-index: 10;
      display: block;
      width: 20%;
      height: inherit;
      content: '';
      background-color: transparent;
      border-color: @white;
      border-style: solid;
      border-width: 0 5px;
    }

    &::before {
      left: 20%;
    }

    &::after {
      right: 20%;
    }

    &--fill {
      position: absolute;
      width: 0;
      height: inherit;
      background-color: transparent;
      border-radius: inherit;
      transition:
        width 0.5s ease-in-out,
        background 0.25s;
    }
  }
}
</style>
