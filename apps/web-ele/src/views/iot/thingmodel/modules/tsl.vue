<script lang="ts" setup>
import type { Ref } from 'vue';

import type { IotProductApi } from '#/api/iot/product/product';

import { computed, inject, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElInput, ElRadioButton, ElRadioGroup } from 'element-plus';

import { getThingModelTSL } from '#/api/iot/thingmodel';
import { IOT_PROVIDE_KEY } from '#/views/iot/utils/constants';

const product = inject<Ref<IotProductApi.Product>>(IOT_PROVIDE_KEY.PRODUCT);

const viewMode = ref<'editor' | 'view'>('view');
const thingModelTSL = ref<any>({});
const tslString = ref('');

// TODO @AI：这里的注释风格，对齐 system user form 里；（代码段里的。）
const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    modalApi.lock();
    try {
      thingModelTSL.value = await getThingModelTSL(product?.value?.id || 0);
      tslString.value = JSON.stringify(thingModelTSL.value, null, 2);
    } finally {
      modalApi.unlock();
    }
  },
});

/** 只读视图下，格式化后的 TSL 字符串 */
const formattedTSL = computed(() =>
  JSON.stringify(thingModelTSL.value, null, 2),
);

/** 编辑器内容变化时，同步到数据对象 */
watch(tslString, (newValue) => {
  // TODO @AI：这里是不是不用 try catch？也关注下，antd 那
  try {
    thingModelTSL.value = JSON.parse(newValue);
  } catch {
    // JSON 解析失败时保持原值
  }
});
</script>

<template>
  <Modal :footer="false" class="w-3/5" title="物模型 TSL">
    <div class="mx-4">
      <div class="mb-4">
        <ElRadioGroup v-model="viewMode" size="small">
          <ElRadioButton value="view">代码视图</ElRadioButton>
          <ElRadioButton value="editor">编辑器视图</ElRadioButton>
        </ElRadioGroup>
      </div>
      <!-- 代码视图：只读展示 -->
      <div
        v-if="viewMode === 'view'"
        class="max-h-[600px] overflow-y-auto rounded border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
      >
        <!-- TODO @AI：这种折行，是不是要修复下。不够规整。 -->
        <pre
          class="m-0 whitespace-pre-wrap break-words font-mono text-[13px] leading-normal"
        ><code>{{ formattedTSL }}</code></pre>
      </div>
      <!-- 编辑器视图：可编辑 -->
      <ElInput
        v-else
        v-model="tslString"
        :rows="20"
        class="font-mono text-[13px]"
        placeholder="请输入 JSON 格式的物模型 TSL"
        type="textarea"
      />
    </div>
  </Modal>
</template>
