<!--
 * @Description: 使用vbenForm的功能进行渲染
-->
<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import { Modal } from 'ant-design-vue'
import type { IFormConfig } from '../../typings/v-form-component'
import type { IAnyObject } from '../../typings/base-type'
import JsonModal from '../VFormDesign/components/JsonModal.vue'
import type { IToolbarMethods } from '../../typings/form-type'
import { BasicForm, useForm } from '@/components/Form/index'

const jsonModal = ref<IToolbarMethods | null>(null)
const state = reactive<{
  formModel: IAnyObject
  open: boolean
  formConfig: IFormConfig
}>({
  formModel: {},
  formConfig: {} as IFormConfig,
  open: false,
})

const attrs = computed(() => {
  return {
    ...state.formConfig,
  } as Recordable
})

/**
 * 显示Json数据弹框
 * @param jsonData
 */
function showModal(jsonData: IFormConfig) {
  state.formConfig = jsonData
  state.open = true
}

// 表单
const [registerForm, { validate }] = useForm()

function handleCancel() {
  state.open = false
}
/**
 * 获取表单数据
 * @return {Promise<void>}
 */
async function handleGetData() {
  const data = await validate()
  jsonModal.value?.showModal?.(data)
}

defineExpose({ showModal })
</script>

<template>
  <Modal
    title="预览(不支持布局)"
    :open="state.open"
    ok-text="获取数据"
    cancel-text="关闭"
    style="top: 20px"
    :destroy-on-close="true"
    :width="900"
    @ok="handleGetData"
    @cancel="handleCancel"
  >
    <BasicForm v-bind="attrs" @register="registerForm" />
    <JsonModal ref="jsonModal" />
  </Modal>
</template>
