<!--
 * @Description: 渲染JSON数据
-->
<script lang="ts">
import { computed, defineComponent, reactive, toRefs } from 'vue'
import { Modal } from 'ant-design-vue'
import type { IFormConfig } from '../../../typings/v-form-component'
import { formatRules, removeAttrs } from '../../../utils'
import PreviewCode from './PreviewCode.vue'

export default defineComponent({
  name: 'JsonModal',
  components: {
    PreviewCode,
    Modal,
  },
  emits: ['cancel'],
  setup(_props, { emit }) {
    const state = reactive<{
      open: boolean
      jsonData: IFormConfig
    }>({
      open: false, // 控制json数据弹框显示
      jsonData: {} as IFormConfig, // json数据
    })
    /**
     * 显示Json数据弹框
     * @param jsonData
     */
    const showModal = (jsonData: IFormConfig) => {
      formatRules(jsonData.schemas)
      state.jsonData = jsonData
      state.open = true
    }

    // 计算json数据
    const editorJson = computed(() => {
      return JSON.stringify(removeAttrs(state.jsonData), null, '\t')
    })

    // 关闭弹框
    const handleCancel = () => {
      state.open = false
      emit('cancel')
    }

    return { ...toRefs(state), editorJson, handleCancel, showModal }
  },
})
</script>

<template>
  <Modal
    title="JSON数据"
    :footer="null"
    :open="open"
    :destroy-on-close="true"
    wrap-class-name="v-code-modal"
    style="top: 20px"
    width="850px"
    @cancel="handleCancel"
  >
    <PreviewCode :editor-json="editorJson" />
  </Modal>
</template>
