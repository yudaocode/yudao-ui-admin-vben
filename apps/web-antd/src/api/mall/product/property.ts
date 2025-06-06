import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace PropertyApi {
  /** 商品属性 */
  export interface Property {
    /** 属性编号 */
    id?: number;
    /** 名称 */
    name: string;
    /** 备注 */
    remark?: string;
  }

  /** 属性值 */
  export interface PropertyValue {
    /** 属性值编号 */
    id?: number;
    /** 属性项的编号 */
    propertyId?: number;
    /** 名称 */
    name: string;
    /** 备注 */
    remark?: string;
  }

  /** 属性值查询参数 */
  export interface PropertyValueQuery extends PageParam {
    propertyId?: number;
  }
}

/** 创建属性项 */
export function createProperty(data: PropertyApi.Property) {
  return requestClient.post('/product/property/create', data);
}

/** 更新属性项 */
export function updateProperty(data: PropertyApi.Property) {
  return requestClient.put('/product/property/update', data);
}

/** 删除属性项 */
export function deleteProperty(id: number) {
  return requestClient.delete(`/product/property/delete?id=${id}`);
}

/** 获得属性项 */
export function getProperty(id: number) {
  return requestClient.get<PropertyApi.Property>(
    `/product/property/get?id=${id}`,
  );
}

/** 获得属性项分页 */
export function getPropertyPage(params: PageParam) {
  return requestClient.get<PageResult<PropertyApi.Property>>(
    '/product/property/page',
    { params },
  );
}

/** 获得属性项精简列表 */
export function getPropertySimpleList() {
  return requestClient.get<PropertyApi.Property[]>(
    '/product/property/simple-list',
  );
}

/** 获得属性值分页 */
export function getPropertyValuePage(params: PropertyApi.PropertyValueQuery) {
  return requestClient.get<PageResult<PropertyApi.PropertyValue>>(
    '/product/property/value/page',
    { params },
  );
}

/** 获得属性值 */
export function getPropertyValue(id: number) {
  return requestClient.get<PropertyApi.PropertyValue>(
    `/product/property/value/get?id=${id}`,
  );
}

/** 创建属性值 */
export function createPropertyValue(data: PropertyApi.PropertyValue) {
  return requestClient.post('/product/property/value/create', data);
}

/** 更新属性值 */
export function updatePropertyValue(data: PropertyApi.PropertyValue) {
  return requestClient.put('/product/property/value/update', data);
}

/** 删除属性值 */
export function deletePropertyValue(id: number) {
  return requestClient.delete(`/product/property/value/delete?id=${id}`);
}

/** 获得属性值精简列表 */
export function getPropertyValueSimpleList(propertyId: number) {
  return requestClient.get<PropertyApi.PropertyValue[]>(
    '/product/property/value/simple-list',
    {
      params: { propertyId },
    },
  );
}
