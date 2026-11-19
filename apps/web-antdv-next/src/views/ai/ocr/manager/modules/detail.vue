<script lang="ts" setup>
import type { AiOcrApi } from '#/api/ai/ocr';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { getOcr } from '#/api/ai/ocr';
import { useDescription } from '#/components/description';

import { useDetailSchema } from '../data';

/** AI 文字识别管理：详情弹窗；只查看，不提供重新识别 */
defineOptions({ name: 'AiOcrDetail' });

const formData = ref<AiOcrApi.Ocr>(); // 详情数据

const [Descriptions] = useDescription({
  bordered: true,
  column: 2,
  schema: useDetailSchema(),
});

let loadSeq = 0; // 加载序号：关闭、重新打开后，作废进行中的请求

const [Modal, modalApi] = useVbenModal({
  showConfirmButton: false,
  cancelText: '关 闭',
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      loadSeq++;
      modalApi.unlock(); // 关闭时解锁：过期的请求不再解锁，避免解掉新请求的锁
      formData.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData() as { id: number };
    if (!data?.id) {
      return;
    }
    const seq = ++loadSeq;
    modalApi.lock();
    try {
      const ocr = await getOcr(data.id);
      // 已关闭或已重新打开：不回填
      if (seq !== loadSeq) {
        return;
      }
      // 打开期间被删除时，后端返回空
      if (!ocr) {
        message.warning('识别记录不存在或已删除');
        await modalApi.close();
        return;
      }
      formData.value = ocr;
    } catch {
      // 失败提示由请求拦截器负责，不留空弹窗
      if (seq === loadSeq) {
        await modalApi.close();
      }
    } finally {
      if (seq === loadSeq) {
        modalApi.unlock();
      }
    }
  },
});
</script>

<template>
  <Modal title="识别详情" class="w-[900px]">
    <Descriptions v-if="formData" :data="formData" />
  </Modal>
</template>
