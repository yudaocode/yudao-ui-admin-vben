<!--
 * @Description: 右侧属性面板控件 表单属性面板
-->
<script lang="ts" setup>
import { computed } from 'vue'
import type { RadioChangeEvent } from 'ant-design-vue'
import {
  Checkbox,
  Col,
  FormItem,
  InputNumber,
  Slider,
  RadioGroup,
  RadioButton
} from 'ant-design-vue'
import { useFormDesignState } from '../../../hooks/useFormDesignState'

defineOptions({ name: 'FormProps' })

const { formConfig } = useFormDesignState()

formConfig.value = formConfig.value || {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 },
}

function labelLayoutChange(e: RadioChangeEvent) {
  if (e.target.value === 'Grid')
    formConfig.value.layout = 'horizontal'
}

const sliderSpan = computed(() => {
  if (formConfig.value.labelLayout)
    return Number(formConfig.value.labelCol!.span)

  return 0
})
</script>

<template>
  <div class="properties-content">
    <aForm class="properties-body" label-align="left" layout="vertical">
      <!--      <e-upload v-model="fileList"></e-upload> -->

      <FormItem label="表单布局">
        <RadioGroup v-model:value="formConfig.layout" button-style="solid">
          <RadioButton value="horizontal">
            水平
          </RadioButton>
          <RadioButton value="vertical" :disabled="formConfig.labelLayout === 'Grid'">
            垂直
          </RadioButton>
          <RadioButton value="inline" :disabled="formConfig.labelLayout === 'Grid'">
            行内
          </RadioButton>
        </RadioGroup>
      </FormItem>

      <!-- <Row> -->
      <FormItem label="标签布局">
        <RadioGroup
          v-model:value="formConfig.labelLayout"
          button-style="solid"
          @change="labelLayoutChange"
        >
          <RadioButton value="flex">
            固定
          </RadioButton>
          <RadioButton value="Grid" :disabled="formConfig.layout !== 'horizontal'">
            栅格
          </RadioButton>
        </RadioGroup>
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
          <Slider v-model:value="sliderSpan" :max="24" />
        </FormItem>
        <FormItem label="wrapperCol">
          <Slider v-model:value="sliderSpan" :max="24" />
        </FormItem>

        <FormItem label="标签对齐">
          <RadioGroup v-model:value="formConfig.labelAlign" button-style="solid">
            <RadioButton value="left">
              靠左
            </RadioButton>
            <RadioButton value="right">
              靠右
            </RadioButton>
          </RadioGroup>
        </FormItem>

        <FormItem label="控件大小">
          <RadioGroup v-model:value="formConfig.size" button-style="solid">
            <RadioButton value="default">
              默认
            </RadioButton>
            <RadioButton value="small">
              小
            </RadioButton>
            <RadioButton value="large">
              大
            </RadioButton>
          </RadioGroup>
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
    </aForm>
  </div>
</template>
