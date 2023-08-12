<script lang="ts">
import { defineComponent } from 'vue'
import { Checkbox, Input, Radio } from 'ant-design-vue'
import { useTabEmits, useTabProps, useTabSetup } from './useTabMixin'

export default defineComponent({
  name: 'HourUI',
  components: { AInput: Input, Checkbox, CheckboxGroup: Checkbox.Group, Radio, RadioGroup: Radio.Group },
  props: useTabProps({
    defaultValue: '*',
  }),
  emits: useTabEmits(),
  setup(props, context) {
    return useTabSetup(props, context, {
      defaultValue: '*',
      minValue: 0,
      maxValue: 23,
      valueRange: { start: 0, end: 23 },
      valueLoop: { start: 0, interval: 1 },
    })
  },
})
</script>

<template>
  <div :class="`${prefixCls}-config-list`">
    <RadioGroup v-model:value="type">
      <div class="item">
        <Radio :value="TypeEnum.every" v-bind="beforeRadioAttrs">
          每时
        </Radio>
      </div>
      <div class="item">
        <Radio :value="TypeEnum.range" v-bind="beforeRadioAttrs">
          区间
        </Radio>
        <span> 从 </span>
        <AInput v-model:value="valueRange.start" type="number" v-bind="typeRangeAttrs" />
        <span> 时 至 </span>
        <AInput v-model:value="valueRange.end" type="number" v-bind="typeRangeAttrs" />
        <span> 时 </span>
      </div>
      <div class="item">
        <Radio :value="TypeEnum.loop" v-bind="beforeRadioAttrs">
          循环
        </Radio>
        <span> 从 </span>
        <AInput v-model:value="valueLoop.start" type="number" v-bind="typeLoopAttrs" />
        <span> 时开始，间隔 </span>
        <AInput v-model:value="valueLoop.interval" type="number" v-bind="typeLoopAttrs" />
        <span> 时 </span>
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
