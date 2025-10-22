<!-- 积分活动橱窗组件 - 用于装修时展示和选择积分活动 -->
<script lang="ts" setup>
import type { MallPointActivityApi } from '#/api/mall/promotion/point';

import { computed, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Image, Tooltip } from 'ant-design-vue';

import { getPointActivityListByIds } from '#/api/mall/promotion/point';

import PointTableSelect from './point-table-select.vue';

interface PointShowcaseProps {
  modelValue: number | number[];
  limit?: number;
  disabled?: boolean;
}

const props = withDefaults(defineProps<PointShowcaseProps>(), {
  limit: Number.MAX_VALUE,
  disabled: false,
});

const emit = defineEmits<{
  change: [value: any];
  'update:modelValue': [value: number | number[]];
}>();

// 积分活动列表
const pointActivityList = ref<MallPointActivityApi.PointActivity[]>([]);

// 计算是否可以添加
const canAdd = computed(() => {
  if (props.disabled) return false;
  if (!props.limit) return true;
  return pointActivityList.value.length < props.limit;
});

// 积分活动选择器引用
const pointActivityTableSelectRef = ref();

/**
 * 打开积分活动选择器
 */
function openPointActivityTableSelect() {
  pointActivityTableSelectRef.value.open(pointActivityList.value);
}

/**
 * 选择活动后触发
 */
function handleActivitySelected(
  activityList:
    | MallPointActivityApi.PointActivity
    | MallPointActivityApi.PointActivity[],
) {
  pointActivityList.value = Array.isArray(activityList)
    ? activityList
    : [activityList];
  emitActivityChange();
}

/**
 * 删除活动
 */
function handleRemoveActivity(index: number) {
  pointActivityList.value.splice(index, 1);
  emitActivityChange();
}

/**
 * 发送变更事件
 */
function emitActivityChange() {
  if (props.limit === 1) {
    const pointActivity =
      pointActivityList.value.length > 0 ? pointActivityList.value[0] : null;
    emit('update:modelValue', pointActivity?.id || 0);
    emit('change', pointActivity);
  } else {
    emit(
      'update:modelValue',
      pointActivityList.value.map((pointActivity) => pointActivity.id),
    );
    emit('change', pointActivityList.value);
  }
}

// 监听 modelValue 变化
watch(
  () => props.modelValue,
  async () => {
    const ids = Array.isArray(props.modelValue)
      ? props.modelValue
      : (props.modelValue
        ? [props.modelValue]
        : []);

    // 不需要返显
    if (ids.length === 0) {
      pointActivityList.value = [];
      return;
    }

    // 只有活动发生变化之后，才会查询活动
    if (
      pointActivityList.value.length === 0 ||
      pointActivityList.value.some(
        (pointActivity) => !ids.includes(pointActivity.id!),
      )
    ) {
      pointActivityList.value = await getPointActivityListByIds(ids);
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <!-- 活动图片列表 -->
    <div
      v-for="(pointActivity, index) in pointActivityList"
      :key="pointActivity.id"
      class="relative flex h-[60px] w-[60px] cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-300"
    >
      <Tooltip :title="pointActivity.spuName">
        <div class="relative h-full w-full">
          <Image
            :preview="true"
            :src="pointActivity.picUrl"
            class="h-full w-full rounded-lg object-cover"
          />
          <IconifyIcon
            v-show="!disabled"
            icon="ep:circle-close-filled"
            class="absolute -right-2 -top-2 z-10 h-5 w-5 cursor-pointer text-red-500 hover:text-red-600"
            @click="handleRemoveActivity(index)"
          />
        </div>
      </Tooltip>
    </div>

    <!-- 添加按钮 -->
    <Tooltip v-if="canAdd" title="选择活动">
      <div
        class="flex h-[60px] w-[60px] cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-300 hover:border-blue-400"
        @click="openPointActivityTableSelect"
      >
        <IconifyIcon icon="ep:plus" class="text-lg text-gray-400" />
      </div>
    </Tooltip>
  </div>

  <!-- 积分活动选择对话框 -->
  <PointTableSelect
    ref="pointActivityTableSelectRef"
    :multiple="limit != 1"
    @change="handleActivitySelected"
  />
</template>
