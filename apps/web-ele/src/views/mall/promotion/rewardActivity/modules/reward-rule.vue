<script lang="ts" setup>
import type { MallRewardActivityApi } from '#/api/mall/promotion/reward/rewardActivity';

import { computed } from 'vue';

import { PromotionConditionTypeEnum } from '@vben/constants';

import { useVModel } from '@vueuse/core';
import {
  ElButton,
  ElCard,
  ElCol,
  ElForm,
  ElFormItem,
  ElInputNumber,
  ElRow,
  ElSwitch,
  ElTag,
} from 'element-plus';

import RewardRuleCouponSelect from './reward-rule-coupon-select.vue';

defineOptions({ name: 'RewardRule' });

const props = defineProps<{
  modelValue: Partial<MallRewardActivityApi.RewardActivity>;
}>();

const emits = defineEmits<{
  (e: 'update:modelValue', v: any): void;
}>();

const formData = useVModel(props, 'modelValue', emits);

const isPriceCondition = computed(() => {
  return (
    formData.value?.conditionType === PromotionConditionTypeEnum.PRICE.type
  );
});

/** 处理新增 */
function handleAdd() {
  if (!formData.value.rules) {
    formData.value.rules = [];
  }
  formData.value.rules.push({
    limit: 0,
    discountPrice: 0,
    freeDelivery: false,
    point: 0,
  });
}

/** 处理删除 */
function handleDelete(ruleIndex: number) {
  formData.value.rules?.splice(ruleIndex, 1);
}
</script>

<template>
  <ElRow :gutter="16">
    <template v-if="formData.rules">
      <ElCol v-for="(rule, index) in formData.rules" :key="index" :span="24">
        <ElCard size="small" class="rounded-lg">
          <!-- 规则标题 -->
          <template #header>
            <div class="flex items-center justify-between">
              <span class="text-base font-medium">
                活动层级 {{ index + 1 }}
              </span>
              <ElButton
                v-if="index !== 0"
                type="danger"
                text
                size="small"
                @click="handleDelete(index)"
              >
                删除
              </ElButton>
            </div>
          </template>

          <ElForm :model="rule" label-position="left">
            <!-- 优惠门槛 -->
            <ElFormItem label="优惠门槛:" class="mb-3">
              <div
                class="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2"
              >
                <span>满</span>
                <ElInputNumber
                  v-if="isPriceCondition"
                  v-model="rule.limit"
                  :min="0"
                  :precision="2"
                  :step="0.1"
                  class="!w-40"
                  placeholder="请输入金额"
                />
                <ElInputNumber
                  v-else
                  v-model="rule.limit"
                  :min="0"
                  :step="1"
                  class="!w-40"
                  placeholder="请输入数量"
                />
                <span>{{ isPriceCondition ? '元' : '件' }}</span>
              </div>
            </ElFormItem>
            <!-- 优惠内容 -->
            <ElFormItem label="优惠内容:" class="!mb-0">
              <div class="flex flex-col gap-3">
                <div
                  class="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2"
                >
                  <span class="!w-21 shrink-0 text-sm text-gray-500">
                    订单金额优惠
                  </span>
                  <span>减</span>
                  <ElInputNumber
                    v-model="rule.discountPrice"
                    :min="0"
                    :precision="2"
                    :step="0.1"
                    class="!w-32"
                    placeholder="请输入金额"
                  />
                  <span>元</span>
                </div>
                <!-- 包邮 -->
                <div
                  class="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2"
                >
                  <span class="w-20 shrink-0 text-sm text-gray-500">包邮</span>
                  <ElSwitch v-model="rule.freeDelivery" />
                </div>
                <!-- 送积分 -->
                <div
                  class="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2"
                >
                  <span class="w-20 shrink-0 text-sm text-gray-500">
                    送积分
                  </span>
                  <span>送</span>
                  <ElInputNumber
                    v-model="rule.point"
                    :min="0"
                    :step="1"
                    class="!w-32"
                    placeholder="请输入积分"
                  />
                  <span>积分</span>
                </div>
                <!-- 送优惠券 -->
                <div
                  class="flex flex-col items-start gap-2 rounded-md bg-gray-50 px-3 py-2"
                >
                  <span class="w-20 shrink-0 text-sm text-gray-500">
                    送优惠券
                  </span>
                  <RewardRuleCouponSelect
                    :model-value="rule"
                    @update:model-value="
                      (val) => (formData.rules![index] = val)
                    "
                  />
                </div>
              </div>
            </ElFormItem>
          </ElForm>
        </ElCard>
      </ElCol>
    </template>

    <!-- 添加规则按钮 -->
    <ElCol :span="24" class="mt-2">
      <ElButton type="primary" @click="handleAdd">+ 添加优惠规则</ElButton>
    </ElCol>

    <!-- 提示信息 -->
    <ElCol :span="24" class="mt-2">
      <ElTag type="warning">
        提示：赠送积分为 0 时不赠送；未选择优惠券时不赠送。
      </ElTag>
    </ElCol>
  </ElRow>
</template>
