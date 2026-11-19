<script lang="ts" setup>
import type { AiModelModelApi } from '#/api/ai/model/model';

import { computed } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';

import { ElFormItem, ElOption, ElSelect } from 'element-plus';

/** AI 视频：服务商、模型选择；服务商跟随选中的模型，切换服务商时选中它的第一个模型 */
defineOptions({ name: 'AiVideoModelSelect' });

const props = defineProps<{
  models: AiModelModelApi.Model[]; // 当前创作类型可用的模型
}>();

const emit = defineEmits<{
  change: []; // 用户切换服务商、模型时触发
}>();

const modelId = defineModel<number>(); // 选中的模型编号

/** 可用的服务商 */
const platformList = computed(() => [
  ...new Set(props.models.map((item) => item.platform)),
]);

/** 当前服务商：取选中模型的服务商；切换时选中该服务商的第一个模型 */
const platform = computed({
  get: () => props.models.find((item) => item.id === modelId.value)?.platform,
  set: (value) => {
    modelId.value = props.models.find((item) => item.platform === value)?.id;
    emit('change');
  },
});

/** 当前服务商的模型 */
const modelList = computed(() =>
  props.models.filter((item) => item.platform === platform.value),
);
</script>

<template>
  <ElFormItem label="服务商">
    <ElSelect v-model="platform" placeholder="请选择服务商" class="!w-full">
      <ElOption
        v-for="item in platformList"
        :key="item"
        :label="getDictLabel(DICT_TYPE.AI_PLATFORM, item) || item"
        :value="item"
      />
    </ElSelect>
  </ElFormItem>
  <ElFormItem label="模型" prop="modelId">
    <ElSelect
      v-model="modelId"
      placeholder="请选择视频模型"
      class="!w-full"
      @change="emit('change')"
    >
      <ElOption
        v-for="item in modelList"
        :key="item.id"
        :label="item.name"
        :value="item.id"
      >
        <span>{{ item.name }}</span>
        <span class="ml-2 text-xs text-[var(--el-text-color-secondary)]">
          {{ item.model }}
        </span>
      </ElOption>
    </ElSelect>
    <div
      v-if="models.length === 0"
      class="mt-1 text-xs leading-[18px] text-[var(--el-text-color-secondary)]"
    >
      暂无可用模型，请先在「模型配置」中添加类型为「视频」的模型
    </div>
  </ElFormItem>
</template>
