<script lang="ts" setup>
import type { MallSpuApi } from '#/api/mall/product/spu';
import type { MallSeckillActivityApi } from '#/api/mall/promotion/seckill/seckillActivity';
import type {
  RuleConfig,
  SpuProperty,
} from '#/views/mall/product/spu/components';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { cloneDeep, convertToInteger, formatToFraction } from '@vben/utils';

import { ElButton, ElInputNumber, ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { VxeColumn } from '#/adapter/vxe-table';
import { getSpu } from '#/api/mall/product/spu';
import {
  createSeckillActivity,
  getSeckillActivity,
  updateSeckillActivity,
} from '#/api/mall/promotion/seckill/seckillActivity';
import { $t } from '#/locales';
import {
  getPropertyList,
  SpuAndSkuList,
  SpuSkuSelect,
} from '#/views/mall/product/spu/components';

import { useFormSchema } from '../data';

defineOptions({ name: 'PromotionSeckillActivityForm' });

const emit = defineEmits(['success']);

const formData = ref<MallSeckillActivityApi.SeckillActivity>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['秒杀活动'])
    : $t('ui.actionTitle.create', ['秒杀活动']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 120,
  },
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
});

// ================= 商品选择相关 =================

const spuSkuSelectRef = ref(); // 商品和属性选择 Ref
const spuAndSkuListRef = ref(); // SPU 和 SKU 列表组件 Ref

const ruleConfig: RuleConfig[] = [
  {
    name: 'productConfig.stock',
    rule: (arg) => arg >= 1,
    message: '商品秒杀库存必须大于等于 1 ！！！',
  },
  {
    name: 'productConfig.seckillPrice',
    rule: (arg) => arg >= 0.01,
    message: '商品秒杀价格必须大于等于 0.01 ！！！',
  },
];

const spuList = ref<MallSpuApi.Spu[]>([]); // 选择的 SPU 列表
const spuPropertyList = ref<SpuProperty<MallSpuApi.Spu>[]>([]); // SPU 属性列表

/** 打开商品选择器 */
function openSpuSelect() {
  spuSkuSelectRef.value?.open();
}

/** 选择商品后的回调 */
async function handleSpuSelected(spuId: number, skuIds?: number[]) {
  await formApi.setFieldValue('spuId', spuId);
  await getSpuDetails(spuId, skuIds);
}

/** 获取 SPU 详情 */
async function getSpuDetails(
  spuId: number,
  skuIds?: number[],
  products?: MallSeckillActivityApi.SeckillProduct[],
) {
  const res = await getSpu(spuId);
  if (!res) {
    return;
  }

  spuList.value = [];

  // 筛选指定的 SKU
  const selectSkus =
    skuIds === undefined
      ? res.skus
      : res.skus?.filter((sku) => skuIds.includes(sku.id!));

  // 为每个 SKU 配置秒杀活动相关的配置
  selectSkus?.forEach((sku) => {
    let config: MallSeckillActivityApi.SeckillProduct = {
      spuId: res.id!,
      skuId: sku.id!,
      stock: 0,
      seckillPrice: 0,
    };
    // 如果是编辑模式，回填已有配置
    if (products !== undefined) {
      const product = products.find((item) => item.skuId === sku.id);
      if (product) {
        // 分转元
        product.seckillPrice = formatToFraction(
          product.seckillPrice,
        ) as unknown as number;
      }
      config = product || config;
    }
    // 动态添加 productConfig 属性到 SKU
    (
      sku as MallSpuApi.Sku & {
        productConfig: MallSeckillActivityApi.SeckillProduct;
      }
    ).productConfig = config;
  });
  res.skus = selectSkus;

  const spuProperties: SpuProperty<MallSpuApi.Spu>[] = [
    {
      spuId: res.id!,
      spuDetail: res,
      propertyList: getPropertyList(res),
    },
  ];

  // 直接赋值，因为秒杀活动只选择一个 SPU
  spuList.value = [res];
  spuPropertyList.value = spuProperties;
}

// ================= end =================

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    try {
      // 获取秒杀商品配置（深拷贝避免直接修改原对象）
      const products: MallSeckillActivityApi.SeckillProduct[] = cloneDeep(
        spuAndSkuListRef.value?.getSkuConfigs('productConfig') || [],
      );
      if (products.length === 0) {
        ElMessage.error('请选择秒杀商品');
        return;
      }
      // 价格需要转为分
      products.forEach((item) => {
        item.seckillPrice = convertToInteger(item.seckillPrice);
      });

      // 提交表单
      const values = await formApi.getValues();
      const data = {
        ...values,
        products,
      } as MallSeckillActivityApi.SeckillActivity;

      await (formData.value?.id
        ? updateSeckillActivity(data)
        : createSeckillActivity(data));
      // 关闭并提示
      await modalApi.close();
      emit('success');
      ElMessage.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      spuList.value = [];
      spuPropertyList.value = [];
      return;
    }

    // 加载数据
    const data = modalApi.getData<MallSeckillActivityApi.SeckillActivity>();
    if (!data || !data.id) {
      return;
    }
    // 加载数据
    modalApi.lock();
    try {
      formData.value = await getSeckillActivity(data.id);
      // 对齐活动商品处理结构
      await getSpuDetails(
        formData.value.spuId!,
        formData.value.products?.map((sku) => sku.skuId),
        formData.value.products,
      );
      // 设置表单值
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <div>
    <Modal :title="getTitle" class="w-[70%]">
      <Form class="mx-4">
        <!-- 商品选择 -->
        <template #spuId>
          <div class="w-full">
            <ElButton
              v-if="!formData?.id"
              type="primary"
              @click="openSpuSelect"
            >
              选择商品
            </ElButton>

            <!-- SPU 和 SKU 列表展示 -->
            <SpuAndSkuList
              ref="spuAndSkuListRef"
              :rule-config="ruleConfig"
              :spu-list="spuList"
              :spu-property-list-p="spuPropertyList"
              class="mt-4"
            >
              <!-- 扩展列：秒杀活动特有配置 -->
              <template #default>
                <VxeColumn align="center" min-width="168" title="秒杀库存">
                  <template #default="{ row: sku }">
                    <ElInputNumber
                      v-model="sku.productConfig.stock"
                      :max="sku.stock"
                      :min="0"
                      class="w-full"
                    />
                  </template>
                </VxeColumn>
                <VxeColumn align="center" min-width="168" title="秒杀价格(元)">
                  <template #default="{ row: sku }">
                    <ElInputNumber
                      v-model="sku.productConfig.seckillPrice"
                      :min="0"
                      :precision="2"
                      :step="0.1"
                      class="w-full"
                    />
                  </template>
                </VxeColumn>
              </template>
            </SpuAndSkuList>
          </div>
        </template>
      </Form>
    </Modal>

    <!-- 商品选择器弹窗 -->
    <SpuSkuSelect
      ref="spuSkuSelectRef"
      :is-select-sku="true"
      @select="handleSpuSelected"
    />
  </div>
</template>
