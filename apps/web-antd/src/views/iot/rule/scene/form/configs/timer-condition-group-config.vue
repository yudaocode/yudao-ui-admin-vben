<script setup lang="ts">
import type { RuleSceneApi } from '#/api/iot/rule/scene';

import { nextTick } from 'vue';

import { IotRuleSceneTriggerTypeEnum } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';
import { getStableObjectKey } from '@vben/utils';

import { useVModel } from '@vueuse/core';
import { Button, Tag } from 'ant-design-vue';

import SubConditionGroupConfig from './sub-condition-group-config.vue';

const props = defineProps<{
  modelValue?: RuleSceneApi.TriggerCondition[][];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: RuleSceneApi.TriggerCondition[][]): void;
}>();

const conditionGroups = useVModel(props, 'modelValue', emit);

const maxGroups = 3; // 最多 3 个条件组
const maxConditionsPerGroup = 3; // 每组最多 3 个条件

/** 添加条件组 */
async function addConditionGroup() {
  if (!conditionGroups.value) {
    conditionGroups.value = [];
  }
  if (conditionGroups.value.length >= maxGroups) {
    return;
  }
  await nextTick();
  if (conditionGroups.value) {
    conditionGroups.value.push([]);
  }
}

/** 移除条件组 */
function removeConditionGroup(index: number) {
  if (conditionGroups.value) {
    conditionGroups.value.splice(index, 1);
  }
}

/** 更新条件组 */
function updateConditionGroup(
  index: number,
  group: RuleSceneApi.TriggerCondition[],
) {
  if (conditionGroups.value) {
    conditionGroups.value[index] = group;
  }
}
</script>

<template>
  <div class="space-y-[16px]">
    <!-- 条件组容器头部（蓝色主题） -->
    <div
      class="px-[16px] py-[10px] rounded-[6px] flex items-center justify-between border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 dark:border-blue-900/40 dark:from-blue-950/30 dark:to-cyan-950/30"
    >
      <div class="gap-[10px] flex items-center">
        <div
          class="gap-[8px] text-[14px] font-semibold flex items-center text-blue-700 dark:text-blue-300"
        >
          <div
            class="w-[22px] h-[22px] text-[12px] flex items-center justify-center rounded-full bg-blue-500 font-bold text-white"
          >
            组
          </div>
          <span>附加条件组</span>
        </div>
        <Tag color="processing">定时触发时需满足以下条件</Tag>
        <Tag color="warning">
          {{ conditionGroups?.length || 0 }} 个子条件组
        </Tag>
      </div>
      <Button
        type="primary"
        size="small"
        :disabled="(conditionGroups?.length || 0) >= maxGroups"
        @click="addConditionGroup"
      >
        <IconifyIcon icon="lucide:plus" />
        添加条件组
      </Button>
    </div>

    <!-- 条件组列表 -->
    <div
      v-if="conditionGroups && conditionGroups.length > 0"
      class="space-y-[16px]"
    >
      <div
        v-for="(group, groupIndex) in conditionGroups"
        :key="getStableObjectKey(group)"
        class="relative"
      >
        <!-- 条件组容器（橙色主题） -->
        <div
          class="rounded-[8px] border border-orange-200 bg-orange-50/40 shadow-sm transition-shadow hover:shadow-md dark:border-orange-900/40 dark:bg-orange-950/20"
        >
          <div
            class="px-[16px] py-[10px] rounded-t-[8px] flex items-center justify-between border-b border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 dark:border-orange-900/40 dark:from-orange-950/30 dark:to-yellow-950/30"
          >
            <div class="gap-[10px] flex items-center">
              <div
                class="gap-[8px] text-[14px] font-semibold flex items-center text-orange-700 dark:text-orange-300"
              >
                <div
                  class="w-[22px] h-[22px] text-[12px] flex items-center justify-center rounded-full bg-orange-500 font-bold text-white"
                >
                  {{ groupIndex + 1 }}
                </div>
                <span>子条件组 {{ groupIndex + 1 }}</span>
              </div>
              <Tag color="warning" class="font-medium">
                组内条件为「且」关系
              </Tag>
              <Tag color="default"> {{ group?.length || 0 }} 个条件 </Tag>
            </div>
            <Button
              danger
              size="small"
              type="link"
              class="hover:bg-red-50"
              @click="removeConditionGroup(groupIndex)"
            >
              <IconifyIcon icon="lucide:trash-2" />
              删除组
            </Button>
          </div>

          <SubConditionGroupConfig
            :model-value="group"
            :trigger-type="IotRuleSceneTriggerTypeEnum.TIMER"
            :max-conditions="maxConditionsPerGroup"
            @update:model-value="
              (value: RuleSceneApi.TriggerCondition[]) =>
                updateConditionGroup(groupIndex, value)
            "
          />
        </div>

        <!-- 条件组间的「或」连接符 -->
        <div
          v-if="groupIndex < conditionGroups.length - 1"
          class="py-[12px] flex items-center justify-center"
        >
          <div class="gap-[8px] flex items-center">
            <div
              class="w-[32px] h-[1px] bg-orange-300 dark:bg-orange-800"
            ></div>
            <div
              class="px-[14px] py-[3px] rounded-full border border-orange-300 bg-orange-100 dark:border-orange-800 dark:bg-orange-950/50"
            >
              <span
                class="text-[13px] font-semibold text-orange-600 dark:text-orange-300"
              >
                或
              </span>
            </div>
            <div
              class="w-[32px] h-[1px] bg-orange-300 dark:bg-orange-800"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态（蓝色主题） -->
    <div
      v-else
      class="p-[24px] rounded-[8px] border-2 border-dashed border-blue-200 bg-blue-50/40 text-center dark:border-blue-900/40 dark:bg-blue-950/10"
    >
      <div class="gap-[10px] flex flex-col items-center">
        <IconifyIcon
          icon="lucide:plus"
          class="text-[28px] text-blue-400 dark:text-blue-300"
        />
        <div class="text-blue-600 dark:text-blue-300">
          <p class="text-[13px] font-medium mb-[2px]">暂无附加条件</p>
          <p class="text-[12px]">定时触发时将直接执行动作</p>
        </div>
      </div>
    </div>
  </div>
</template>
