<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { AiDramaAssetApi } from '#/api/ai/drama/asset';
import type { AiDramaProjectApi } from '#/api/ai/drama/project';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { AiDramaAudioTypeEnum } from '@vben/constants';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { createDramaAudio, updateDramaAudio } from '#/api/ai/drama/asset';

/** AI 短剧：配乐、参考音频表单 */
defineOptions({ name: 'AiDramaAudioForm' });

const props = defineProps<{ detail: AiDramaProjectApi.ProjectDetail }>();
const emit = defineEmits<{ success: [] }>();

const isUpdate = ref(false); // 是否编辑

/** 表单配置 */
function useFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'type',
      label: '类型',
      component: 'RadioGroup',
      componentProps: {
        options: [
          { label: '配乐', value: AiDramaAudioTypeEnum.BGM },
          { label: '参考音频', value: AiDramaAudioTypeEnum.REFERENCE },
        ],
      },
      defaultValue: AiDramaAudioTypeEnum.BGM,
      dependencies: {
        triggerFields: ['id'],
        disabled: (values) => !!values.id,
      },
      rules: 'required',
    },
    {
      fieldName: 'name',
      label: '名称',
      component: 'Input',
      componentProps: {
        maxlength: 64,
        placeholder: '请输入名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'fileUrl',
      label: '音频文件',
      component: 'FileUpload',
      componentProps: {
        accept: ['mp3', 'wav', 'm4a'],
        maxSize: 20,
        maxNumber: 1,
        directory: 'ai/drama',
      },
      dependencies: {
        triggerFields: ['id'],
        show: (values) => !values.id,
        rules: (values) => (values.id ? null : 'required'),
      },
    },
    {
      fieldName: 'storyboardIds',
      label: '使用的镜头',
      component: 'Select',
      componentProps: () => ({
        allowClear: true,
        mode: 'multiple',
        options: props.detail.storyboards.map((item) => ({
          label: `#${item.sceneNo} ${item.title || '未命名镜头'}`,
          value: item.id,
        })),
        placeholder: '为空表示候选，暂不使用',
      }),
    },
    {
      fieldName: 'volume',
      label: '音量',
      component: 'InputNumber',
      componentProps: {
        min: 0,
        max: 2,
        step: 0.1,
        precision: 2,
      },
      dependencies: {
        triggerFields: ['id'],
        show: (values) => !!values.id,
      },
    },
    {
      fieldName: 'startOffset',
      label: '起始偏移（秒）',
      component: 'InputNumber',
      componentProps: {
        min: 0,
        step: 0.5,
        precision: 1,
      },
      dependencies: {
        triggerFields: ['id'],
        show: (values) => !!values.id,
      },
    },
  ];
}

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 110,
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
    try {
      const values = (await formApi.getValues()) as Partial<
        AiDramaAssetApi.Audio
      >;
      await (values.id
        ? updateDramaAudio({
            id: values.id,
            name: values.name,
            storyboardIds: values.storyboardIds,
            volume: values.volume,
            startOffset: values.startOffset,
          })
        : createDramaAudio({
            projectId: props.detail.project.id,
            type: values.type!,
            name: values.name,
            fileUrl: values.fileUrl!,
            storyboardIds: values.storyboardIds,
          }));
      message.success('保存成功');
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
    const audio = modalApi.getData() as AiDramaAssetApi.Audio | undefined;
    isUpdate.value = !!audio?.id;
    await formApi.resetForm();
    await formApi.setValues({
      id: audio?.id,
      type: audio?.type ?? AiDramaAudioTypeEnum.BGM,
      name: audio?.name || '',
      fileUrl: audio?.fileUrl || '',
      storyboardIds: [...(audio?.storyboardIds || [])],
      volume: audio ? (audio.volume ?? 0.12) : 1, // 未设置时，合成按默认音量 0.12 混入
      startOffset: audio?.startOffset ?? 0,
    });
  },
});

/** 打开：传入音频时为编辑 */
function open(audio?: AiDramaAssetApi.Audio) {
  modalApi.setData(audio).open();
}
defineExpose({ open });
</script>

<template>
  <Modal :title="isUpdate ? '编辑音频' : '新增音频'" class="w-[600px]">
    <Form class="mx-4" />
  </Modal>
</template>
