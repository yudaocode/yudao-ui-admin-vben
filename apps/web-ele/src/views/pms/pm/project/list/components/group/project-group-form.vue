<script lang="ts" setup>
// TODO @AI（glm5.3 flash）：补充评审——useVbenForm/z 从 #/adapter/form 引入（对齐 system/user），PMS 多数 form 同问题，三端一并改。
import type { PmsProjectGroupApi } from '#/api/pms/pm/project/group';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createProjectGroup,
  updateProjectGroup,
} from '#/api/pms/pm/project/group';

import { useFormSchema } from './data';

defineOptions({ name: 'PmsProjectGroupForm' });
// TODO @AI：对齐 system/user，挪到 ./modules/form.vue；分组列表继续留在这层。

const emit = defineEmits(['success']); // 定义 success 事件，用于操作成功后的回调

const formData = ref<PmsProjectGroupApi.ProjectGroup>(); // 表单数据
const getTitle = computed(() => (formData.value?.id ? '修改' : '新增')); // 弹窗标题

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 92,
  },
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    const values = await formApi.getValues();
    // 分组名称提交前去除首尾空格
    const data: PmsProjectGroupApi.ProjectGroup = {
      id: formData.value?.id,
      name: values.name.trim(),
      sort: formData.value?.sort,
      type: formData.value?.type,
    };
    try {
      await (formData.value?.id
        ? updateProjectGroup(data)
        : createProjectGroup(data));
      await modalApi.close();
      emit('success');
      ElMessage.success(formData.value?.id ? '更新成功' : '创建成功');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    const data = modalApi.getData() as
      | PmsProjectGroupApi.ProjectGroup
      | undefined;
    formData.value = data;
    await formApi.setValues({ name: data?.name ?? '' });
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[520px]">
    <Form class="mx-4" />
  </Modal>
</template>
