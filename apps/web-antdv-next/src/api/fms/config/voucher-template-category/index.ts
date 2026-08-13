import { requestClient } from '#/api/request';

export namespace FmsVoucherTemplateCategoryApi {
  /** 凭证模板分类 */
  export interface VoucherTemplateCategory {
    id?: number; // 分类编号
    accountSetId: number; // 账套编号
    name: string; // 分类名称
  }
}

/** 查询凭证模板分类列表 */
export function getVoucherTemplateCategoryList(accountSetId: number) {
  return requestClient.get<
    FmsVoucherTemplateCategoryApi.VoucherTemplateCategory[]
  >('/fms/config/voucher-template-category/list', {
    params: { accountSetId },
  });
}

/** 查询凭证模板分类精简列表 */
export function getVoucherTemplateCategorySimpleList(accountSetId: number) {
  return requestClient.get<
    FmsVoucherTemplateCategoryApi.VoucherTemplateCategory[]
  >('/fms/config/voucher-template-category/simple-list', {
    params: { accountSetId },
  });
}

/** 新增凭证模板分类 */
export function createVoucherTemplateCategory(
  data: FmsVoucherTemplateCategoryApi.VoucherTemplateCategory,
) {
  return requestClient.post<number>(
    '/fms/config/voucher-template-category/create',
    data,
  );
}

/** 修改凭证模板分类 */
export function updateVoucherTemplateCategory(
  data: FmsVoucherTemplateCategoryApi.VoucherTemplateCategory,
) {
  return requestClient.put<boolean>(
    '/fms/config/voucher-template-category/update',
    data,
  );
}

/** 删除凭证模板分类 */
export function deleteVoucherTemplateCategory(accountSetId: number, id: number) {
  return requestClient.delete<boolean>(
    '/fms/config/voucher-template-category/delete',
    { params: { accountSetId, id } },
  );
}
