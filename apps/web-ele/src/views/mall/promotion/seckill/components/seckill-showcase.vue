<!-- 秒杀活动橱窗组件 - 用于装修时展示和选择秒杀活动 -->
<script lang="ts" setup>
import type { MallSeckillActivityApi } from '#/api/mall/promotion/seckill/seckillActivity';

import { computed, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { ElImage, ElTooltip } from 'element-plus';

import * as SeckillActivityApi from '#/api/mall/promotion/seckill/seckillActivity';
import SeckillTableSelect from '#/views/mall/promotion/seckill/components/seckill-table-select.vue';

interface SeckillShowcaseProps {
  modelValue: number | number[];
  limit?: number;
  disabled?: boolean;
}

const props = withDefaults(defineProps<SeckillShowcaseProps>(), {
  limit: Number.MAX_VALUE,
  disabled: false,
});

const emit = defineEmits<{
  change: [value: any];
  'update:modelValue': [value: number | number[]];
}>();

// 秒杀活动列表
const seckillActivityList = ref<MallSeckillActivityApi.SeckillActivity[]>([]);

// 计算是否可以添加
const canAdd = computed(() => {
  if (props.disabled) return false;
  if (!props.limit) return true;
  return seckillActivityList.value.length < props.limit;
});

// 秒杀活动选择器引用
const seckillActivityTableSelectRef = ref();

/**
 * 打开秒杀活动选择器
 */
function openSeckillActivityTableSelect() {
  seckillActivityTableSelectRef.value.open(seckillActivityList.value);
}

/**
 * 选择活动后触发
 */
function handleActivitySelected(
  activityList:
    | MallSeckillActivityApi.SeckillActivity
    | MallSeckillActivityApi.SeckillActivity[],
) {
  seckillActivityList.value = Array.isArray(activityList)
    ? activityList
    : [activityList];
  emitActivityChange();
}

/**
 * 删除活动
 */
function handleRemoveActivity(index: number) {
  seckillActivityList.value.splice(index, 1);
  emitActivityChange();
}

/**
 * 发送变更事件
 */
function emitActivityChange() {
  if (props.limit === 1) {
    const seckillActivity =
      seckillActivityList.value.length > 0
        ? seckillActivityList.value[0]
        : null;
    emit('update:modelValue', seckillActivity?.id || 0);
    emit('change', seckillActivity);
  } else {
    emit(
      'update:modelValue',
      seckillActivityList.value.map((seckillActivity) => seckillActivity.id),
    );
    emit('change', seckillActivityList.value);
  }
}

// 监听 modelValue 变化
watch(
  () => props.modelValue,
  async () => {
    const ids = Array.isArray(props.modelValue)
      ? props.modelValue
      : props.modelValue
        ? [props.modelValue]
        : [];

    // 不需要返显
    if (ids.length === 0) {
      seckillActivityList.value = [];
      return;
    }

    // 只有活动发生变化之后，才会查询活动
    if (
      seckillActivityList.value.length === 0 ||
      seckillActivityList.value.some(
        (seckillActivity) => !ids.includes(seckillActivity.id!),
      )
    ) {
      seckillActivityList.value =
        await SeckillActivityApi.getSeckillActivityListByIds(ids as number[]);
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <!-- 活动图片列表 -->
    <div
      v-for="(seckillActivity, index) in seckillActivityList"
      :key="seckillActivity.id"
      class="select-box spu-pic"
    >
      <ElTooltip :content="seckillActivity.name">
        <div class="relative h-full w-full">
          <ElImage :src="seckillActivity.picUrl" class="h-full w-full" />
          <IconifyIcon
            v-show="!disabled"
            class="del-icon"
            icon="ep:circle-close-filled"
            @click="handleRemoveActivity(index)"
          />
        </div>
      </ElTooltip>
    </div>

    <!-- 添加按钮 -->
    <ElTooltip v-if="canAdd" content="选择活动">
      <div class="select-box" @click="openSeckillActivityTableSelect">
        <IconifyIcon icon="ep:plus" />
      </div>
    </ElTooltip>
  </div>

  <!-- 秒杀活动选择对话框 -->
  <SeckillTableSelect
    ref="seckillActivityTableSelectRef"
    :multiple="limit !== 1"
    @change="handleActivitySelected"
  />
</template>

<style lang="scss" scoped>
.select-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  cursor: pointer;
  border: 1px dashed var(--el-border-color-darker);
  border-radius: 8px;
}

.spu-pic {
  position: relative;
}

.del-icon {
  position: absolute;
  top: -10px;
  right: -10px;
  z-index: 1;
  width: 20px !important;
  height: 20px !important;
}
</style>
