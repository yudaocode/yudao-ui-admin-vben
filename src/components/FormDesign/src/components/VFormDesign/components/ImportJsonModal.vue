<!--
 * @Description: 导入JSON模板
-->
<script lang="ts" setup>
import { reactive, ref } from 'vue'

// import message from '../../../utils/message';
import { Modal, Upload } from 'ant-design-vue'
import { useFormDesignState } from '../../../hooks/useFormDesignState'

// import { codemirror } from 'vue-codemirror-lite';
import type { IFormConfig } from '../../../typings/v-form-component'
import { formItemsForEach, generateKey } from '../../../utils'
import { CodeEditor, MODE } from '@/components/CodeEditor'
import { useMessage } from '@/hooks/web/useMessage'

const { createMessage } = useMessage()

const myEditor = ref(null)

const state = reactive({
  open: false,
  json: `{
        "schemas": [
          {
            "component": "input",
            "label": "输入框",
            "field": "input_2",
            "span": 24,
            "props": {
              "type": "text"
            }
          }
        ],
        "layout": "horizontal",
        "labelLayout": "flex",
        "labelWidth": 100,
        "labelCol": {},
        "wrapperCol": {}
      }`,
  jsonData: {
    schemas: {},
    config: {},
  },
  handleSetSelectItem: null,
})
const { formDesignMethods } = useFormDesignState()
function handleCancel() {
  state.open = false
}
function showModal() {
  state.open = true
}
function handleImportJson() {
  // 导入JSON
  try {
    const editorJsonData = JSON.parse(state.json) as IFormConfig
    editorJsonData.schemas
            && formItemsForEach(editorJsonData.schemas, (formItem) => {
              generateKey(formItem)
            })
    formDesignMethods.setFormConfig({
      ...editorJsonData,
      activeKey: 1,
      currentItem: { component: '' },
    })
    handleCancel()
    createMessage.success('导入成功')
  }
  catch {
    createMessage.error('导入失败，数据格式不对')
  }
}
function beforeUpload(e: File) {
  // 通过json文件导入
  const reader = new FileReader()
  reader.readAsText(e)
  reader.onload = function () {
    state.json = this.result as string
    handleImportJson()
  }
  return false
}

defineExpose({ showModal })
</script>

<template>
  <Modal
    title="JSON数据"
    :open="state.open"
    cancel-text="关闭"
    :destroy-on-close="true"
    wrap-class-name="v-code-modal"
    style="top: 20px"
    :width="850"
    @ok="handleImportJson"
    @cancel="handleCancel"
  >
    <p class="hint-box">
      导入格式如下:
    </p>
    <div class="v-json-box">
      <CodeEditor ref="myEditor" v-model:value="json" :mode="MODE.JSON" />
    </div>

    <template #footer>
      <a-button @click="handleCancel">
        取消
      </a-button>
      <Upload
        class="mx-2.5"
        :before-upload="beforeUpload"
        :show-upload-list="false"
        accept="application/json"
      >
        <a-button type="primary">
          导入json文件
        </a-button>
      </Upload>
      <a-button type="primary" @click="handleImportJson">
        确定
      </a-button>
    </template>
  </Modal>
</template>
