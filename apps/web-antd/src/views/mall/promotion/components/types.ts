import type { PropertyAndValues } from '#/views/mall/product/spu/form';

/**
 * SPU 属性配置
 * 用于活动商品选择中，关联 SPU 和其属性列表
 */
export interface SpuProperty<T = any> {
  /** SPU ID */
  spuId: number;
  /** SPU 详情 */
  spuDetail: T;
  /** 属性列表 */
  propertyList: PropertyAndValues[];
}

