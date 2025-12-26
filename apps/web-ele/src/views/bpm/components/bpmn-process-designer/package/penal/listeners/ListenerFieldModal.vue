<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElForm, ElFormItem, ElInput, ElOption, ElSelect } from 'element-plus';

import { fieldType } from './utilSelf';

defineOptions({ name: 'ListenerFieldModal' });

const emit = defineEmits<{
  confirm: [data: any];
}>();

const fieldTypeObject = ref(fieldType);
const form = ref<any>({});
const formRef = ref();

const [Modal, modalApi] = useVbenModal({
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<any>();
      form.value = data || {};
      // clear validate
      setTimeout(() => {
        formRef.value?.clearValidate();
      }, 50);
    }
  },
  onConfirm: async () => {
    try {
      await formRef.value?.validate();
      emit('confirm', { ...form.value });
      await modalApi.close();
    } catch {
      // validate failed
    }
  },
});
</script>

<template>
  <Modal title="字段配置" class="w-3/5">
    <ElForm ref="formRef" :model="form" label-width="80px">
      <ElFormItem
        label="字段名称："
        prop="name"
        :rules="[
          {
            required: true,
            message: '请填写字段名称',
            trigger: ['blur', 'change'],
          },
        ]"
      >
        <ElInput v-model="form.name" clearable />
      </ElFormItem>
      <ElFormItem
        label="字段类型："
        prop="fieldType"
        :rules="[
          {
            required: true,
            message: '请选择字段类型',
            trigger: ['blur', 'change'],
          },
        ]"
      >
        <ElSelect v-model="form.fieldType">
          <ElOption
            v-for="i in Object.keys(fieldTypeObject)"
            :key="i"
            :value="i"
            :label="fieldTypeObject[i as keyof typeof fieldType]"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem
        v-if="form.fieldType === 'string'"
        label="字段值："
        prop="string"
        key="field-string"
        :rules="[
          {
            required: true,
            message: '请填写字段值',
            trigger: ['blur', 'change'],
          },
        ]"
      >
        <ElInput v-model="form.string" clearable />
      </ElFormItem>
      <ElFormItem
        v-if="form.fieldType === 'expression'"
        label="表达式："
        prop="expression"
        key="field-expression"
        :rules="[
          {
            required: true,
            message: '请填写表达式',
            trigger: ['blur', 'change'],
          },
        ]"
      >
        <ElInput v-model="form.expression" clearable />
      </ElFormItem>
    </ElForm>
  </Modal>
</template>
