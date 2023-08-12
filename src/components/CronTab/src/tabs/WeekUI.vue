<script lang="ts">
import { computed, defineComponent, watch } from 'vue'
import { Checkbox, Input, Radio, Select } from 'ant-design-vue'
import { TypeEnum, useTabEmits, useTabProps, useTabSetup } from './useTabMixin'

const WEEK_MAP_EN = {
  1: 'SUN',
  2: 'MON',
  3: 'TUE',
  4: 'WED',
  5: 'THU',
  6: 'FRI',
  7: 'SAT',
}

const WEEK_MAP_CN = {
  1: '周日',
  2: '周一',
  3: '周二',
  4: '周三',
  5: '周四',
  6: '周五',
  7: '周六',
}

export default defineComponent({
  name: 'WeekUI',
  components: { AInput: Input, ASelect: Select, Checkbox, CheckboxGroup: Checkbox.Group, Radio, RadioGroup: Radio.Group },
  props: useTabProps({
    defaultValue: '?',
    props: {
      day: { type: String, default: '*' },
    },
  }),
  emits: useTabEmits(),
  setup(props, context) {
    const disabledChoice = computed(() => {
      return (props.day && props.day !== '?') || props.disabled
    })
    const setup = useTabSetup(props, context, {
      defaultType: TypeEnum.unset,
      defaultValue: '?',
      minValue: 1,
      maxValue: 7,
      // 0,7表示周日 1表示周一
      valueRange: { start: 1, end: 7 },
      valueLoop: { start: 2, interval: 1 },
      disabled: disabledChoice,
    })
    const weekOptions = computed(() => {
      const options: { label: string; value: number }[] = []
      for (const weekKey of Object.keys(WEEK_MAP_CN)) {
        const weekName: string = WEEK_MAP_CN[weekKey]
        options.push({
          value: Number.parseInt(weekKey),
          label: weekName,
        })
      }
      return options
    })

    const typeRangeSelectAttrs = computed(() => ({
      class: ['w80'],
      disabled: setup.typeRangeAttrs.value.disabled,
    }))

    const typeLoopSelectAttrs = computed(() => ({
      class: ['w80'],
      disabled: setup.typeLoopAttrs.value.disabled,
    }))

    watch(
      () => props.day,
      () => {
        setup.updateValue(disabledChoice.value ? '?' : setup.computeValue.value)
      },
    )

    return {
      ...setup,
      weekOptions,
      typeLoopSelectAttrs,
      typeRangeSelectAttrs,
      WEEK_MAP_CN,
      WEEK_MAP_EN,
    }
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
        <Radio :value="TypeEnum.range" v-bind="beforeRadioAttrs">
          区间
        </Radio>
        <span> 从 </span>
        <ASelect v-model:value="valueRange.start" :options="weekOptions" v-bind="typeRangeSelectAttrs" />
        <span> 至 </span>
        <ASelect v-model:value="valueRange.end" :options="weekOptions" v-bind="typeRangeSelectAttrs" />
      </div>
      <div class="item">
        <Radio :value="TypeEnum.loop" v-bind="beforeRadioAttrs">
          循环
        </Radio>
        <span> 从 </span>
        <ASelect v-model:value="valueLoop.start" :options="weekOptions" v-bind="typeLoopSelectAttrs" />
        <span> 开始，间隔 </span>
        <AInput v-model:value="valueLoop.interval" type="number" v-bind="typeLoopAttrs" />
        <span> 天 </span>
      </div>
      <div class="item">
        <Radio :value="TypeEnum.specify" v-bind="beforeRadioAttrs">
          指定
        </Radio>
        <div class="list list-cn">
          <CheckboxGroup v-model:value="valueList">
            <template v-for="opt in weekOptions" :key="opt.value">
              <Checkbox :value="opt.value" v-bind="typeSpecifyAttrs">
                {{ opt.label }}
              </Checkbox>
            </template>
          </CheckboxGroup>
        </div>
      </div>
    </RadioGroup>
  </div>
</template>
