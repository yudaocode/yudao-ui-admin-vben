import { requestClient } from '#/api/request';

export namespace CrmStatisticsProductApi {
  /** 产品销售情况统计响应 */
  export interface ProductSalesRespVO {
    categoryId: number;
    categoryName: string;
    productId: number;
    productName: string;
    contractId: number;
    contractNo: string;
    contractName: string;
    ownerUserId: number;
    ownerUserName: string;
    customerId: number;
    customerName: string;
    productPrice: number;
    productCount: number;
    productTotalPrice: number;
  }

  /** 产品分类销售分析响应 */
  export interface ProductCategoryRespVO {
    categoryId: number;
    categoryName: string;
    contractCount: number;
    productCount: number;
    productTotalPrice: number;
  }
}

/** 获得产品销售情况统计 */
export function getProductSalesList(params: any) {
  return requestClient.get<CrmStatisticsProductApi.ProductSalesRespVO[]>(
    '/crm/statistics-product/get-product-sales-list',
    { params },
  );
}

/** 获得产品分类销售分析 */
export function getProductCategorySummary(params: any) {
  return requestClient.get<CrmStatisticsProductApi.ProductCategoryRespVO[]>(
    '/crm/statistics-product/get-product-category-summary',
    { params },
  );
}
