<script lang="ts" setup>
import type { AiVideoApi } from '#/api/ai/video';
import type { VideoModelCapability } from '#/views/ai/utils/video';

import { computed } from 'vue';

import {
  AI_VIDEO_PROMPT_EXPANSION_MODE_OPTIONS,
  AI_VIDEO_QUALITY_OPTIONS,
  AI_VIDEO_SHOT_TYPE_OPTIONS,
  AiVideoTypeEnum,
} from '@vben/constants';

import {
  AutoComplete,
  FormItem,
  Input,
  InputNumber,
  RadioButton,
  RadioGroup,
  Select,
  Switch,
} from 'antdv-next';

/** AI 视频：生成参数；按模型的表单能力展示，取值范围由服务端按模型校验 */
defineOptions({ name: 'AiVideoParamsForm' });

const props = defineProps<{
  capability: VideoModelCapability; // 模型的表单能力
  type: number; // 创作类型
}>();

const resolution = defineModel<string>('resolution'); // 分辨率
const ratio = defineModel<string>('ratio'); // 比例
const duration = defineModel<number>('duration'); // 时长（秒）
const options = defineModel<AiVideoApi.VideoOptions>('options', {
  required: true,
}); // 其它生成参数

/** 分辨率、比例：可从推荐值中选择，也可输入服务商支持的其它值 */
const resolutionOptions = computed(() =>
  props.capability.resolutions.map((value) => ({ value })),
);
const ratioOptions = computed(() =>
  props.capability.ratios.map((value) => ({ value })),
);
const durationOptions = computed(() =>
  props.capability.durations.map((value) => ({ label: value, value })),
);
const sizeOptions = computed(() =>
  props.capability.sizes.map((value) => ({ label: value, value })),
);

/** 模型是否支持某个额外参数 */
function hasField(field: string) {
  return props.capability.fields.includes(field);
}
</script>

<template>
  <template v-if="type === AiVideoTypeEnum.GENERATE">
    <div class="flex gap-2">
      <FormItem v-if="hasField('size')" label="尺寸" class="flex-1">
        <Select v-model:value="options.size" :options="sizeOptions" />
      </FormItem>
      <FormItem
        v-if="capability.resolutions.length > 0"
        label="分辨率"
        class="flex-1"
      >
        <AutoComplete
          v-model:value="resolution"
          :options="resolutionOptions"
          :show-search="{ filterOption: false }"
        />
      </FormItem>
      <FormItem v-if="capability.ratios.length > 0" label="比例" class="flex-1">
        <AutoComplete
          v-model:value="ratio"
          :options="ratioOptions"
          :show-search="{ filterOption: false }"
        />
      </FormItem>
      <FormItem
        v-if="capability.durations.length > 0"
        label="时长（秒）"
        class="flex-1"
      >
        <Select v-model:value="duration" :options="durationOptions" />
      </FormItem>
    </div>
    <FormItem v-if="hasField('negativePrompt')" label="反向提示词">
      <Input
        v-model:value="options.negativePrompt"
        :maxlength="500"
        placeholder="不希望出现的内容"
      />
    </FormItem>
    <FormItem v-if="hasField('quality')" label="生成模式">
      <RadioGroup v-model:value="options.quality" button-style="solid">
        <RadioButton
          v-for="item in AI_VIDEO_QUALITY_OPTIONS"
          :key="item.value"
          :value="item.value"
        >
          {{ item.label }}
        </RadioButton>
      </RadioGroup>
    </FormItem>
    <FormItem v-if="hasField('promptExpansionMode')" label="提示词扩写">
      <RadioGroup
        v-model:value="options.promptExpansionMode"
        button-style="solid"
      >
        <RadioButton
          v-for="item in AI_VIDEO_PROMPT_EXPANSION_MODE_OPTIONS"
          :key="item.value"
          :value="item.value"
        >
          {{ item.label }}
        </RadioButton>
      </RadioGroup>
    </FormItem>
    <!-- 镜头类型只在优化提示词开启时生效：关闭时隐藏，也不提交 -->
    <FormItem
      v-if="hasField('shotType') && options.promptExtend !== false"
      label="镜头类型"
    >
      <RadioGroup v-model:value="options.shotType" button-style="solid">
        <RadioButton
          v-for="item in AI_VIDEO_SHOT_TYPE_OPTIONS"
          :key="item.value"
          :value="item.value"
        >
          {{ item.label }}
        </RadioButton>
      </RadioGroup>
    </FormItem>
    <div class="flex flex-wrap gap-x-4">
      <FormItem v-if="hasField('generateAudio')" label="生成音频">
        <Switch v-model:checked="options.generateAudio" />
      </FormItem>
      <FormItem v-if="hasField('promptExtend')" label="优化提示词">
        <Switch v-model:checked="options.promptExtend" />
      </FormItem>
      <FormItem v-if="hasField('cameraFixed')" label="固定镜头">
        <Switch v-model:checked="options.cameraFixed" />
      </FormItem>
      <FormItem v-if="hasField('watermark')" label="水印">
        <Switch v-model:checked="options.watermark" />
      </FormItem>
    </div>
    <FormItem v-if="hasField('seed')" label="随机种子">
      <InputNumber
        v-model:value="options.seed"
        :min="0"
        :precision="0"
        placeholder="留空为随机"
        class="!w-full"
      />
    </FormItem>
  </template>
</template>
