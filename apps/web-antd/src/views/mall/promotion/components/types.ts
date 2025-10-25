import type { PropertyAndValues } from '#/views/mall/product/spu/form';

/**
 * SPU 属性配置
 * 用于活动商品选择中，关联 SPU 和其属性列表
 */
export interface SpuProperty<T = any> {
  spuId: number; // SPU ID
  spuDetail: T; // SPU 详情
  propertyList: PropertyAndValues[]; // 属性列表
}
