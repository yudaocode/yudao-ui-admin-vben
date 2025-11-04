<script lang="ts" setup>
import type { MallRewardActivityApi } from '#/api/mall/promotion/reward/rewardActivity';

import { computed, nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import {
  PromotionConditionTypeEnum,
  PromotionProductScopeEnum,
} from '@vben/constants';
import { convertToInteger, formatToFraction } from '@vben/utils';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createRewardActivity,
  getReward,
  updateRewardActivity,
} from '#/api/mall/promotion/reward/rewardActivity';
import { $t } from '#/locales';
import { SpuShowcase } from '#/views/mall/product/spu/components';

import { useFormSchema } from '../data';
import RewardRule from './reward-rule.vue';

const emit = defineEmits(['success']);

const formData = ref<MallRewardActivityApi.RewardActivity>({
  // TODO @puhui999：这里的 conditionType、productScope 是不是可以删除呀。因为 data.ts 已经搞了 defaultValue；
  conditionType: PromotionConditionTypeEnum.PRICE.type,
  productScope: PromotionProductScopeEnum.ALL.scope,
  rules: [],
});

const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['满减送'])
    : $t('ui.actionTitle.create', ['满减送']);
});

const rewardRuleRef = ref<InstanceType<typeof RewardRule>>();

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 100,
  },
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
});

// TODO @芋艿：这里需要在简化下；
const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    try {
      const data = await formApi.getValues();
      rewardRuleRef.value?.setRuleCoupon();
      if (data.startAndEndTime && Array.isArray(data.startAndEndTime)) {
        data.startTime = data.startAndEndTime[0];
        data.endTime = data.startAndEndTime[1];
        delete data.startAndEndTime;
      }
      data.rules?.forEach((item: any) => {
        item.discountPrice = convertToInteger(item.discountPrice || 0);
        if (data.conditionType === PromotionConditionTypeEnum.PRICE.type) {
          item.limit = convertToInteger(item.limit || 0);
        }
      });
      setProductScopeValues(data);

      await (formData.value?.id
        ? updateRewardActivity(data as MallRewardActivityApi.RewardActivity)
        : createRewardActivity(data as MallRewardActivityApi.RewardActivity));
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = {
        conditionType: PromotionConditionTypeEnum.PRICE.type,
        productScope: PromotionProductScopeEnum.ALL.scope,
        rules: [],
      };
      return;
    }
    // 加载数据
    const data = modalApi.getData<MallRewardActivityApi.RewardActivity>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      const result = await getReward(data.id);
      result.startAndEndTime = [result.startTime, result.endTime] as any[];
      result.rules?.forEach((item: any) => {
        item.discountPrice = formatToFraction(item.discountPrice || 0);
        if (result.conditionType === PromotionConditionTypeEnum.PRICE.type) {
          item.limit = formatToFraction(item.limit || 0);
        }
      });
      formData.value = result;
      // 设置到 values
      await formApi.setValues(result);

      await getProductScope();
    } finally {
      modalApi.unlock();
    }
  },
});

async function getProductScope() {
  switch (formData.value.productScope) {
    case PromotionProductScopeEnum.CATEGORY.scope: {
      await nextTick();
      let productCategoryIds = formData.value.productScopeValues as any;
      if (
        Array.isArray(productCategoryIds) &&
        productCategoryIds.length === 1
      ) {
        productCategoryIds = productCategoryIds[0];
      }
      formData.value.productCategoryIds = productCategoryIds;
      break;
    }
    case PromotionProductScopeEnum.SPU.scope: {
      formData.value.productSpuIds = formData.value.productScopeValues;
      break;
    }
    default: {
      break;
    }
  }
}

// TODO @puhui999：/Users/yunai/Java/yudao-ui-admin-vben-v5/apps/web-antd/src/views/mall/promotion/coupon/template/data.ts 可以类似 /Users/yunai/Java/yudao-ui-admin-vben-v5/apps/web-antd/src/views/mall/promotion/coupon/template/data.ts 的 productScopeValues（微信交流）
function setProductScopeValues(data: any) {
  switch (formData.value.productScope) {
    case PromotionProductScopeEnum.CATEGORY.scope: {
      data.productScopeValues = Array.isArray(formData.value.productCategoryIds)
        ? formData.value.productCategoryIds
        : [formData.value.productCategoryIds];
      break;
    }
    case PromotionProductScopeEnum.SPU.scope: {
      data.productScopeValues = formData.value.productSpuIds;
      break;
    }
    default: {
      break;
    }
  }
}
</script>

<template>
  <Modal :title="getTitle" class="w-2/3">
    <Form class="mx-6">
      <!-- 自定义插槽：优惠规则 -->
      <template #rules>
        <RewardRule ref="rewardRuleRef" v-model="formData" />
      </template>

      <!-- 自定义插槽：商品选择 -->
      <template #productSpuIds>
        <SpuShowcase v-model="formData.productSpuIds" />
      </template>
    </Form>
  </Modal>
</template>
