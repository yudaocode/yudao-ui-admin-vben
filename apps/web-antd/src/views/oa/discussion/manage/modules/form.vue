<script lang="ts" setup>
import type { OaDiscussionApi } from '#/api/oa/discussion';
import type { OaDiscussionVoteApi } from '#/api/oa/discussion/vote';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, Input, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createDiscussion,
  getDiscussion,
  updateDiscussion,
} from '#/api/oa/discussion';
import { ColorPicker } from '#/components/color-picker';
import { OA_DISCUSSION_TYPE } from '#/views/oa/utils/constants';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);

const formData = ref<OaDiscussionApi.Discussion>();
const isUpdate = computed(() => !!formData.value?.id); // 是否修改
const getTitle = computed(() => (isUpdate.value ? '修改讨论' : '发布讨论'));
const voteOptions = ref<OaDiscussionVoteApi.VoteOption[]>(
  createDefaultVoteOptions(),
); // 投票选项

/** 创建默认投票选项 */
function createDefaultVoteOptions(): OaDiscussionVoteApi.VoteOption[] {
  return [
    { title: '', color: '#409EFF', sort: 0 },
    { title: '', color: '#67C23A', sort: 1 },
  ];
}

/** 新增投票选项 */
function handleAddVoteOption() {
  voteOptions.value.push({
    title: '',
    color: '#409EFF',
    sort: voteOptions.value.length,
  });
}

/** 删除投票选项 */
function handleDeleteVoteOption(index: number) {
  voteOptions.value.splice(index, 1);
}

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 90,
  },
  wrapperClass: 'grid-cols-3',
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
    const values = (await formApi.getValues()) as OaDiscussionApi.Discussion;
    // 校验并整理投票选项
    if (values.type === OA_DISCUSSION_TYPE.VOTE) {
      if (
        voteOptions.value.length < 2 ||
        voteOptions.value.some((item) => !item.title.trim())
      ) {
        message.error('请至少填写两个投票选项');
        return;
      }
      if (Number(values.voteEndTime) <= Number(values.voteStartTime)) {
        message.error('投票结束时间必须晚于开始时间');
        return;
      }
      voteOptions.value.forEach((item, index) => (item.sort = index));
    }
    modalApi.lock();
    // 提交表单，非投票讨论不携带投票配置
    const data: OaDiscussionApi.Discussion = {
      ...values,
      id: formData.value?.id,
      voteMultiple:
        values.type === OA_DISCUSSION_TYPE.VOTE
          ? values.voteMultiple
          : undefined,
      voteStartTime:
        values.type === OA_DISCUSSION_TYPE.VOTE
          ? values.voteStartTime
          : undefined,
      voteEndTime:
        values.type === OA_DISCUSSION_TYPE.VOTE
          ? values.voteEndTime
          : undefined,
      voteOptions:
        values.type === OA_DISCUSSION_TYPE.VOTE ? voteOptions.value : [],
    };
    try {
      if (isUpdate.value) {
        await updateDiscussion(data);
      } else {
        await createDiscussion(data);
      }
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success(isUpdate.value ? '更新成功' : '发布成功');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData() as { id?: number };
    if (!data || !data.id) {
      voteOptions.value = createDefaultVoteOptions();
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getDiscussion(data.id);
      voteOptions.value =
        formData.value.voteOptions && formData.value.voteOptions.length > 0
          ? formData.value.voteOptions
          : createDefaultVoteOptions();
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-2/3">
    <Form class="mx-4">
      <template #voteOptions>
        <div class="w-full">
          <div
            v-for="(option, index) in voteOptions"
            :key="index"
            class="mb-2 flex items-center gap-2"
          >
            <Input
              v-model:value="option.title"
              :placeholder="`选项 ${index + 1}`"
              :maxlength="200"
              :disabled="isUpdate"
            />
            <ColorPicker v-model="option.color" :disabled="isUpdate" />
            <Button
              v-if="!isUpdate"
              danger
              type="link"
              :disabled="voteOptions.length <= 2"
              @click="handleDeleteVoteOption(index)"
            >
              删除
            </Button>
          </div>
          <Button v-if="!isUpdate" @click="handleAddVoteOption">
            <IconifyIcon icon="lucide:plus" class="mr-1" />
            新增选项
          </Button>
        </div>
      </template>
    </Form>
  </Modal>
</template>
