<script lang="ts">
import { defineComponent } from 'vue'
import { Input, Radio } from 'ant-design-vue'
import { useTabEmits, useTabProps, useTabSetup } from './useTabMixin'

export default defineComponent({
  name: 'YearUI',
  components: { Input, Radio, RadioGroup: Radio.Group },
  props: useTabProps({
    defaultValue: '*',
  }),
  emits: useTabEmits(),
  setup(props, context) {
    const nowYear = new Date().getFullYear()
    return useTabSetup(props, context, {
      defaultValue: '*',
      minValue: 0,
      valueRange: { start: nowYear, end: nowYear + 100 },
      valueLoop: { start: nowYear, interval: 1 },
    })
  },
})
</script>

<template>
  <div :class="`${prefixCls}-config-list`">
    <RadioGroup v-model:value="type">
      <div class="item">
        <Radio :value="TypeEnum.every" v-bind="beforeRadioAttrs">
          每年
        </Radio>
      </div>
      <div class="item">
        <Radio :value="TypeEnum.range" v-bind="beforeRadioAttrs">
          区间
        </Radio>
        <span> 从 </span>
        <Input v-model:value="valueRange.start" type="number" class="w80" v-bind="typeRangeAttrs" />
        <span> 年 至 </span>
        <Input v-model:value="valueRange.end" type="number" class="w80" v-bind="typeRangeAttrs" />
        <span> 年 </span>
      </div>
      <div class="item">
        <Radio :value="TypeEnum.loop" v-bind="beforeRadioAttrs">
          循环
        </Radio>
        <span> 从 </span>
        <Input v-model:value="valueLoop.start" type="number" class="w80" v-bind="typeLoopAttrs" />
        <span> 年开始，间隔 </span>
        <Input v-model:value="valueLoop.interval" type="number" class="w80" v-bind="typeLoopAttrs" />
        <span> 年 </span>
      </div>
    </RadioGroup>
  </div>
</template>
