<script lang="ts" setup>
import { ref } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';

import { buildUReportUrl } from '../data';

/** UReport2 设计器、预览弹窗 */
defineOptions({ name: 'UReportFrame' });

const emit = defineEmits(['success']);

const frameType = ref<'design' | 'preview'>('design'); // 弹窗的类型：design - 新建、设计；preview - 预览
const title = ref(''); // 弹窗的标题
const src = ref(''); // iframe 地址

const [Modal, modalApi] = useVbenModal({
  footer: false,
  fullscreen: true,
  fullscreenButton: false,
  /** 关闭前：设计器中未保存的内容会丢失，所以需要二次确认 */
  async onBeforeClose() {
    if (frameType.value !== 'design') {
      return true;
    }
    try {
      await confirm({
        content: '关闭后，设计器中未保存的内容将丢失，是否确认关闭？',
        title: '关闭设计器',
      });
      return true;
    } catch {
      return false;
    }
  },
  onOpenChange(isOpen: boolean) {
    // 关闭后：刷新列表，展示设计器中保存的模板
    if (!isOpen) {
      src.value = '';
      if (frameType.value === 'design') {
        emit('success');
      }
      return;
    }
    const data = modalApi.getData() as {
      name?: string;
      type: 'design' | 'preview';
    };
    frameType.value = data.type;
    if (data.type === 'preview') {
      title.value = `预览：${data.name}`;
      src.value = buildUReportUrl('preview', data.name);
    } else {
      title.value = data.name ? `设计：${data.name}` : '新建报表';
      src.value = buildUReportUrl('designer', data.name);
    }
  },
});
</script>

<template>
  <Modal :close-on-click-modal="false" :title="title">
    <iframe
      v-if="src"
      :src="src"
      class="block h-[calc(100vh-90px)] w-full border-none"
      allowfullscreen
    ></iframe>
  </Modal>
</template>
