<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button } from 'antdv-next';

defineOptions({ name: 'FmsPrintPreview' });

const title = ref(''); // 打印预览标题
const html = ref(''); // 待预览的 HTML
const previewIframeRef = ref<HTMLIFrameElement>(); // 打印预览 iframe

const [Modal, modalApi] = useVbenModal({
  footer: false,
  fullscreen: true,
  fullscreenButton: false,
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData<{ html: string; title: string }>();
    title.value = data?.title ?? '';
    html.value = data?.html ?? '';
  },
});

/** 调用 iframe 的浏览器打印能力 */
function print() {
  previewIframeRef.value?.contentWindow?.print();
}
</script>

<template>
  <Modal :close-on-click-modal="false" :title="title">
    <div class="flex justify-end gap-2 pb-3">
      <Button type="primary" @click="print">打印</Button>
      <Button @click="modalApi.close()">关闭</Button>
    </div>
    <iframe
      ref="previewIframeRef"
      :srcdoc="html"
      class="border-border h-[calc(100vh-118px)] w-full border border-solid bg-[#eef0f3]"
    ></iframe>
  </Modal>
</template>
