<script lang="ts" setup>
import type { AiOcrApi } from '#/api/ai/ocr';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElImage, ElMessage } from 'element-plus';

import { getOcr } from '#/api/ai/ocr';
import { useDescription } from '#/components/description';

import { useDetailSchema } from '../data';

/** AI 文字识别管理：详情弹窗；只查看，不提供重新识别 */
defineOptions({ name: 'AiOcrDetail' });

const detail = ref<AiOcrApi.Ocr>(); // 详情数据

const [Descriptions] = useDescription({
  border: true,
  column: 2,
  schema: useDetailSchema(),
});

let loadSeq = 0; // 加载序号：关闭或重新打开后，过期的响应不再回填

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      loadSeq++;
      modalApi.unlock(); // 关闭时解锁：过期的请求不再解锁，避免解掉新请求的锁
      detail.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData() as { id: number };
    if (!data || !data.id) {
      return;
    }
    const seq = ++loadSeq;
    modalApi.lock();
    try {
      const ocr = await getOcr(data.id);
      if (seq !== loadSeq) {
        return;
      }
      // 打开期间被删除时，后端返回空
      if (!ocr) {
        ElMessage.warning('识别记录不存在或已删除');
        await modalApi.close();
        return;
      }
      detail.value = ocr;
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
  <Modal
    title="识别详情"
    class="w-[900px]"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <Descriptions :data="detail">
      <template #imageUrl="{ data }">
        <ElImage
          v-if="data?.imageUrl"
          :src="data.imageUrl"
          :preview-src-list="[data.imageUrl]"
          preview-teleported
          fit="contain"
          class="max-h-[200px] max-w-full"
        />
        <span v-else>-</span>
      </template>
    </Descriptions>
  </Modal>
</template>
