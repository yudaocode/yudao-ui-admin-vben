<template>
  <div :class="`${prefixCls}-config-list`">
    <RadioGroup v-model:value="type">
      <div class="item">
        <Radio :value="TypeEnum.every" v-bind="beforeRadioAttrs">每时</Radio>
      </div>
      <div class="item">
        <Radio :value="TypeEnum.range" v-bind="beforeRadioAttrs">区间</Radio>
        <span> 从 </span>
        <Input type="number" v-model:value="valueRange.start" v-bind="typeRangeAttrs" />
        <span> 时 至 </span>
        <Input type="number" v-model:value="valueRange.end" v-bind="typeRangeAttrs" />
        <span> 时 </span>
      </div>
      <div class="item">
        <Radio :value="TypeEnum.loop" v-bind="beforeRadioAttrs">循环</Radio>
        <span> 从 </span>
        <Input type="number" v-model:value="valueLoop.start" v-bind="typeLoopAttrs" />
        <span> 时开始，间隔 </span>
        <Input type="number" v-model:value="valueLoop.interval" v-bind="typeLoopAttrs" />
        <span> 时 </span>
      </div>
      <div class="item">
        <Radio :value="TypeEnum.specify" v-bind="beforeRadioAttrs">指定</Radio>
        <div class="list">
          <CheckboxGroup v-model:value="valueList">
            <template v-for="i in specifyRange" :key="i">
              <Checkbox :value="i" v-bind="typeSpecifyAttrs">{{ i }}</Checkbox>
            </template>
          </CheckboxGroup>
        </div>
      </div>
    </RadioGroup>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { Input, Radio, Checkbox } from 'ant-design-vue'
import { useTabProps, useTabEmits, useTabSetup } from './useTabMixin'

export default defineComponent({
  name: 'HourUI',
  components: { Input, Checkbox, CheckboxGroup: Checkbox.Group, Radio, RadioGroup: Radio.Group },
  props: useTabProps({
    defaultValue: '*'
  }),
  emits: useTabEmits(),
  setup(props, context) {
    return useTabSetup(props, context, {
      defaultValue: '*',
      minValue: 0,
      maxValue: 23,
      valueRange: { start: 0, end: 23 },
      valueLoop: { start: 0, interval: 1 }
    })
  }
})
</script>
