<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { AiDramaAssetApi } from '#/api/ai/drama/asset';

import { computed, ref } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createDramaLocation,
  deleteDramaLocationCandidate,
  updateDramaLocation,
} from '#/api/ai/drama/asset';

import AssetImage from '../../../../components/asset-image.vue';

/** AI 短剧：场景表单 */
defineOptions({ name: 'AiDramaLocationForm' });

const props = defineProps<{
  locations: AiDramaAssetApi.Location[]; // 项目的场景：用于展示编辑中场景的最新候选图
  projectId: number; // 项目编号
}>();
const emit = defineEmits<{ success: [] }>();

const locationId = ref<number>(); // 编辑中的场景编号
const selectedIndex = ref<number>(); // 选用的候选图下标
const currentLocation = computed(() =>
  props.locations.find((item) => item.id === locationId.value),
);

/** 表单配置 */
function useFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '场景名称',
      component: 'Input',
      componentProps: {
        maxlength: 64,
        placeholder: '请输入场景名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'description',
      label: '场景设定',
      component: 'Textarea',
      componentProps: {
        maxlength: 2000,
        rows: 3,
        placeholder: '请输入场景设定',
      },
    },
    {
      fieldName: 'availableSlots',
      label: '可站位置',
      component: 'Select',
      componentProps: {
        allowClear: true,
        mode: 'tags',
        placeholder: '例如：门口、窗边；输入后回车添加',
      },
    },
    {
      fieldName: 'crowd',
      label: '有群演',
      component: 'Switch',
      modelPropName: 'checked',
    },
    {
      fieldName: 'crowdDescription',
      label: '群演描述',
      component: 'Input',
      componentProps: {
        maxlength: 500,
        placeholder: '人数、服饰、位置、姿态',
      },
      dependencies: {
        triggerFields: ['crowd'],
        show: (values) => !!values.crowd,
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
      const data = {
        ...(await formApi.getValues()),
        id: locationId.value,
        selectedIndex: selectedIndex.value,
      } as AiDramaAssetApi.LocationSaveReq;
      await (data.id
        ? updateDramaLocation(data)
        : createDramaLocation({ ...data, projectId: props.projectId }));
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
    const location = modalApi.getData() as AiDramaAssetApi.Location | undefined;
    locationId.value = location?.id;
    selectedIndex.value = location?.selectedIndex;
    await formApi.resetForm();
    await formApi.setValues({
      name: location?.name || '',
      description: location?.description || '',
      crowd: !!location?.crowd,
      crowdDescription: location?.crowdDescription || '',
      availableSlots: [...(location?.availableSlots || [])],
      referenceImageUrl: location?.referenceImageUrl || '',
    });
  },
});

/** 打开：传入场景时为编辑 */
function open(location?: AiDramaAssetApi.Location) {
  modalApi.setData(location).open();
}
defineExpose({ open });

/** 删除一张候选图：删除前的候选图记为上一版，可撤销 */
async function handleDeleteCandidate(index: number) {
  try {
    await confirm('删除这张候选图后，可通过「撤销」恢复，是否继续？');
  } catch {
    return;
  }
  await deleteDramaLocationCandidate(locationId.value!, index);
  selectedIndex.value = undefined;
  message.success('删除成功');
  emit('success');
}
</script>

<template>
  <Modal
    :title="locationId ? '编辑场景' : '新增场景'"
    class="w-[600px]"
  >
    <Form class="mx-4" />
    <div v-if="currentLocation?.imageUrls?.length" class="mx-4 flex">
      <div class="w-[90px] shrink-0 pr-3 text-right text-sm">选用候选</div>
      <div class="flex flex-wrap gap-2">
        <div
          v-for="(url, index) in currentLocation.imageUrls"
          :key="url + index"
          class="relative cursor-pointer rounded-md p-0.5"
          :class="
            selectedIndex === index ? 'outline-primary outline outline-2' : ''
          "
          @click="selectedIndex = index"
        >
          <AssetImage :url="url" size="80px" />
          <IconifyIcon
            icon="lucide:circle-x"
            class="text-destructive absolute right-1 top-1 size-4"
            @click.stop="handleDeleteCandidate(index)"
          />
        </div>
      </div>
    </div>
  </Modal>
</template>
