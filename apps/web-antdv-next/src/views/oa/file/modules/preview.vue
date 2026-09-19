<script lang="ts" setup>
import type { OaFileNodeApi } from '#/api/oa/file/node';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { getFileNode } from '#/api/oa/file/node';
import { FilePreview } from '#/components/file-preview';

defineOptions({ name: 'OaFilePreview' });

const fileId = ref<number>(); // 文件编号
const fileName = ref(''); // 文件名称
const fileType = ref(''); // 文件扩展名
const fileUrl = ref(''); // 后端授权的临时文件地址

/** 下载当前文件 */
async function handleDownload() {
  if (!fileUrl.value) {
    return;
  }
  // 下载时重新查询详情，避免沿用已过期的临时地址或已撤销的共享权限
  const data = await getFileNode(fileId.value!);
  if (!data.url) {
    message.warning('当前文件不可下载');
    return;
  }
  window.open(data.url, '_blank', 'noopener,noreferrer');
}

const [Modal, modalApi] = useVbenModal({
  confirmText: '下载',
  cancelText: '关闭',
  async onConfirm() {
    await handleDownload();
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      fileUrl.value = '';
      return;
    }
    const row = modalApi.getData() as OaFileNodeApi.FileNode;
    fileId.value = row.id;
    fileName.value = row.name;
    fileType.value = row.extension || '';
    fileUrl.value = '';
    modalApi.lock();
    try {
      const data = await getFileNode(row.id!);
      if (!data.url) {
        message.warning('当前文件不可预览或下载');
        await modalApi.close();
        return;
      }
      fileName.value = data.name;
      fileType.value = data.extension || '';
      fileUrl.value = data.url;
    } catch {
      // 请求失败由公共请求拦截器提示，关闭未能加载的预览弹窗
      await modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="fileName" class="w-[900px]">
    <!-- 获得后端授权地址后预览，关闭弹窗时卸载媒体内容 -->
    <div class="min-h-[360px]">
      <FilePreview
        v-if="fileUrl"
        :url="fileUrl"
        :file-name="fileName"
        :file-type="fileType"
        :downloadable="true"
      />
    </div>
  </Modal>
</template>
