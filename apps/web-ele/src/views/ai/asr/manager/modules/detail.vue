<script lang="ts" setup>
import type { AiAsrApi } from '#/api/ai/asr';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { getAsr } from '#/api/ai/asr';
import { useDescription } from '#/components/description';

import { useDetailSchema } from '../data';

/** AI 语音识别管理：详情弹窗；只查看，不提供重新识别 */
defineOptions({ name: 'AiAsrDetail' });

const detail = ref<AiAsrApi.Asr>(); // 详情数据

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
      const asr = await getAsr(data.id);
      if (seq !== loadSeq) {
        return;
      }
      // 打开期间被删除时，后端返回空
      if (!asr) {
        ElMessage.warning('识别记录不存在或已删除');
        await modalApi.close();
        return;
      }
      detail.value = asr;
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
      <template #audioUrl="{ data }">
        <audio
          v-if="data?.audioUrl"
          :src="data.audioUrl"
          controls
          class="w-full"
        ></audio>
        <span v-else>-</span>
      </template>
    </Descriptions>
  </Modal>
</template>
