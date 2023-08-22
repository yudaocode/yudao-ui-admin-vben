<script lang="ts" setup>
import { Divider } from 'ant-design-vue'
import { watch } from 'vue'
import { basicInfoSchemas } from './data'
import { BasicForm, useForm } from '@/components/Form'
import type { CodegenTableVO } from '@/api/infra/codegen/types'

const props = defineProps({
  basicInfo: {
    type: Object as PropType<Nullable<CodegenTableVO>>,
    default: () => null,
  },
})

const emit = defineEmits(['next'])

const [register, { setFieldsValue, resetFields, validate }] = useForm({
  labelWidth: 120,
  schemas: basicInfoSchemas,
  actionColOptions: {
    span: 14,
  },
  showResetButton: false,
  submitButtonOptions: {
    text: '保存',
  },
  submitFunc: customSubmitFunc,
})

async function customSubmitFunc() {
  try {
    const values = await validate()
    emit('next', values)
  }
  catch (error) {}
}

watch(
  () => props.basicInfo,
  (basicInfo) => {
    if (!basicInfo)
      return
    resetFields()
    setFieldsValue({ ...basicInfo })
  },
  {
    deep: true,
    immediate: true,
  },
)
</script>

<template>
  <div class="step1">
    <div class="step1-form">
      <BasicForm @register="register" />
    </div>
    <Divider />
    <h3>说明</h3>
    <h4>基本信息</h4>
    <p> 配置生成的基本信息 </p>

    <h4>生成信息</h4>
    <p> 配置生成生成的详细信息。 </p>
  </div>
</template>

<style lang="less" scoped>
.step1 {
  &-form {
    width: 80%;
    margin: 0 auto;
  }

  h3 {
    margin: 0 0 12px;
    font-size: 16px;
    line-height: 32px;
  }

  h4 {
    margin: 0 0 4px;
    font-size: 14px;
    line-height: 22px;
  }

}

.pay-select {
  width: 20%;
}

.pay-input {
  width: 70%;
}
</style>
