<!--
 * @Description: 表单项属性
-->
<script lang="ts" setup>
import { Empty, Form, FormItem } from 'ant-design-vue'
import { isArray } from 'lodash-es'
import { baseItemColumnProps } from '../config/formItemPropsConfig'

import { useFormDesignState } from '../../../hooks/useFormDesignState'

const { formConfig } = useFormDesignState()
function showProps(exclude: string[] | undefined) {
  if (!exclude)
    return true

  return isArray(exclude) ? !exclude.includes(formConfig.value.currentItem!.component) : true
}
</script>

<template>
  <div class="properties-content">
    <div v-if="formConfig.currentItem" class="properties-body">
      <Empty v-if="!formConfig.currentItem.key" class="hint-box" description="未选择控件" />
      <Form v-else label-align="left" layout="vertical">
        <div v-for="item of baseItemColumnProps" :key="item.name">
          <FormItem v-if="showProps(item.exclude)" :label="item.label">
            <component
              v-bind="item.componentProps" :is="item.component" v-if="formConfig.currentItem.colProps && item.component"
              v-model:value="formConfig.currentItem.colProps[item.name]" class="component-props"
            />
          </FormItem>
        </div>
      </Form>
    </div>
  </div>
</template>
