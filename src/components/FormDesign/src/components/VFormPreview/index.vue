<!--
 * @Description: 渲染组件，无法使用Vben的组件
-->
<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { Modal } from 'ant-design-vue'
import type { IFormConfig } from '../../typings/v-form-component'
import type { IAnyObject } from '../../typings/base-type'
import VFormCreate from '../VFormCreate/index.vue'
import { formatRules } from '../../utils'
import type { IVFormMethods } from '../../hooks/useVFormMethods'
import JsonModal from '../VFormDesign/components/JsonModal.vue'
import type { IToolbarMethods } from '../../typings/form-type'

const jsonModal = ref<IToolbarMethods | null>(null)
const state = reactive<{
  formModel: IAnyObject
  open: boolean
  formConfig: IFormConfig
  fApi: IVFormMethods
}>({
  formModel: {},
  formConfig: {} as IFormConfig,
  open: false,
  fApi: {} as IVFormMethods,
})

/**
 * 显示Json数据弹框
 * @param jsonData
 */
function showModal(jsonData: IFormConfig) {
  // console.log('showModal-', jsonData);
  formatRules(jsonData.schemas)
  state.formConfig = jsonData
  state.open = true
}

/**
 * 获取表单数据
 * @return {Promise<void>}
 */
function handleCancel() {
  state.open = false
  onCancel()
}
async function handleGetData() {
  const _data = await state.fApi.submit?.()
  jsonModal.value?.showModal?.(_data)
}

function onSubmit(_data: IAnyObject) {
  //
}
function onCancel() {
  state.formModel = {}
}

defineExpose({ showModal, onCancel })
</script>

<template>
  <Modal
    title="预览(支持布局)"
    :open="state.open"
    ok-text="获取数据"
    cancel-text="关闭"
    style="top: 20px"
    :destroy-on-close="true"
    :width="900"
    @ok="handleGetData"
    @cancel="handleCancel"
  >
    <VFormCreate
      v-model:fApi="state.fApi"
      v-model:formModel="state.formModel"
      :form-config="state.formConfig"
      @submit="onSubmit"
    >
      <template #slotName="{ formModel, field }">
        <a-input v-model:value="formModel[field]" placeholder="我是插槽传递的输入框" />
      </template>
    </VFormCreate>
    <JsonModal ref="jsonModal" />
  </Modal>
</template>
