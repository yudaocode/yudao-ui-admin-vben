<!--
 * @Description: 渲染组件，无法使用Vben的组件
-->
<script lang="ts">
import { defineComponent, reactive, ref, toRefs } from 'vue'
import { Modal } from 'ant-design-vue'
import type { IFormConfig } from '../../typings/v-form-component'
import type { IAnyObject } from '../../typings/base-type'
import VFormCreate from '../VFormCreate/index.vue'
import { formatRules } from '../../utils'
import type { IVFormMethods } from '../../hooks/useVFormMethods'
import JsonModal from '../VFormDesign/components/JsonModal.vue'
import type { IToolbarMethods } from '../../typings/form-type'

export default defineComponent({
  name: 'VFormPreview',
  components: {
    JsonModal,
    VFormCreate,
    Modal,
  },
  setup() {
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
    const showModal = (jsonData: IFormConfig) => {
      // console.log('showModal-', jsonData);
      formatRules(jsonData.schemas)
      state.formConfig = jsonData
      state.open = true
    }

    /**
     * 获取表单数据
     * @return {Promise<void>}
     */
    const handleCancel = () => {
      state.open = false
      state.formModel = {}
    }
    const handleGetData = async () => {
      const _data = await state.fApi.submit?.()
      jsonModal.value?.showModal?.(_data)
    }

    const onSubmit = (_data: IAnyObject) => {
      //
    }
    const onCancel = () => {
      state.formModel = {}
    }
    return {
      handleGetData,
      handleCancel,
      ...toRefs(state),
      showModal,
      jsonModal,
      onSubmit,
      onCancel,
    }
  },
})
</script>

<template>
  <Modal
    title="预览(支持布局)"
    :open="open"
    ok-text="获取数据"
    cancel-text="关闭"
    style="top: 20px"
    :destroy-on-close="true"
    :width="900"
    @ok="handleGetData"
    @cancel="handleCancel"
  >
    <VFormCreate v-model:fApi="fApi" v-model:formModel="formModel" :form-config="formConfig" @submit="onSubmit">
      <template #slotName="{ formModel, field }">
        <a-input v-model:value="formModel[field]" placeholder="我是插槽传递的输入框" />
      </template>
    </VFormCreate>
    <JsonModal ref="jsonModal" />
  </Modal>
</template>
