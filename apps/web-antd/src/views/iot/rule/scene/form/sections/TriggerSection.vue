<script setup lang="ts">
import type { Trigger } from '#/api/iot/rule/scene';

import { Crontab } from '@/components/Crontab';
import { useVModel } from '@vueuse/core';

import {
  getTriggerTypeLabel,
  IotRuleSceneTriggerTypeEnum,
  isDeviceTrigger,
} from '#/views/iot/utils/constants';

import DeviceTriggerConfig from '../configs/DeviceTriggerConfig.vue';

/** 触发器配置组件 */
defineOptions({ name: 'TriggerSection' });

const props = defineProps<{
  triggers: Trigger[];
}>();

const emit = defineEmits<{
  (e: 'update:triggers', value: Trigger[]): void;
}>();

const triggers = useVModel(props, 'triggers', emit);

/** 获取触发器标签类型（用于 el-tag 的 type 属性） */
const getTriggerTagType = (
  type: number,
): 'danger' | 'info' | 'primary' | 'success' | 'warning' => {
  if (type === IotRuleSceneTriggerTypeEnum.TIMER) {
    return 'warning';
  }
  return isDeviceTrigger(type) ? 'success' : 'info';
};

/** 添加触发器 */
const addTrigger = () => {
  const newTrigger: Trigger = {
    type: IotRuleSceneTriggerTypeEnum.DEVICE_STATE_UPDATE,
    productId: undefined,
    deviceId: undefined,
    identifier: undefined,
    operator: undefined,
    value: undefined,
    cronExpression: undefined,
    conditionGroups: [], // 空的条件组数组
  };
  triggers.value.push(newTrigger);
};

/**
 * 删除触发器
 * @param index 触发器索引
 */
const removeTrigger = (index: number) => {
  if (triggers.value.length > 1) {
    triggers.value.splice(index, 1);
  }
};

/**
 * 更新触发器类型
 * @param index 触发器索引
 * @param type 触发器类型
 */
const updateTriggerType = (index: number, type: number) => {
  triggers.value[index].type = type;
  onTriggerTypeChange(index, type);
};

/**
 * 更新触发器设备配置
 * @param index 触发器索引
 * @param newTrigger 新的触发器对象
 */
const updateTriggerDeviceConfig = (index: number, newTrigger: Trigger) => {
  triggers.value[index] = newTrigger;
};

/**
 * 更新触发器 CRON 配置
 * @param index 触发器索引
 * @param cronExpression CRON 表达式
 */
const updateTriggerCronConfig = (index: number, cronExpression?: string) => {
  triggers.value[index].cronExpression = cronExpression;
};

/**
 * 处理触发器类型变化事件
 * @param index 触发器索引
 * @param _ 触发器类型（未使用）
 */
const onTriggerTypeChange = (index: number, _: number) => {
  const triggerItem = triggers.value[index];
  triggerItem.productId = undefined;
  triggerItem.deviceId = undefined;
  triggerItem.identifier = undefined;
  triggerItem.operator = undefined;
  triggerItem.value = undefined;
  triggerItem.cronExpression = undefined;
  triggerItem.conditionGroups = [];
};

/** 初始化：确保至少有一个触发器 */
onMounted(() => {
  if (triggers.value.length === 0) {
    addTrigger();
  }
});
</script>

<template>
  <el-card
    class="rounded-8px mb-10px border border-[var(--el-border-color-light)]"
    shadow="never"
  >
    <template #header>
      <div class="flex items-center justify-between">
        <div class="gap-8px flex items-center">
          <Icon
            icon="ep:lightning"
            class="text-18px text-[var(--el-color-primary)]"
          />
          <span class="text-16px font-600 text-[var(--el-text-color-primary)]"
            >触发器配置</span
          >
          <el-tag size="small" type="info">
            {{ triggers.length }} 个触发器
          </el-tag>
        </div>
        <el-button type="primary" size="small" @click="addTrigger">
          <Icon icon="ep:plus" />
          添加触发器
        </el-button>
      </div>
    </template>

    <div class="p-16px space-y-24px">
      <!-- 触发器列表 -->
      <div v-if="triggers.length > 0" class="space-y-24px">
        <div
          v-for="(triggerItem, index) in triggers"
          :key="`trigger-${index}`"
          class="rounded-8px border-2 border-green-200 bg-green-50 shadow-sm transition-shadow hover:shadow-md"
        >
          <!-- 触发器头部 - 绿色主题 -->
          <div
            class="p-16px rounded-t-6px flex items-center justify-between border-b border-green-200 bg-gradient-to-r from-green-50 to-emerald-50"
          >
            <div class="gap-12px flex items-center">
              <div
                class="gap-8px text-16px font-600 flex items-center text-green-700"
              >
                <div
                  class="w-24px h-24px text-12px flex items-center justify-center rounded-full bg-green-500 font-bold text-white"
                >
                  {{ index + 1 }}
                </div>
                <span>触发器 {{ index + 1 }}</span>
              </div>
              <el-tag
                size="small"
                :type="getTriggerTagType(triggerItem.type)"
                class="font-500"
              >
                {{ getTriggerTypeLabel(triggerItem.type) }}
              </el-tag>
            </div>
            <div class="gap-8px flex items-center">
              <el-button
                v-if="triggers.length > 1"
                type="danger"
                size="small"
                text
                @click="removeTrigger(index)"
                class="hover:bg-red-50"
              >
                <Icon icon="ep:delete" />
                删除
              </el-button>
            </div>
          </div>

          <!-- 触发器内容区域 -->
          <div class="p-16px space-y-16px">
            <!-- 设备触发配置 -->
            <DeviceTriggerConfig
              v-if="isDeviceTrigger(triggerItem.type)"
              :model-value="triggerItem"
              :index="index"
              @update:model-value="
                (value) => updateTriggerDeviceConfig(index, value)
              "
              @trigger-type-change="(type) => updateTriggerType(index, type)"
            />

            <!-- 定时触发配置 -->
            <div
              v-else-if="triggerItem.type === IotRuleSceneTriggerTypeEnum.TIMER"
              class="gap-16px flex flex-col"
            >
              <div
                class="gap-8px p-12px px-16px rounded-6px flex items-center border border-[var(--el-border-color-lighter)] bg-[var(--el-fill-color-light)]"
              >
                <Icon
                  icon="ep:timer"
                  class="text-18px text-[var(--el-color-danger)]"
                />
                <span
                  class="text-14px font-500 text-[var(--el-text-color-primary)]"
                  >定时触发配置</span
                >
              </div>

              <!-- CRON 表达式配置 -->
              <div
                class="p-16px rounded-6px border border-[var(--el-border-color-lighter)] bg-[var(--el-fill-color-blank)]"
              >
                <el-form-item label="CRON表达式" required>
                  <Crontab
                    :model-value="triggerItem.cronExpression || '0 0 12 * * ?'"
                    @update:model-value="
                      (value) => updateTriggerCronConfig(index, value)
                    "
                  />
                </el-form-item>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="py-40px text-center">
        <el-empty description="暂无触发器">
          <template #description>
            <div class="space-y-8px">
              <p class="text-[var(--el-text-color-secondary)]">
                暂无触发器配置
              </p>
              <p class="text-12px text-[var(--el-text-color-placeholder)]">
                请使用上方的"添加触发器"按钮来设置触发规则
              </p>
            </div>
          </template>
        </el-empty>
      </div>
    </div>
  </el-card>
</template>
