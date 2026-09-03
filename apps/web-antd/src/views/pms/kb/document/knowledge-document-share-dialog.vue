<script lang="ts" setup>
import type { PmsKnowledgeDocumentShareApi } from '#/api/pms/kb/interaction/share';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, Input, message, Popconfirm } from 'ant-design-vue';

import {
  closeKnowledgeDocumentShare,
  getKnowledgeDocumentShare,
  openKnowledgeDocumentShare,
  updateKnowledgeDocumentShareMemberList,
} from '#/api/pms/kb/interaction/share';
import { Qrcode } from '#/components/qrcode';
import { UserSelect } from '#/views/system/user/components';

defineOptions({ name: 'PmsKnowledgeDocumentShareDialog' });

// TODO @AI：分享成员等字段尽量走 schema；底部按钮对齐 system user 用 Modal footer/onConfirm，不要手写取消。打开方式用 connectedComponent + setData，不要 defineExpose({ open })。
const formLoading = ref(false); // 表单提交中
const documentId = ref<number>(); // 文档编号
const share = ref<PmsKnowledgeDocumentShareApi.KnowledgeDocumentShare>(); // 文档分享信息
const shareUserIds = ref<number[]>([]); // 分享成员用户编号
const qrCodeDataUrl = ref(''); // 分享二维码图片数据

const shareUrl = computed(() => {
  if (!share.value) {
    return '';
  }
  return `${window.location.origin}/pms/kb/document/share/${share.value.token}`;
}); // 文档分享地址

/** 创建文档分享 */
async function submitShare() {
  if (!documentId.value) {
    return;
  }
  formLoading.value = true;
  try {
    if (share.value) {
      await updateKnowledgeDocumentShareMemberList({
        documentId: documentId.value,
        shareUserIds: shareUserIds.value,
      });
      message.success('分享成员已更新');
      await modalApi.close();
    } else {
      share.value = await openKnowledgeDocumentShare({
        documentId: documentId.value,
        shareUserIds: shareUserIds.value,
      });
      message.success('分享已开启');
    }
  } finally {
    formLoading.value = false;
  }
}

/** 关闭文档分享 */
async function closeShare() {
  if (!documentId.value) {
    return;
  }
  formLoading.value = true;
  try {
    await closeKnowledgeDocumentShare(documentId.value);
    share.value = undefined;
    shareUserIds.value = [];
    qrCodeDataUrl.value = '';
    message.success('分享已关闭');
    await modalApi.close();
  } finally {
    formLoading.value = false;
  }
}

/** 记录公共二维码组件生成的图片数据，供下载使用 */
function handleQrCodeDone(dataUrl: string) {
  qrCodeDataUrl.value = dataUrl;
}

/** 下载公开分享二维码 */
function downloadQrCode() {
  if (!qrCodeDataUrl.value) {
    return;
  }
  const link = document.createElement('a');
  link.href = qrCodeDataUrl.value;
  link.download = 'knowledge-document-share.png';
  link.click();
}

/** 复制分享链接 */
async function copyShareUrl() {
  await navigator.clipboard.writeText(shareUrl.value);
  message.success('链接已复制');
}

const [Modal, modalApi] = useVbenModal({
  class: 'w-[600px]',
  footer: false,
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData() as { id: number };
    documentId.value = data.id;
    qrCodeDataUrl.value = '';
    formLoading.value = true;
    try {
      share.value = await getKnowledgeDocumentShare(data.id);
      shareUserIds.value = share.value?.shareUserIds || [];
    } finally {
      formLoading.value = false;
    }
  },
});

/** 打开弹窗 */
defineExpose({
  open: (id: number) => {
    modalApi.setData({ id }).open();
  },
});
</script>

<template>
  <Modal title="分享文档">
    <div class="mb-4 flex items-start gap-3">
      <span class="w-[100px] shrink-0 pt-1 text-right">公开链接</span>
      <div v-if="share" class="flex w-full gap-2">
        <Input :value="shareUrl" readonly />
        <Button @click="copyShareUrl">复制链接</Button>
      </div>
      <span v-else class="text-muted-foreground">
        开启后，任何获得链接的人都可以查看当前文档。
      </span>
    </div>
    <div v-if="share" class="mb-4 flex items-start gap-3">
      <span class="w-[100px] shrink-0 pt-1 text-right">二维码</span>
      <div class="flex items-center gap-3">
        <Qrcode :text="shareUrl" :width="160" @done="handleQrCodeDone" />
        <Button :disabled="!qrCodeDataUrl" @click="downloadQrCode">
          下载二维码
        </Button>
      </div>
    </div>
    <div class="mb-4 flex items-start gap-3">
      <span class="w-[100px] shrink-0 pt-1 text-right">分享给成员</span>
      <UserSelect
        v-model="shareUserIds"
        :multiple="true"
        class="!w-full"
        placeholder="请选择内部分享成员"
      />
    </div>
    <div class="flex justify-end gap-2">
      <Popconfirm
        v-if="share"
        cancel-text="取消"
        ok-text="确定"
        title="关闭后，现有公开链接将立即失效。是否继续？"
        @confirm="closeShare"
      >
        <Button :disabled="formLoading" danger>关闭分享</Button>
      </Popconfirm>
      <Button :disabled="formLoading" type="primary" @click="submitShare">
        {{ share ? '保存成员' : '开启分享' }}
      </Button>
      <Button @click="modalApi.close()">取 消</Button>
    </div>
  </Modal>
</template>
