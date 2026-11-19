<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { AiDramaAssetApi } from '#/api/ai/drama/asset';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createDramaVisualAsset,
  updateDramaVisualAsset,
} from '#/api/ai/drama/asset';

/** AI 短剧：道具表单；道具即类型为道具的视觉资产 */
defineOptions({ name: 'AiDramaPropForm' });

const props = defineProps<{
  projectId: number; // 项目编号
  sceneNos: number[]; // 当前分镜的镜头序号
}>();
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
      fieldName: 'title',
      label: '道具名称',
      component: 'Input',
      componentProps: {
        maxlength: 128,
        placeholder: '请输入道具名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'prompt',
      label: '出图提示词',
      component: 'Textarea',
      componentProps: {
        maxlength: 2000,
        rows: 4,
        placeholder: '请输入出图提示词',
      },
    },
    {
      fieldName: 'referenceImageUrl',
      label: '参考图',
      component: 'ImageUpload',
      componentProps: {
        maxSize: 10,
        showDescription: false,
        directory: 'ai/drama',
      },
    },
    {
      fieldName: 'shotNumbers',
      label: '出现的镜头',
      component: 'Select',
      componentProps: () => ({
        allowClear: true,
        mode: 'multiple',
        options: props.sceneNos.map((item) => ({
          label: `镜头 ${item}`,
          value: item,
        })),
        placeholder: '镜头未单独指定道具时，按这里关联',
      }),
    },
  ];
}

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 90,
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
      const data = (await formApi.getValues()) as AiDramaAssetApi.VisualAssetSaveReq;
      await (data.id
        ? updateDramaVisualAsset(data)
        : createDramaVisualAsset({ ...data, projectId: props.projectId }));
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
    const asset = modalApi.getData() as AiDramaAssetApi.VisualAsset | undefined;
    isUpdate.value = !!asset?.id;
    await formApi.resetForm();
    await formApi.setValues({
      id: asset?.id,
      title: asset?.title || '',
      prompt: asset?.prompt || '',
      referenceImageUrl: asset?.referenceImages?.referenceImageUrl || '',
      shotNumbers: [...(asset?.referenceImages?.shotNumbers || [])],
    });
  },
});

/** 打开：传入道具时为编辑 */
function open(asset?: AiDramaAssetApi.VisualAsset) {
  modalApi.setData(asset).open();
}
defineExpose({ open });
</script>

<template>
  <Modal :title="isUpdate ? '编辑道具' : '新增道具'" class="w-[560px]">
    <Form class="mx-4" />
  </Modal>
</template>
