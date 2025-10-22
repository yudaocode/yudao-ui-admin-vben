<script lang="ts" setup>
import type { MallRewardActivityApi } from '#/api/mall/promotion/reward/rewardActivity';

import { computed, ref } from 'vue';

import { useVModel } from '@vueuse/core';
import {
  Button,
  Col,
  Form,
  FormItem,
  Input,
  InputNumber,
  Row,
  Switch,
  Tag,
} from 'ant-design-vue';

import RewardRuleCouponSelect from './reward-rule-coupon-select.vue';

defineOptions({ name: 'RewardRule' });

const props = defineProps<{
  modelValue: MallRewardActivityApi.RewardActivity;
}>();

const emits = defineEmits<{
  (e: 'update:modelValue', v: any): void;
}>();

const formData = useVModel(props, 'modelValue', emits);
const rewardRuleCouponSelectRef =
  ref<InstanceType<typeof RewardRuleCouponSelect>[]>();

const PromotionConditionTypeEnum = {
  PRICE: { type: 10 },
  COUNT: { type: 20 },
};

const isPriceCondition = computed(() => {
  return (
    formData.value?.conditionType === PromotionConditionTypeEnum.PRICE.type
  );
});

/** 删除优惠规则 */
function deleteRule(ruleIndex: number) {
  formData.value.rules.splice(ruleIndex, 1);
}

/** 添加优惠规则 */
function addRule() {
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

/** 设置规则优惠券-提交时 */
function setRuleCoupon() {
  if (!rewardRuleCouponSelectRef.value) {
    return;
  }
  rewardRuleCouponSelectRef.value.forEach((item: any) =>
    item.setGiveCouponList(),
  );
}

defineExpose({ setRuleCoupon });
</script>

<template>
  <Row>
    <template v-if="formData.rules">
      <Col v-for="(rule, index) in formData.rules" :key="index" :span="24">
        <div class="mb-4">
          <span class="font-bold">活动层级{{ index + 1 }}</span>
          <Button
            v-if="index !== 0"
            type="link"
            danger
            class="ml-2"
            @click="deleteRule(index)"
          >
            删除
          </Button>
        </div>

        <Form :model="rule">
          <FormItem label="优惠门槛:" label-col="{ span: 4 }">
            <div class="flex items-center gap-2">
              <span>满</span>
              <InputNumber
                v-if="isPriceCondition"
                v-model:value="rule.limit"
                :min="0"
                :precision="2"
                :step="0.1"
                class="!w-150px"
                placeholder=""
                controls-position="right"
              />
              <Input
                v-else
                v-model:value="rule.limit"
                :min="0"
                class="!w-150px"
                placeholder=""
                type="number"
              />
              <span>{{ isPriceCondition ? '元' : '件' }}</span>
            </div>
          </FormItem>

          <FormItem label="优惠内容:" label-col="{ span: 4 }">
            <div class="flex flex-col gap-4">
              <!-- 订单金额优惠 -->
              <div class="flex items-center gap-2">
                <span>订单金额优惠</span>
              </div>
              <div class="ml-4 flex items-center gap-2">
                <span>减</span>
                <InputNumber
                  v-model:value="rule.discountPrice"
                  :min="0"
                  :precision="2"
                  :step="0.1"
                  class="!w-150px"
                  controls-position="right"
                />
                <span>元</span>
              </div>

              <!-- 包邮 -->
              <div class="flex items-center gap-2">
                <span>包邮：</span>
                <Switch
                  v-model:checked="rule.freeDelivery"
                  checked-children="是"
                  un-checked-children="否"
                />
              </div>

              <!-- 送积分 -->
              <div class="flex items-center gap-2">
                <span>送积分：</span>
                <span>送</span>
                <Input
                  v-model:value="rule.point"
                  class="!w-150px"
                  placeholder=""
                  type="number"
                />
                <span>积分</span>
              </div>

              <!-- 送优惠券 -->
              <div class="flex items-center gap-2">
                <span>送优惠券：</span>
                <RewardRuleCouponSelect
                  ref="rewardRuleCouponSelectRef"
                  v-model="rule"
                />
              </div>
            </div>
          </FormItem>
        </Form>
      </Col>
    </template>

    <Col :span="24" class="mt-4">
      <Button type="primary" @click="addRule">添加优惠规则</Button>
    </Col>

    <Col :span="24" class="mt-4">
      <Tag color="warning">赠送积分为 0 时不赠送。未选优惠券时不赠送。</Tag>
    </Col>
  </Row>
</template>
