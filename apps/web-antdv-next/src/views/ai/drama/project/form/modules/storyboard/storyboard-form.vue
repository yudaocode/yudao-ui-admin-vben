<script lang="ts" setup>
import type { AiDramaProjectApi } from '#/api/ai/drama/project';
import type { AiDramaStoryboardApi } from '#/api/ai/drama/storyboard';

import { nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import {
  createDramaStoryboard,
  updateDramaStoryboard,
} from '#/api/ai/drama/storyboard';

import StoryboardFields from './storyboard-fields.vue';

/** AI 短剧：新增 / 编辑分镜；字段与单镜编辑区共用 */
defineOptions({ name: 'AiDramaStoryboardForm' });

defineProps<{ detail: AiDramaProjectApi.ProjectDetail }>();
const emit = defineEmits<{ success: [id: number] }>();

const editing = ref(false); // 是否编辑：否则为新增
const fieldsRef = ref<InstanceType<typeof StoryboardFields>>(); // 编辑字段 Ref

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const data = fieldsRef.value!.buildData();
    modalApi.lock();
    try {
      let id = data.id;
      if (id) {
        await updateDramaStoryboard(data);
      } else {
        id = await createDramaStoryboard(data);
      }
      message.success('保存成功');
      await modalApi.close();
      emit('success', id!);
    } finally {
      modalApi.unlock();
    }
  },
});

/** 打开表单：编辑时复制一份分镜，修改不影响列表；新增时默认排在最后 */
async function open(
  storyboard?: AiDramaStoryboardApi.Storyboard,
  defaultSceneNo?: number,
) {
  editing.value = !!storyboard;
  modalApi.open();
  // 弹窗内容渲染后再加载字段
  for (let i = 0; i < 10 && !fieldsRef.value; i++) {
    await nextTick();
  }
  fieldsRef.value?.load(storyboard);
  if (!storyboard && defaultSceneNo && fieldsRef.value) {
    fieldsRef.value.getState().formData.sceneNo = defaultSceneNo;
  }
}
defineExpose({ open });
</script>

<template>
  <Modal :title="editing ? '编辑镜头' : '新增镜头'" class="w-[820px]">
    <StoryboardFields ref="fieldsRef" :detail="detail" />
  </Modal>
</template>
