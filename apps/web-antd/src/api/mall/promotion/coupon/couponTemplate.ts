import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MallCouponTemplateApi {
  /** 优惠券模板 */
  export interface CouponTemplate {
    /** 模板编号 */
    id: number;
    /** 模板名称 */
    name: string;
    /** 状态 */
    status: number;
    /** 发放数量 */
    totalCount: number;
    /** 每人限领个数 */
    takeLimitCount: number;
    /** 领取方式 */
    takeType: number;
    /** 使用门槛 */
    usePrice: number;
    /** 商品范围 */
    productScope: number;
    /** 商品范围值 */
    productScopeValues: number[];
    /** 有效期类型 */
    validityType: number;
    /** 固定日期-生效开始时间 */
    validStartTime: Date;
    /** 固定日期-生效结束时间 */
    validEndTime: Date;
    /** 领取日期-开始天数 */
    fixedStartTerm: number;
    /** 领取日期-结束天数 */
    fixedEndTerm: number;
    /** 优惠类型 */
    discountType: number;
    /** 折扣百分比 */
    discountPercent: number;
    /** 优惠金额 */
    discountPrice: number;
    /** 折扣上限 */
    discountLimitPrice: number;
    /** 已领取数量 */
    takeCount: number;
    /** 已使用数量 */
    useCount: number;
  }

  /** 优惠券模板状态更新 */
  export interface StatusUpdate {
    /** 模板编号 */
    id: number;
    /** 状态 */
    status: 0 | 1;
  }
}

/** 创建优惠劵模板 */
export function createCouponTemplate(
  data: MallCouponTemplateApi.CouponTemplate,
) {
  return requestClient.post('/promotion/coupon-template/create', data);
}

/** 更新优惠劵模板 */
export function updateCouponTemplate(
  data: MallCouponTemplateApi.CouponTemplate,
) {
  return requestClient.put('/promotion/coupon-template/update', data);
}

/** 更新优惠劵模板的状态 */
export function updateCouponTemplateStatus(id: number, status: 0 | 1) {
  const data: MallCouponTemplateApi.StatusUpdate = { id, status };
  return requestClient.put('/promotion/coupon-template/update-status', data);
}

/** 删除优惠劵模板 */
export function deleteCouponTemplate(id: number) {
  return requestClient.delete(`/promotion/coupon-template/delete?id=${id}`);
}

/** 获得优惠劵模板 */
export function getCouponTemplate(id: number) {
  return requestClient.get<MallCouponTemplateApi.CouponTemplate>(
    `/promotion/coupon-template/get?id=${id}`,
  );
}

/** 获得优惠劵模板分页 */
export function getCouponTemplatePage(params: PageParam) {
  return requestClient.get<PageResult<MallCouponTemplateApi.CouponTemplate>>(
    '/promotion/coupon-template/page',
    { params },
  );
}

/** 获得优惠劵模板列表 */
export function getCouponTemplateList(ids: number[]) {
  return requestClient.get<MallCouponTemplateApi.CouponTemplate[]>(
    `/promotion/coupon-template/list?ids=${ids}`,
  );
}

/** 导出优惠劵模板 Excel */
export function exportCouponTemplateExcel(params: PageParam) {
  return requestClient.get('/promotion/coupon-template/export-excel', {
    params,
    responseType: 'blob',
  });
}
