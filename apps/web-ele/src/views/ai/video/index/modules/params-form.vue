<script lang="ts" setup>
import type { AiVideoApi } from '#/api/ai/video';
import type { VideoModelCapability } from '#/views/ai/utils/video';

import {
  AI_VIDEO_PROMPT_EXPANSION_MODE_OPTIONS,
  AI_VIDEO_QUALITY_OPTIONS,
  AI_VIDEO_SHOT_TYPE_OPTIONS,
  AiVideoTypeEnum,
} from '@vben/constants';

import {
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElOption,
  ElRadioButton,
  ElRadioGroup,
  ElSelect,
  ElSwitch,
} from 'element-plus';

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

/** 模型是否支持某个额外参数 */
function hasField(field: string) {
  return props.capability.fields.includes(field);
}
</script>

<template>
  <template v-if="type === AiVideoTypeEnum.GENERATE">
    <div class="flex gap-2">
      <ElFormItem v-if="hasField('size')" label="尺寸" class="flex-1">
        <ElSelect v-model="options.size">
          <ElOption
            v-for="item in capability.sizes"
            :key="item"
            :label="item"
            :value="item"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem
        v-if="capability.resolutions.length > 0"
        label="分辨率"
        class="flex-1"
      >
        <ElSelect v-model="resolution" filterable allow-create>
          <ElOption
            v-for="item in capability.resolutions"
            :key="item"
            :label="item"
            :value="item"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem
        v-if="capability.ratios.length > 0"
        label="比例"
        class="flex-1"
      >
        <ElSelect v-model="ratio" filterable allow-create>
          <ElOption
            v-for="item in capability.ratios"
            :key="item"
            :label="item"
            :value="item"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem
        v-if="capability.durations.length > 0"
        label="时长（秒）"
        class="flex-1"
      >
        <ElSelect v-model="duration">
          <ElOption
            v-for="item in capability.durations"
            :key="item"
            :label="item"
            :value="item"
          />
        </ElSelect>
      </ElFormItem>
    </div>
    <ElFormItem v-if="hasField('negativePrompt')" label="反向提示词">
      <ElInput
        v-model="options.negativePrompt"
        :maxlength="500"
        placeholder="不希望出现的内容"
      />
    </ElFormItem>
    <ElFormItem v-if="hasField('quality')" label="生成模式">
      <ElRadioGroup v-model="options.quality">
        <ElRadioButton
          v-for="item in AI_VIDEO_QUALITY_OPTIONS"
          :key="item.value"
          :value="item.value"
        >
          {{ item.label }}
        </ElRadioButton>
      </ElRadioGroup>
    </ElFormItem>
    <ElFormItem v-if="hasField('promptExpansionMode')" label="提示词扩写">
      <ElRadioGroup v-model="options.promptExpansionMode">
        <ElRadioButton
          v-for="item in AI_VIDEO_PROMPT_EXPANSION_MODE_OPTIONS"
          :key="item.value"
          :value="item.value"
        >
          {{ item.label }}
        </ElRadioButton>
      </ElRadioGroup>
    </ElFormItem>
    <!-- 镜头类型只在优化提示词开启时生效：关闭时隐藏，也不提交 -->
    <ElFormItem
      v-if="hasField('shotType') && options.promptExtend !== false"
      label="镜头类型"
    >
      <ElRadioGroup v-model="options.shotType">
        <ElRadioButton
          v-for="item in AI_VIDEO_SHOT_TYPE_OPTIONS"
          :key="item.value"
          :value="item.value"
        >
          {{ item.label }}
        </ElRadioButton>
      </ElRadioGroup>
    </ElFormItem>
    <div class="flex flex-wrap gap-x-4">
      <ElFormItem v-if="hasField('generateAudio')" label="生成音频">
        <ElSwitch v-model="options.generateAudio" />
      </ElFormItem>
      <ElFormItem v-if="hasField('promptExtend')" label="优化提示词">
        <ElSwitch v-model="options.promptExtend" />
      </ElFormItem>
      <ElFormItem v-if="hasField('cameraFixed')" label="固定镜头">
        <ElSwitch v-model="options.cameraFixed" />
      </ElFormItem>
      <ElFormItem v-if="hasField('watermark')" label="水印">
        <ElSwitch v-model="options.watermark" />
      </ElFormItem>
    </div>
    <ElFormItem v-if="hasField('seed')" label="随机种子">
      <ElInputNumber
        v-model="options.seed"
        :min="0"
        :precision="0"
        :controls="false"
        placeholder="留空为随机"
        class="!w-full"
      />
    </ElFormItem>
  </template>
</template>
