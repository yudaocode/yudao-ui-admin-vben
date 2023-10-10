<!--
 * @Description: 渲染代码
-->
<script lang="ts" setup>
import { computed, reactive } from 'vue'
import { Modal } from 'ant-design-vue'
import { formatRules, removeAttrs } from '../../../utils'
import type { IFormConfig } from '../../../typings/v-form-component'
import PreviewCode from './PreviewCode.vue'

const codeVueFront = `<template>
  <div>
    <v-form-create
      :formConfig="formConfig"
      :formData="formData"
      v-model="fApi"
    />
    <a-button @click="submit">提交</a-button>
  </div>
</template>
<script>

export default {
  name: 'Demo',
  data () {
    return {
      fApi:{},
      formData:{},
      formConfig: `
const codeVueLast = `
    }
  },
  methods: {
    async submit() {
      const data = await this.fApi.submit()
      console.log(data)
     }
  }
}
<\/script>`
//
const state = reactive({
  open: false,
  jsonData: {} as IFormConfig,
})

function showModal(formConfig: IFormConfig) {
  formConfig.schemas && formatRules(formConfig.schemas)
  state.open = true
  state.jsonData = formConfig
}

const editorVueJson = computed(() => {
  return codeVueFront + JSON.stringify(removeAttrs(state.jsonData), null, '\t') + codeVueLast
})

defineExpose({ showModal })
</script>

<template>
  <Modal
    title="代码"
    :footer="null"
    :open="state.open"
    wrap-class-name="v-code-modal"
    style="top: 20px"
    width="850px"
    :destroy-on-close="true"
    @cancel="state.open = false"
  >
    <PreviewCode :editor-json="editorVueJson" file-format="vue" />
  </Modal>
</template>
