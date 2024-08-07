<!--
 * @Description: 组件属性控件
-->
<script lang="ts" setup>
import { Checkbox, Col, Empty, FormItem, Select } from 'ant-design-vue'
import { computed, ref, watch } from 'vue'
import { useFormDesignState } from '../../../hooks/useFormDesignState'
import {
  baseComponentAttrs,
  baseComponentCommonAttrs,
  baseComponentControlAttrs,
  componentPropsFuncs,
} from '../../VFormDesign/config/componentPropsConfig'
import { formItemsForEach, remove } from '../../../utils'
import type { IBaseFormAttrs } from '../config/formItemPropsConfig'
import FormOptions from './FormOptions.vue'
import { componentMap } from '@/components/Form/src/componentMap'

const { formConfig } = useFormDesignState()
// 让 computed 属性自动更新
const allOptions = ref([] as Omit<IBaseFormAttrs, 'tag'>[])
function showControlAttrs(includes: string[] | undefined) {
  if (!includes)
    return true
  return includes.includes(formConfig.value.currentItem!.component)
}

if (formConfig.value.currentItem) {
  formConfig.value.currentItem.componentProps
    = formConfig.value.currentItem.componentProps || {}
}

watch(
  () => formConfig.value.currentItem?.field,
  (_newValue, oldValue) => {
    formConfig.value.schemas
      && formItemsForEach(formConfig.value.schemas, (item) => {
        if (item.link) {
          const index = item.link.findIndex(linkItem => linkItem === oldValue)
          index !== -1 && remove(item.link, index)
        }
      })
  },
)

watch(
  () => formConfig.value.currentItem && formConfig.value.currentItem.component,
  () => {
    allOptions.value = []
    baseComponentControlAttrs.forEach((item) => {
      item.category = 'control'
      if (!item.includes) {
        // 如果属性没有include，所有的控件都适用

        allOptions.value.push(item)
      }
      else if (item.includes.includes(formConfig.value.currentItem!.component)) {
        // 如果有include，检查是否包含了当前控件类型
        allOptions.value.push(item)
      }
    })

    baseComponentCommonAttrs.forEach((item) => {
      item.category = 'input'
      if (item.includes) {
        if (item.includes.includes(formConfig.value.currentItem!.component))
          allOptions.value.push(item)
      }
      else if (item.exclude) {
        if (!item.exclude.includes(formConfig.value.currentItem!.component))
          allOptions.value.push(item)
      }
      else {
        allOptions.value.push(item)
      }
    })

    baseComponentAttrs[formConfig.value.currentItem!.component]
      && baseComponentAttrs[formConfig.value.currentItem!.component].forEach(async (item) => {
        if (item.component) {
          if (['Switch', 'Checkbox', 'Radio'].includes(item.component)) {
            item.category = 'control'
            allOptions.value.push(item)
          }
          else {
            item.category = 'input'
            allOptions.value.push(item)
          }
        }
      })
  },
  {
    immediate: true,
  },
)
// 控制性的选项
const controlOptions = computed(() => {
  return allOptions.value.filter((item) => {
    return item.category === 'control'
  })
})

// 非控制性选择
const inputOptions = computed(() => {
  return allOptions.value.filter((item) => {
    return item.category === 'input'
  })
})

const Com = computed(() => {
  return com => componentMap.get(com) as ReturnType<typeof defineComponent>
})

watch(
  () => formConfig.value.currentItem!.componentProps,
  () => {
    const func = componentPropsFuncs[formConfig.value.currentItem!.component]
    if (func)
      func(formConfig.value.currentItem!.componentProps, allOptions.value)
  },
  {
    immediate: true,
    deep: true,
  },
)
const linkOptions = computed(() => {
  return (
    formConfig.value.schemas
    && formConfig.value.schemas
      .filter(item => item.key !== formConfig.value.currentItem!.key)
      .map(({ label, field }) => ({ label: `${label}/${field}`, value: field }))
  )
})
</script>

<template>
  <div class="properties-content">
    <div v-if="formConfig.currentItem" class="properties-body">
      <Empty v-if="!formConfig.currentItem.key" class="hint-box" description="未选择组件" />

      <aForm label-align="left" layout="vertical">
        <!--    循环遍历渲染组件属性      -->

        <div v-if="formConfig.currentItem && formConfig.currentItem.componentProps">
          <FormItem v-for="item in inputOptions" :key="item.name" :label="item.label">
            <!--     处理数组属性，placeholder       -->

            <div v-if="item.children">
              <template v-for="(child, index) of item.children" :key="index">
                <component
                  v-bind="child.componentProps"
                  :is="Com(child.component)"
                  v-if="child.component"
                  v-model:value="formConfig.currentItem.componentProps[item.name][index]"
                />
              </template>
            </div>
            <!--     如果不是数组，则正常处理属性值       -->
            <component
              v-bind="item.componentProps" :is="Com(item.component)" v-else-if="item.component"
              v-model:value="formConfig.currentItem.componentProps[item.name]" class="component-prop"
            />
          </FormItem>
          <FormItem label="控制属性">
            <Col v-for="item in controlOptions" :key="item.name">
              <Checkbox
                v-if="showControlAttrs(item.includes)" v-bind="item.componentProps"
                v-model:checked="formConfig.currentItem.componentProps[item.name]"
              >
                {{ item.label }}
              </Checkbox>
            </Col>
          </FormItem>
        </div>
        <FormItem label="关联字段">
          <Select v-model:value="formConfig.currentItem.link" mode="multiple" :options="linkOptions" />
        </FormItem>

        <FormItem
          v-if="[
            'Select',
            'CheckboxGroup',
            'RadioGroup',
            'TreeSelect',
            'Cascader',
            'AutoComplete',
          ].includes(formConfig.currentItem.component)
          " label="选项"
        >
          <FormOptions />
        </FormItem>

        <FormItem v-if="['Grid'].includes(formConfig.currentItem.component)" label="栅格">
          <FormOptions />
        </FormItem>
      </aForm>
    </div>
  </div>
</template>
