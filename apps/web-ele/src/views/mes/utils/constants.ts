/** MES 物料/产品标识枚举 */
export const MesItemOrProductEnum = {
  ITEM: {
    label: '物料',
    value: 'ITEM',
  },
  PRODUCT: {
    label: '产品',
    value: 'PRODUCT',
  },
} as const;

/** MES 自动编码规则 Code 枚举 */
export const MesAutoCodeRuleCode = {
  MD_ITEM_TYPE_CODE: 'MD_ITEM_TYPE_CODE',
} as const;
