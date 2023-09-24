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
  <div>
    <div class="mx-auto my-0 w-80%">
      <BasicForm @register="register" />
    </div>
    <Divider />
    <h3 class="mb-3 text-base">
      说明
    </h3>
    <h4 class="mb-1 text-sm">
      基本信息
    </h4>
    <p> 配置生成的基本信息 </p>

    <h4>生成信息</h4>
    <p> 配置生成生成的详细信息。 </p>
  </div>
</template>
