<!--
 * @Description: 右侧属性面板控件 表单属性面板
-->
<script lang="ts" setup>
import type { RadioChangeEvent } from 'ant-design-vue'
import {
  Checkbox,
  Col,
  Form,
  FormItem,
  InputNumber,
  Radio,
  Slider,
} from 'ant-design-vue'
import { useFormDesignState } from '../../../hooks/useFormDesignState'

const { formConfig } = useFormDesignState()

formConfig.value = formConfig.value || {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 },
}

function lableLayoutChange(e: RadioChangeEvent) {
  if (e.target.value === 'Grid')
    formConfig.value.layout = 'horizontal'
}
</script>

<template>
  <div class="properties-content">
    <Form class="properties-body" label-align="left" layout="vertical">
      <!--      <e-upload v-model="fileList"></e-upload> -->

      <FormItem label="表单布局">
        <Radio.Group v-model:value="formConfig.layout" button-style="solid">
          <Radio.Button value="horizontal">
            水平
          </Radio.Button>
          <Radio.Button value="vertical" :disabled="formConfig.labelLayout === 'Grid'">
            垂直
          </Radio.Button>
          <Radio.Button value="inline" :disabled="formConfig.labelLayout === 'Grid'">
            行内
          </Radio.Button>
        </Radio.Group>
      </FormItem>

      <!-- <Row> -->
      <FormItem label="标签布局">
        <Radio.Group
          v-model:value="formConfig.labelLayout"
          button-style="solid"
          @change="lableLayoutChange"
        >
          <Radio.Button value="flex">
            固定
          </Radio.Button>
          <Radio.Button value="Grid" :disabled="formConfig.layout !== 'horizontal'">
            栅格
          </Radio.Button>
        </Radio.Group>
      </FormItem>
      <!-- </Row> -->
      <FormItem v-show="formConfig.labelLayout === 'flex'" label="标签宽度（px）">
        <InputNumber
          v-model:value="formConfig.labelWidth"
          :style="{ width: '100%' }"
          :min="0"
          :step="1"
        />
      </FormItem>
      <div v-if="formConfig.labelLayout === 'Grid'">
        <FormItem label="labelCol">
          <Slider v-model:value="formConfig.labelCol!.span" :max="24" />
        </FormItem>
        <FormItem label="wrapperCol">
          <Slider v-model:value="formConfig.wrapperCol!.span" :max="24" />
        </FormItem>

        <FormItem label="标签对齐">
          <Radio.Group v-model:value="formConfig.labelAlign" button-style="solid">
            <Radio.Button value="left">
              靠左
            </Radio.Button>
            <Radio.Button value="right">
              靠右
            </Radio.Button>
          </Radio.Group>
        </FormItem>

        <FormItem label="控件大小">
          <Radio.Group v-model:value="formConfig.size" button-style="solid">
            <Radio.Button value="default">
              默认
            </Radio.Button>
            <Radio.Button value="small">
              小
            </Radio.Button>
            <Radio.Button value="large">
              大
            </Radio.Button>
          </Radio.Group>
        </FormItem>
      </div>
      <FormItem label="表单属性">
        <Col>
          <Checkbox v-if="formConfig.layout === 'horizontal'" v-model:checked="formConfig.colon">
            label后面显示冒号
          </Checkbox>
        </Col>
        <Col>
          <Checkbox v-model:checked="formConfig.disabled">
            禁用
          </Checkbox>
        </Col>
        <Col>
          <Checkbox v-model:checked="formConfig.hideRequiredMark">
            隐藏必选标记
          </Checkbox>
        </Col>
      </FormItem>
    </Form>
  </div>
</template>
