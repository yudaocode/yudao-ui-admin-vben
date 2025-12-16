<script lang="ts" setup>
import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElForm, ElFormItem, ElInput } from 'element-plus';

defineOptions({ name: 'SignalMessageModal' });

const emit = defineEmits<{
  confirm: [data: { id: string; name: string }];
}>();

const formRef = ref();
const form = ref<{ id: string; name: string }>({ id: '', name: '' });
const modelType = ref<'message' | 'signal'>('message');
const isEdit = ref(false);

const config = computed(() => {
  return modelType.value === 'message'
    ? {
        title: isEdit.value ? '编辑消息' : '创建消息',
        idLabel: '消息 ID',
        nameLabel: '消息名称',
      }
    : {
        title: isEdit.value ? '编辑信号' : '创建信号',
        idLabel: '信号 ID',
        nameLabel: '信号名称',
      };
});

const [Modal, modalApi] = useVbenModal({
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<{
        id?: string;
        isEdit?: boolean;
        name?: string;
        type: 'message' | 'signal';
      }>();
      modelType.value = data?.type || 'message';
      isEdit.value = data?.isEdit || false;
      form.value = {
        id: data?.id || '',
        name: data?.name || '',
      };
      // 清除校验
      setTimeout(() => {
        formRef.value?.clearValidate();
      }, 50);
    }
  },
  async onConfirm() {
    try {
      await formRef.value?.validate();
      emit('confirm', { ...form.value });
      modalApi.close();
    } catch {
      // 校验未通过
    }
  },
});
</script>

<template>
  <Modal :title="config.title" class="w-3/5">
    <ElForm ref="formRef" :model="form" label-width="80px">
      <ElFormItem
        :label="config.idLabel"
        prop="id"
        :rules="[{ required: true, message: '请输入 ID' }]"
      >
        <ElInput v-model="form.id" clearable />
      </ElFormItem>
      <ElFormItem
        :label="config.nameLabel"
        prop="name"
        :rules="[{ required: true, message: '请输入名称' }]"
      >
        <ElInput v-model="form.name" clearable />
      </ElFormItem>
    </ElForm>
  </Modal>
</template>
