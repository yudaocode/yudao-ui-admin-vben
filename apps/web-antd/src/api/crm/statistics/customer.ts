import type { PageParam } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace CrmStatisticsCustomerApi {
  /** 客户总量分析(按日期) */
  export interface CustomerSummaryByDate {
    time: string;
    customerCreateCount: number;
    customerDealCount: number;
  }

  /** 客户总量分析(按用户) */
  export interface CustomerSummaryByUser {
    ownerUserName: string;
    customerCreateCount: number;
    customerDealCount: number;
    contractPrice: number;
    receivablePrice: number;
  }

  /** 客户跟进次数分析(按日期) */
  export interface FollowUpSummaryByDate {
    time: string;
    followUpRecordCount: number;
    followUpCustomerCount: number;
  }

  /** 客户跟进次数分析(按用户) */
  export interface FollowUpSummaryByUser {
    ownerUserName: string;
    followupRecordCount: number;
    followupCustomerCount: number;
  }

  /** 客户跟进方式统计 */
  export interface FollowUpSummaryByType {
    followUpType: string;
    followUpRecordCount: number;
  }

  /** 合同摘要信息 */
  export interface CustomerContractSummary {
    customerName: string;
    contractName: string;
    totalPrice: number;
    receivablePrice: number;
    customerType: string;
    customerSource: string;
    ownerUserName: string;
    creatorUserName: string;
    createTime: Date;
    orderDate: Date;
  }

  /** 客户公海分析(按日期) */
  export interface PoolSummaryByDate {
    time: string;
    customerPutCount: number;
    customerTakeCount: number;
  }

  /** 客户公海分析(按用户) */
  export interface PoolSummaryByUser {
    ownerUserName: string;
    customerPutCount: number;
    customerTakeCount: number;
  }

  /** 客户成交周期(按日期) */
  export interface CustomerDealCycleByDate {
    time: string;
    customerDealCycle: number;
  }

  /** 客户成交周期(按用户) */
  export interface CustomerDealCycleByUser {
    ownerUserName: string;
    customerDealCycle: number;
    customerDealCount: number;
  }

  /** 客户成交周期(按地区) */
  export interface CustomerDealCycleByArea {
    areaName: string;
    customerDealCycle: number;
    customerDealCount: number;
  }

  /** 客户成交周期(按产品) */
  export interface CustomerDealCycleByProduct {
    productName: string;
    customerDealCycle: number;
    customerDealCount: number;
  }
}

/** 客户总量分析(按日期) */
export function getCustomerSummaryByDate(params: PageParam) {
  return requestClient.get<CrmStatisticsCustomerApi.CustomerSummaryByDate[]>(
    '/crm/statistics-customer/get-customer-summary-by-date',
    { params },
  );
}

/** 客户总量分析(按用户) */
export function getCustomerSummaryByUser(params: PageParam) {
  return requestClient.get<CrmStatisticsCustomerApi.CustomerSummaryByUser[]>(
    '/crm/statistics-customer/get-customer-summary-by-user',
    { params },
  );
}

/** 客户跟进次数分析(按日期) */
export function getFollowUpSummaryByDate(params: PageParam) {
  return requestClient.get<CrmStatisticsCustomerApi.FollowUpSummaryByDate[]>(
    '/crm/statistics-customer/get-follow-up-summary-by-date',
    { params },
  );
}

/** 客户跟进次数分析(按用户) */
export function getFollowUpSummaryByUser(params: PageParam) {
  return requestClient.get<CrmStatisticsCustomerApi.FollowUpSummaryByUser[]>(
    '/crm/statistics-customer/get-follow-up-summary-by-user',
    { params },
  );
}

/** 获取客户跟进方式统计数 */
export function getFollowUpSummaryByType(params: PageParam) {
  return requestClient.get<CrmStatisticsCustomerApi.FollowUpSummaryByType[]>(
    '/crm/statistics-customer/get-follow-up-summary-by-type',
    { params },
  );
}

/** 合同摘要信息(客户转化率页面) */
export function getContractSummary(params: PageParam) {
  return requestClient.get<CrmStatisticsCustomerApi.CustomerContractSummary[]>(
    '/crm/statistics-customer/get-contract-summary',
    { params },
  );
}

/** 获取客户公海分析(按日期) */
export function getPoolSummaryByDate(params: PageParam) {
  return requestClient.get<CrmStatisticsCustomerApi.PoolSummaryByDate[]>(
    '/crm/statistics-customer/get-pool-summary-by-date',
    { params },
  );
}

/** 获取客户公海分析(按用户) */
export function getPoolSummaryByUser(params: PageParam) {
  return requestClient.get<CrmStatisticsCustomerApi.PoolSummaryByUser[]>(
    '/crm/statistics-customer/get-pool-summary-by-user',
    { params },
  );
}

/** 获取客户成交周期(按日期) */
export function getCustomerDealCycleByDate(params: PageParam) {
  return requestClient.get<CrmStatisticsCustomerApi.CustomerDealCycleByDate[]>(
    '/crm/statistics-customer/get-customer-deal-cycle-by-date',
    { params },
  );
}

/** 获取客户成交周期(按用户) */
export function getCustomerDealCycleByUser(params: PageParam) {
  return requestClient.get<CrmStatisticsCustomerApi.CustomerDealCycleByUser[]>(
    '/crm/statistics-customer/get-customer-deal-cycle-by-user',
    { params },
  );
}

/** 获取客户成交周期(按地区) */
export function getCustomerDealCycleByArea(params: PageParam) {
  return requestClient.get<CrmStatisticsCustomerApi.CustomerDealCycleByArea[]>(
    '/crm/statistics-customer/get-customer-deal-cycle-by-area',
    { params },
  );
}

/** 获取客户成交周期(按产品) */
export function getCustomerDealCycleByProduct(params: PageParam) {
  return requestClient.get<
    CrmStatisticsCustomerApi.CustomerDealCycleByProduct[]
  >('/crm/statistics-customer/get-customer-deal-cycle-by-product', { params });
}
