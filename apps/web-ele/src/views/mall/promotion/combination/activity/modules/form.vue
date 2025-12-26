<script lang="ts" setup>
import type { MallSpuApi } from '#/api/mall/product/spu';
import type { MallCombinationActivityApi } from '#/api/mall/promotion/combination/combinationActivity';
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
  createCombinationActivity,
  getCombinationActivity,
  updateCombinationActivity,
} from '#/api/mall/promotion/combination/combinationActivity';
import { $t } from '#/locales';
import {
  getPropertyList,
  SpuAndSkuList,
  SpuSkuSelect,
} from '#/views/mall/product/spu/components';

import { useFormSchema } from '../data';

defineOptions({ name: 'CombinationActivityForm' });

const emit = defineEmits(['success']);

const formData = ref<MallCombinationActivityApi.CombinationActivity>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['拼团活动'])
    : $t('ui.actionTitle.create', ['拼团活动']);
});

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

// ================= 商品选择相关 =================

const spuSkuSelectRef = ref(); // 商品和属性选择 Ref
const spuAndSkuListRef = ref(); // SPU 和 SKU 列表组件 Ref

const ruleConfig: RuleConfig[] = [
  {
    name: 'productConfig.combinationPrice',
    rule: (arg) => arg >= 0.01,
    message: '商品拼团价格不能小于 0.01 ！！！',
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
  products?: MallCombinationActivityApi.CombinationProduct[],
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

  // 为每个 SKU 配置拼团活动相关的配置
  selectSkus?.forEach((sku) => {
    let config: MallCombinationActivityApi.CombinationProduct = {
      spuId: res.id!,
      skuId: sku.id!,
      combinationPrice: 0,
    };
    // 如果是编辑模式，回填已有配置
    if (products !== undefined) {
      const product = products.find((item) => item.skuId === sku.id);
      if (product) {
        // 分转元
        product.combinationPrice = formatToFraction(
          product.combinationPrice,
        ) as unknown as number;
      }
      config = product || config;
    }
    // 动态添加 productConfig 属性到 SKU
    (
      sku as MallSpuApi.Sku & {
        productConfig: MallCombinationActivityApi.CombinationProduct;
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

  // 直接赋值，因为拼团活动只选择一个 SPU
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
      // 获取拼团商品配置（深拷贝避免直接修改原对象）
      const products: MallCombinationActivityApi.CombinationProduct[] =
        cloneDeep(spuAndSkuListRef.value?.getSkuConfigs('productConfig') || []);
      if (products.length === 0) {
        ElMessage.error('请选择拼团商品');
        return;
      }
      // 价格需要转为分
      products.forEach((item) => {
        item.combinationPrice = convertToInteger(item.combinationPrice);
      });

      // 提交表单
      const values = await formApi.getValues();
      const data = {
        ...values,
        products,
      } as MallCombinationActivityApi.CombinationActivity;

      await (formData.value?.id
        ? updateCombinationActivity(data)
        : createCombinationActivity(data));
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
    const data =
      modalApi.getData<MallCombinationActivityApi.CombinationActivity>();
    if (!data || !data.id) {
      return;
    }
    // 加载数据
    modalApi.lock();
    try {
      formData.value = await getCombinationActivity(data.id);
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
              <!-- 扩展列：拼团活动特有配置 -->
              <template #default>
                <VxeColumn align="center" min-width="168" title="拼团价格(元)">
                  <template #default="{ row: sku }">
                    <ElInputNumber
                      v-model="sku.productConfig.combinationPrice"
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
