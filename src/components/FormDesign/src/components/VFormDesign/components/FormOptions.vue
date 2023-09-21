<script lang="ts" setup>
import { Input } from 'ant-design-vue'
import { useFormDesignState } from '../../../hooks/useFormDesignState'
import { remove } from '../../../utils'
import message from '../../../utils/message'
import { Icon } from '@/components/Icon'

const { formConfig } = useFormDesignState()
const key = formConfig.value.currentItem?.component === 'TreeSelect' ? 'treeData' : 'options'
function addOptions() {
  if (!formConfig.value.currentItem?.componentProps?.[key])
    formConfig.value.currentItem!.componentProps![key] = []
  const len = formConfig.value.currentItem?.componentProps?.[key].length + 1
  formConfig.value.currentItem!.componentProps![key].push({
    label: `选项${len}`,
    value: `${len}`,
  })
}
function deleteOptions(index: number) {
  remove(formConfig.value.currentItem?.componentProps?.[key], index)
}

function addGridOptions() {
  formConfig.value.currentItem?.columns?.push({
    span: 12,
    children: [],
  })
}
function deleteGridOptions(index: number) {
  if (index === 0)
    return message.warning('请至少保留一个栅格')

  remove(formConfig.value.currentItem!.columns!, index)
}
</script>

<template>
  <div>
    <div v-if="['Grid'].includes(formConfig.currentItem!.component)">
      <div v-for="(item, index) of formConfig.currentItem!.columns" :key="index">
        <div class="options-box">
          <Input v-model:value="item.span" class="options-value" />
          <a class="options-delete" @click="deleteGridOptions(index)">
            <Icon icon="ant-design:delete-outlined" />
          </a>
        </div>
      </div>
      <a @click="addGridOptions">
        <Icon icon="ant-design:file-add-outlined" />
        添加栅格
      </a>
    </div>
    <div v-else>
      <div v-for="(item, index) of formConfig.currentItem!.componentProps![key]" :key="index">
        <div class="mb-1.5 flex items-center">
          <Input v-model:value="item.label" />
          <Input v-model:value="item.value" class="mx-2" />
          <a class="h-7.5 w-7.5 rounded-full bg-light-50 text-center text-gray-500 hover:bg-red-500" @click="deleteOptions(index)">
            <Icon icon="ant-design:delete-outlined" />
          </a>
        </div>
      </div>
      <a @click="addOptions">
        <Icon icon="ant-design:file-add-outlined" />
        添加选项
      </a>
    </div>
  </div>
</template>
