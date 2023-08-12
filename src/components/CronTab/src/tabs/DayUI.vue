<script lang="ts">
import { computed, defineComponent, watch } from 'vue'
import { Checkbox, Input, Radio } from 'ant-design-vue'
import { TypeEnum, useTabEmits, useTabProps, useTabSetup } from './useTabMixin'

export default defineComponent({
  name: 'DayUI',
  components: { AInput: Input, Checkbox, CheckboxGroup: Checkbox.Group, Radio, RadioGroup: Radio.Group },
  props: useTabProps({
    defaultValue: '*',
    props: {
      week: { type: String, default: '?' },
    },
  }),
  emits: useTabEmits(),
  setup(props, context) {
    const disabledChoice = computed(() => {
      return (props.week && props.week !== '?') || props.disabled
    })
    const setup = useTabSetup(props, context, {
      defaultValue: '*',
      valueWork: 1,
      minValue: 1,
      maxValue: 31,
      valueRange: { start: 1, end: 31 },
      valueLoop: { start: 1, interval: 1 },
      disabled: disabledChoice,
    })
    const typeWorkAttrs = computed(() => ({
      disabled: setup.type.value !== TypeEnum.work || props.disabled || disabledChoice.value,
      ...setup.inputNumberAttrs.value,
    }))

    watch(
      () => props.week,
      () => {
        setup.updateValue(disabledChoice.value ? '?' : setup.computeValue.value)
      },
    )

    return { ...setup, typeWorkAttrs }
  },
})
</script>

<template>
  <div :class="`${prefixCls}-config-list`">
    <RadioGroup v-model:value="type">
      <div class="item">
        <Radio :value="TypeEnum.unset" v-bind="beforeRadioAttrs">
          不设置
        </Radio>
        <span class="tip-info">日和周只能设置其中之一</span>
      </div>
      <div class="item">
        <Radio :value="TypeEnum.every" v-bind="beforeRadioAttrs">
          每日
        </Radio>
      </div>
      <div class="item">
        <Radio :value="TypeEnum.range" v-bind="beforeRadioAttrs">
          区间
        </Radio>
        <span> 从 </span>
        <AInput v-model:value="valueRange.start" type="number" v-bind="typeRangeAttrs" />
        <span> 日 至 </span>
        <AInput v-model:value="valueRange.end" type="number" v-bind="typeRangeAttrs" />
        <span> 日 </span>
      </div>
      <div class="item">
        <Radio :value="TypeEnum.loop" v-bind="beforeRadioAttrs">
          循环
        </Radio>
        <span> 从 </span>
        <AInput v-model:value="valueLoop.start" type="number" class="w-4" v-bind="typeLoopAttrs" />
        <span> 日开始，间隔 </span>
        <AInput v-model:value="valueLoop.interval" type="number" v-bind="typeLoopAttrs" />
        <span> 日 </span>
      </div>
      <div class="item">
        <Radio :value="TypeEnum.last" v-bind="beforeRadioAttrs">
          最后一日
        </Radio>
      </div>
      <div class="item">
        <Radio :value="TypeEnum.specify" v-bind="beforeRadioAttrs">
          指定
        </Radio>
        <div class="list">
          <CheckboxGroup v-model:value="valueList">
            <template v-for="i in specifyRange" :key="i">
              <Checkbox :value="i" v-bind="typeSpecifyAttrs">
                {{ i }}
              </Checkbox>
            </template>
          </CheckboxGroup>
        </div>
      </div>
    </RadioGroup>
  </div>
</template>
