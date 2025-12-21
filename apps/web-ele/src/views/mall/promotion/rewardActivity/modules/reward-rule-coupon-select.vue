<script lang="ts" setup>
import type { MallCouponTemplateApi } from '#/api/mall/promotion/coupon/couponTemplate';
import type { MallRewardActivityApi } from '#/api/mall/promotion/reward/rewardActivity';

import { nextTick, onMounted, ref, watch } from 'vue';

import { CouponTemplateTakeTypeEnum, DICT_TYPE } from '@vben/constants';

import { useVModel } from '@vueuse/core';
import { ElButton, ElInputNumber } from 'element-plus';

import { getCouponTemplateList } from '#/api/mall/promotion/coupon/couponTemplate';
import { DictTag } from '#/components/dict-tag';
import { CouponSelect } from '#/views/mall/promotion/coupon/components';
import { discountFormat } from '#/views/mall/promotion/coupon/formatter';

defineOptions({ name: 'RewardRuleCouponSelect' });

const props = defineProps<{
  modelValue: MallRewardActivityApi.RewardRule;
}>();

const emits = defineEmits<{
  (e: 'update:modelValue', v: any): void;
}>();

/** 选择赠送的优惠类型拓展 */
interface GiveCoupon extends MallCouponTemplateApi.CouponTemplate {
  giveCount?: number;
}

const rewardRule = useVModel(props, 'modelValue', emits);
const list = ref<GiveCoupon[]>([]); // 选择的优惠劵列表

/** 选择优惠券 */
const selectRef = ref<InstanceType<typeof CouponSelect>>();
function handleSelect() {
  selectRef.value?.open();
}

/** 选择优惠券后的回调 */
function handleChange(val: any[]) {
  for (const item of val) {
    if (list.value.some((v) => v.id === item.id)) {
      continue;
    }
    list.value.push(item);
  }
}

/** 删除优惠券 */
function handleDelete(index: number) {
  list.value.splice(index, 1);
}

/** 初始化赠送的优惠券列表 */
async function initGiveCouponList() {
  // 校验优惠券存在
  if (
    !rewardRule.value ||
    !rewardRule.value.giveCouponTemplateCounts ||
    Object.keys(rewardRule.value.giveCouponTemplateCounts).length === 0
  ) {
    return;
  }
  const tempLateIds = Object.keys(
    rewardRule.value.giveCouponTemplateCounts,
  ) as unknown as number[];
  const data = await getCouponTemplateList(tempLateIds);
  if (!data) {
    return;
  }
  data.forEach((coupon) => {
    list.value.push({
      ...coupon,
      giveCount: rewardRule.value.giveCouponTemplateCounts![coupon.id],
    });
  });
}

/** 监听 list 变化，自动同步到 rewardRule */
watch(
  list,
  (val) => {
    if (!rewardRule.value) {
      return;
    }
    // 核心：清空 giveCouponTemplateCounts，解决删除不生效的问题
    rewardRule.value.giveCouponTemplateCounts = {};
    // 设置优惠券和其数量的对应
    val.forEach((item) => {
      rewardRule.value.giveCouponTemplateCounts![item.id] = item.giveCount!;
    });
  },
  { deep: true },
);

onMounted(async () => {
  await nextTick();
  await initGiveCouponList();
});
</script>

<template>
  <div>
    <!-- 已选优惠券列表 -->
    <div v-if="list.length > 0" class="mb-2 flex flex-col gap-2">
      <div
        v-for="(item, index) in list"
        :key="item.id"
        class="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 transition-all hover:border-blue-400 hover:shadow-sm"
      >
        <div class="flex flex-wrap items-center gap-3">
          <span class="font-medium text-gray-800">{{ item.name }}</span>
          <span class="flex items-center gap-1 text-sm text-gray-500">
            <DictTag
              :type="DICT_TYPE.PROMOTION_PRODUCT_SCOPE"
              :value="item.productScope"
            />
          </span>
          <span class="flex items-center gap-1 text-sm text-gray-500">
            <DictTag
              :type="DICT_TYPE.PROMOTION_DISCOUNT_TYPE"
              :value="item.discountType"
            />
            {{ discountFormat(item) }}
          </span>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <span class="text-gray-500">送</span>
          <ElInputNumber
            v-model="item.giveCount"
            class="!w-32"
            :min="0"
            :step="1"
          />
          <span class="text-gray-500">张</span>
          <ElButton
            type="danger"
            text
            size="small"
            @click="handleDelete(index)"
          >
            删除
          </ElButton>
        </div>
      </div>
    </div>

    <!-- 添加按钮 -->
    <ElButton link class="!pl-0" @click="handleSelect">+ 添加优惠券</ElButton>

    <!-- 优惠券选择弹窗 -->
    <CouponSelect
      ref="selectRef"
      :take-type="CouponTemplateTakeTypeEnum.ADMIN.type"
      @change="handleChange"
    />
  </div>
</template>
