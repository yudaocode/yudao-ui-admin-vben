import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MallCouponApi {
  /** 优惠券 */
  export interface Coupon {
    /** 优惠券编号 */
    id: number;
    /** 优惠券名称 */
    name: string;
    /** 优惠券状态 */
    status: number;
    /** 优惠券类型 */
    type: number;
    /** 优惠券金额 */
    price: number;
    /** 使用门槛 */
    usePrice: number;
    /** 商品范围 */
    productScope: number;
    /** 商品编号数组 */
    productSpuIds: number[];
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
    /** 每人限领个数 */
    takeLimitCount: number;
    /** 是否设置满多少金额可用 */
    usePriceEnabled: boolean;
    /** 商品分类编号数组 */
    productCategoryIds: number[];
  }

  /** 发送优惠券 */
  export interface SendCoupon {
    /** 优惠券编号 */
    couponId: number;
    /** 用户编号数组 */
    userIds: number[];
  }
}

/** 删除优惠劵 */
export function deleteCoupon(id: number) {
  return requestClient.delete(`/promotion/coupon/delete?id=${id}`);
}

/** 获得优惠劵分页 */
export function getCouponPage(params: PageParam) {
  return requestClient.get<PageResult<MallCouponApi.Coupon>>(
    '/promotion/coupon/page',
    { params },
  );
}

/** 发送优惠券 */
export function sendCoupon(data: MallCouponApi.SendCoupon) {
  return requestClient.post('/promotion/coupon/send', data);
}
