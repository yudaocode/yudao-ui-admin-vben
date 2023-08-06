<!--
 * @Description: 表单项属性，控件属性面板
-->
<script lang="ts">
import { computed, defineComponent, watch } from 'vue'
import { Checkbox, Col, Empty, Form, FormItem, Input, RadioGroup, Select, Slider, Switch } from 'ant-design-vue'
import { isArray } from 'lodash-es'
import {
  advanceFormItemColProps,
  advanceFormItemProps,
  baseFormItemControlAttrs,
  baseFormItemProps,
} from '../../VFormDesign/config/formItemPropsConfig'

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
    Col,
    RadioGroup,
  },
  // props: {} as PropsOptions,

  setup() {
    const { formConfig } = useFormDesignState()

    watch(
      () => formConfig.value,
      () => {
        if (formConfig.value.currentItem) {
          formConfig.value.currentItem.itemProps = formConfig.value.currentItem.itemProps || {}
          formConfig.value.currentItem.itemProps.labelCol = formConfig.value.currentItem.itemProps.labelCol || {}
          formConfig.value.currentItem.itemProps.wrapperCol = formConfig.value.currentItem.itemProps.wrapperCol || {}
        }
      },
      { deep: true, immediate: true },
    )
    const showProps = (exclude: string[] | undefined) => {
      if (!exclude)
        return true

      return isArray(exclude) ? !exclude.includes(formConfig.value.currentItem!.component) : true
    }

    const controlPropsList = computed(() => {
      return baseFormItemControlAttrs.filter((item) => {
        return showProps(item.exclude)
      })
    })

    return {
      baseFormItemProps,
      advanceFormItemProps,
      advanceFormItemColProps,
      formConfig,
      controlPropsList,
      showProps,
    }
  },
})
</script>

<template>
  <div class="properties-content">
    <div v-if="formConfig.currentItem?.itemProps" class="properties-body">
      <Empty v-if="!formConfig.currentItem.key" class="hint-box" description="未选择控件" />
      <Form v-else label-align="left" layout="vertical">
        <div v-for="item of baseFormItemProps" :key="item.name">
          <FormItem v-if="showProps(item.exclude)" :label="item.label">
            <component
              v-bind="item.componentProps"
              :is="item.component"
              v-model:value="formConfig.currentItem[item.name]"
              class="component-props"
            />
          </FormItem>
        </div>
        <div v-for="item of advanceFormItemProps" :key="item.name">
          <FormItem v-if="showProps(item.exclude)" :label="item.label">
            <component
              v-bind="item.componentProps"
              :is="item.component"
              v-model:value="formConfig.currentItem.itemProps[item.name]"
              class="component-props"
            />
          </FormItem>
        </div><div v-for="item of advanceFormItemColProps" :key="item.name">
          <FormItem v-if="showProps(item.exclude)" :label="item.label">
            <component
              v-bind="item.componentProps"
              :is="item.component"
              v-model:value="formConfig.currentItem.itemProps[item.name].span"
              class="component-props"
            />
          </FormItem>
        </div>
        <FormItem v-if="controlPropsList.length" label="控制属性">
          <Col v-for="item of controlPropsList" :key="item.name">
            <Checkbox v-model:checked="formConfig.currentItem.itemProps[item.name]">
              {{ item.label }}
            </Checkbox>
          </Col>
        </FormItem>
        <FormItem v-if="!['Grid'].includes(formConfig.currentItem.component)" label="是否必选">
          <Switch v-model:checked="formConfig.currentItem.itemProps.required" />
          <Input
            v-if="formConfig.currentItem.itemProps.required"
            v-model:value="formConfig.currentItem.itemProps.message"
            placeholder="请输入必选提示"
          />
        </FormItem>
        <FormItem
          v-if="!['Grid'].includes(formConfig.currentItem.component)"
          label="校验规则"
          :class="{ 'form-rule-props': !!formConfig.currentItem.itemProps.rules }"
        >
          <RuleProps />
        </FormItem>
      </Form>
    </div>
  </div>
</template>
