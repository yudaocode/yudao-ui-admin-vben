<!--
 * @Description: 表单项属性
-->
<script lang="ts">
import { defineComponent } from 'vue'
import { Checkbox, Empty, Form, FormItem, Input, Select, Slider, Switch } from 'ant-design-vue'
import { isArray } from 'lodash-es'
import { baseItemColumnProps } from '../config/formItemPropsConfig'

import { useFormDesignState } from '../../../hooks/useFormDesignState'
import RuleProps from './RuleProps.vue'

export default defineComponent({
  name: 'FormItemProps',
  components: {
    RuleProps,
    Empty,
    Input,
    Form,
    FormItem,
    Switch,
    Checkbox,
    Select,
    Slider,
  },
  // props: {} as PropsOptions,

  setup() {
    const { formConfig } = useFormDesignState()
    const showProps = (exclude: string[] | undefined) => {
      if (!exclude)
        return true

      return isArray(exclude) ? !exclude.includes(formConfig.value.currentItem!.component) : true
    }
    return {
      baseItemColumnProps,
      formConfig,
      showProps,
    }
  },
})
</script>

<template>
  <div class="properties-content">
    <div v-if="formConfig.currentItem" class="properties-body">
      <Empty v-if="!formConfig.currentItem.key" class="hint-box" description="未选择控件" />
      <Form v-else label-align="left" layout="vertical">
        <div v-for="item of baseItemColumnProps" :key="item.name">
          <FormItem v-if="showProps(item.exclude)" :label="item.label">
            <component
              v-bind="item.componentProps"
              :is="item.component"
              v-if="formConfig.currentItem.colProps"
              v-model:value="formConfig.currentItem.colProps[item.name]"
              class="component-props"
            />
          </FormItem>
        </div>
      </Form>
    </div>
  </div>
</template>
