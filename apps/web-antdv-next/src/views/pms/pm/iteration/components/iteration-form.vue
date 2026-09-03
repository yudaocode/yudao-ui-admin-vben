<script lang="ts" setup>
import type { PmsIterationApi } from '#/api/pms/pm/iteration';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import {
  createIteration,
  getIteration,
  updateIteration,
} from '#/api/pms/pm/iteration';
import { getProjectMemberList } from '#/api/pms/pm/project/member';

import { useIterationFormSchema } from './data';

defineOptions({ name: 'PmsIterationForm' });

const emit = defineEmits(['success']); // 定义 success 事件，用于操作成功后的回调

const formLoading = ref(false); // 表单加载中
const formType = ref<'create' | 'update'>('create'); // 表单类型：create - 新增；update - 修改
const formData = ref<PmsIterationApi.Iteration>(); // 表单数据
const dialogTitle = computed(() =>
  formType.value === 'create' ? '新建迭代' : '编辑迭代',
); // 弹窗标题

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 92,
  },
  wrapperClass: 'grid-cols-2',
  layout: 'horizontal',
  schema: useIterationFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-[720px]',
  async onConfirm() {
    // 校验表单
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    const values = await formApi.getValues();
    if (
      values.startTime &&
      values.endTime &&
      Number(values.startTime) >= Number(values.endTime)
    ) {
      message.warning('迭代开始时间必须早于结束时间');
      return;
    }
    // 提交请求
    modalApi.lock();
    const data = {
      ...formData.value,
      ...values,
    } as PmsIterationApi.Iteration;
    try {
      if (formType.value === 'create') {
        await createIteration(data);
        message.success('创建成功');
      } else {
        await updateIteration(data);
        message.success('更新成功');
      }
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData() as {
      formType: 'create' | 'update';
      id?: number;
      projectId: number;
    };
    formType.value = data.formType;
    // 重置表单，新增时只携带项目编号
    formData.value = { projectId: data.projectId, name: '' };
    await formApi.reset();
    if (data.id) {
      formLoading.value = true;
      try {
        formData.value = await getIteration(data.id);
        await formApi.setValues(formData.value);
      } finally {
        formLoading.value = false;
      }
    }
    // 加载项目成员，更新负责人选项
    const memberList = await getProjectMemberList(data.projectId);
    formApi.updateSchema([
      {
        fieldName: 'ownerUserId',
        componentProps: {
          options: memberList.map((member) => ({
            label: member.nickname,
            value: member.userId,
          })),
        },
      },
    ]);
  },
});
</script>

<template>
  <Modal :title="dialogTitle">
    <Form v-loading="formLoading" class="mx-4" />
  </Modal>
</template>
