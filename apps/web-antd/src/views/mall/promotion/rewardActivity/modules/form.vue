<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { MallRewardActivityApi } from '#/api/mall/promotion/reward/rewardActivity';

import { computed, nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import {
  PromotionConditionTypeEnum,
  PromotionProductScopeEnum,
} from '@vben/constants';
import { convertToInteger, formatToFraction } from '@vben/utils';

import { Alert, FormItem, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createRewardActivity,
  getReward,
  updateRewardActivity,
} from '#/api/mall/promotion/reward/rewardActivity';
import { $t } from '#/locales';
import { SpuAndSkuList } from '#/views/mall/promotion/components';

import RewardRule from '../components/reward-rule.vue';
import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<MallRewardActivityApi.RewardActivity>({
  conditionType: PromotionConditionTypeEnum.PRICE.type,
  productScope: PromotionProductScopeEnum.ALL.scope,
  rules: [],
});

const getTitle = computed(() =>
  formData.value?.id ? '编辑满减送' : '新增满减送',
);

// 1. 使用 useVbenForm 初始化表单
const [Form, formApi] = useVbenForm({
  schema: useFormSchema(),
  showDefaultActions: false,
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  } as VbenFormProps['commonConfig'],
});

const rewardRuleRef = ref<InstanceType<typeof RewardRule>>();

// 2. 使用 useVbenModal 定义弹窗行为
const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;

    modalApi.lock();
    try {
      const data = await formApi.getValues();

      // 1. 设置活动规则优惠券
      rewardRuleRef.value?.setRuleCoupon();

      // 2. 时间段转换
      if (data.startAndEndTime && Array.isArray(data.startAndEndTime)) {
        data.startTime = data.startAndEndTime[0];
        data.endTime = data.startAndEndTime[1];
        delete data.startAndEndTime;
      }

      // 3. 规则元转分
      data.rules?.forEach((item: any) => {
        item.discountPrice = convertToInteger(item.discountPrice || 0);
        if (data.conditionType === PromotionConditionTypeEnum.PRICE.type) {
          item.limit = convertToInteger(item.limit || 0);
        }
      });

      // 4. 设置商品范围
      setProductScopeValues(data);

      if (formData.value?.id) {
        await updateRewardActivity(<MallRewardActivityApi.RewardActivity>data);
        message.success($t('common.updateSuccess'));
      } else {
        await createRewardActivity(<MallRewardActivityApi.RewardActivity>data);
        message.success($t('common.createSuccess'));
      }
      await modalApi.close();
      emit('success');
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

    const data = modalApi.getData();
    if (!data || !data.id) return;

    modalApi.lock();
    try {
      const result = await getReward(data.id);

      // 转区段时间
      result.startAndEndTime = [result.startTime, result.endTime];

      // 规则分转元
      result.rules?.forEach((item: any) => {
        item.discountPrice = formatToFraction(item.discountPrice || 0);
        if (result.conditionType === PromotionConditionTypeEnum.PRICE.type) {
          item.limit = formatToFraction(item.limit || 0);
        }
      });

      formData.value = result;
      await formApi.setValues(result);

      // 获得商品范围
      await getProductScope();
    } finally {
      modalApi.unlock();
    }
  },
});

/** 获得商品范围 */
async function getProductScope() {
  switch (formData.value.productScope) {
    case PromotionProductScopeEnum.CATEGORY.scope: {
      await nextTick();
      let productCategoryIds = formData.value.productScopeValues as any;
      if (
        Array.isArray(productCategoryIds) &&
        productCategoryIds.length === 1
      ) {
        // 单选时使用数组不能反显
        productCategoryIds = productCategoryIds[0];
      }
      // 设置品类编号
      formData.value.productCategoryIds = productCategoryIds;
      break;
    }
    case PromotionProductScopeEnum.SPU.scope: {
      // 设置商品编号
      formData.value.productSpuIds = formData.value.productScopeValues;
      break;
    }
    default: {
      break;
    }
  }
}

/** 设置商品范围 */
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
  <Modal :title="getTitle" class="!w-[65%]">
    <Alert
      description="【营销】满减送"
      message="提示"
      show-icon
      type="info"
      class="mb-4"
    />

    <Form />

    <!-- 优惠设置 -->
    <FormItem label="优惠设置">
      <RewardRule ref="rewardRuleRef" v-model="formData" />
    </FormItem>

    <!-- 商品范围选择 -->
    <FormItem
      v-if="formData.productScope === PromotionProductScopeEnum.SPU.scope"
      label="选择商品"
    >
      <SpuAndSkuList
        v-model:spu-ids="formData.productSpuIds"
        :rule-config="[]"
        :spu-property-list="[]"
        :deletable="true"
        :spu-list="[]"/>
    </FormItem>

    <!-- 分类选择 -->
    <!-- 注意：category 选择器暂未实现，需要根据实际需求添加 -->
  </Modal>
</template>
