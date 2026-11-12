<script lang="ts" setup>
import type { AiPptApi } from '#/api/ai/ppt';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { AiPptModeEnum, AiPptSourceEnum } from '@vben/constants';

import { Empty, Spin } from 'antdv-next';

import { getPpt, getPptMy } from '#/api/ai/ppt';
import { formatPptLanguage } from '#/views/ai/utils/format';

/** AI PPT：查看大纲弹窗（素材 + 分镜），只读 */
defineOptions({ name: 'AiPptOutlineModal' });

const loading = ref(false); // 弹窗的加载中
const ppt = ref<AiPptApi.Ppt>(); // PPT 详情
const slides = computed<AiPptApi.Slide[]>(() => ppt.value?.slides || []); // 分镜列表
const getTitle = computed(() =>
  ppt.value ? `查看大纲 · ${ppt.value.title}` : '查看大纲',
);
let requestId = 0; // 请求序号：只采用最后一次打开的结果，避免先打开的详情迟到后覆盖

const [Modal, modalApi] = useVbenModal({
  showConfirmButton: false,
  cancelText: '关 闭',
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      ppt.value = undefined;
      return;
    }
    // 管理端（readonly）使用管理端的详情接口
    const data = modalApi.getData() as { id: number; readonly?: boolean };
    if (!data?.id) {
      return;
    }
    const currentRequestId = ++requestId;
    loading.value = true;
    try {
      const result = data.readonly
        ? await getPpt(data.id)
        : await getPptMy(data.id);
      if (currentRequestId === requestId) {
        ppt.value = result;
      }
    } finally {
      if (currentRequestId === requestId) {
        loading.value = false;
      }
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[800px]">
    <Spin :spinning="loading">
      <div class="max-h-[65vh] min-h-[200px] overflow-y-auto pr-1">
        <template v-if="ppt">
          <!-- 素材 -->
          <div class="mb-2 flex items-center justify-between">
            <span class="font-bold">素材</span>
            <span class="text-xs text-gray-500">
              来源：{{
                ppt.source === AiPptSourceEnum.UPLOAD ? '上传材料' : '粘贴大纲'
              }}
              ·
              {{
                ppt.mode === AiPptModeEnum.SLIDES
                  ? '演示用幻灯片'
                  : '详细演示文稿'
              }}
              · {{ formatPptLanguage(ppt.language) }} · {{ ppt.pageCount }} 页
            </span>
          </div>
          <div
            class="max-h-[240px] overflow-y-auto whitespace-pre-wrap break-all rounded-md bg-gray-50 p-2.5 text-[13px] leading-5 dark:bg-gray-800"
          >
            {{ ppt.content || '（材料尚未读取）' }}
          </div>
          <div
            v-if="ppt.source === AiPptSourceEnum.UPLOAD"
            class="mt-1 text-xs text-gray-500"
          >
            上传材料时为读取出的文本，超过 25000 字的部分已截断
          </div>

          <!-- 分镜 -->
          <div class="mb-2 mt-4 font-bold">
            分镜（共 {{ slides.length }} 页）
          </div>
          <Empty v-if="slides.length === 0" description="还没有分镜" />
          <div
            v-for="slide in slides"
            :key="slide.index"
            class="mb-2 flex gap-2.5 rounded-md border border-solid border-border p-2.5"
          >
            <span
              class="flex size-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs text-primary"
            >
              {{ slide.index }}
            </span>
            <div class="min-w-0 flex-1 text-[13px] leading-5">
              <div class="font-medium">
                <span v-if="slide.theme" class="text-gray-500">
                  {{ slide.theme }} ·
                </span>
                {{ slide.title || '-' }}
              </div>
              <ul
                v-if="slide.points?.length"
                class="m-0 mt-1 list-disc pl-[18px]"
              >
                <li v-for="(point, index) in slide.points" :key="index">
                  {{ point }}
                </li>
              </ul>
            </div>
          </div>
          <div class="mt-2 text-xs text-gray-500">
            说明：标题和要点只是分镜记录；幻灯片上真正显示的文字画在整页图里。
          </div>
        </template>
      </div>
    </Spin>
  </Modal>
</template>
