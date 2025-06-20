// TODO @芋艿：后续再优化
// TODO @芋艿：可以共享么？

import type { DictItem } from '#/store';

import { isObject } from '@vben/utils';

import { useDictStore } from '#/store';

// TODO @dhb52：top-level 调用 导致："getActivePinia()" was called but there was no active Pinia
// 先临时移入到方法中
// const dictStore = useDictStore();

/** AntD 组件的颜色类型 */
type ColorType = 'error' | 'info' | 'success' | 'warning';

/** 字典值类型 */
type DictValueType = 'boolean' | 'number' | 'string';

/** 基础字典数据类型 */
export interface DictDataType {
  dictType?: string;
  label: string;
  value: boolean | number | string;
  colorType?: string;
  cssClass?: string;
}

/** 数字类型字典数据 */
export interface NumberDictDataType extends DictDataType {
  value: number;
}

/** 字符串类型字典数据 */
export interface StringDictDataType extends DictDataType {
  value: string;
}

/** 布尔类型字典数据 */
export interface BooleanDictDataType extends DictDataType {
  value: boolean;
}

/** 字典缓存管理器 */
class DictCacheManager {
  private cache = new Map<string, DictDataType[]>();
  private maxCacheSize = 100; // 最大缓存数量

  /** 清空缓存 */
  clear(): void {
    this.cache.clear();
  }

  /** 删除指定字典类型的缓存 */
  delete(dictType: string): void {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${dictType}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /** 获取缓存数据 */
  get(dictType: string, valueType: DictValueType): DictDataType[] | undefined {
    return this.cache.get(this.getCacheKey(dictType, valueType));
  }

  /** 设置缓存数据 */
  set(dictType: string, valueType: DictValueType, data: DictDataType[]): void {
    const key = this.getCacheKey(dictType, valueType);

    // 如果缓存数量超过限制，删除最早的缓存
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, data);
  }

  /** 获取缓存键 */
  private getCacheKey(dictType: string, valueType: DictValueType): string {
    return `${dictType}:${valueType}`;
  }
}

/** 字典缓存实例 */
const dictCache = new DictCacheManager();

/** 值转换器映射 */
const valueConverters: Record<
  DictValueType,
  (value: any) => boolean | number | string
> = {
  boolean: (value: any) => `${value}` === 'true',
  number: (value: any) => Number.parseInt(`${value}`, 10),
  string: (value: any) => `${value}`,
};

/**
 * 获取字典标签
 * @param dictType 字典类型
 * @param value 字典值
 * @returns 字典标签
 */
function getDictLabel(dictType: string, value: any): string {
  const dictStore = useDictStore();
  const dictObj = dictStore.getDictData(dictType, value);
  return isObject(dictObj) ? dictObj.label : '';
}

/**
 * 获取字典对象
 * @param dictType 字典类型
 * @param value 字典值
 * @returns 字典对象
 */
function getDictObj(dictType: string, value: any): DictItem | null {
  const dictStore = useDictStore();
  const dictObj = dictStore.getDictData(dictType, value);
  return isObject(dictObj) ? dictObj : null;
}

/**
 * 获取字典数组 - 优化版本，支持缓存和泛型
 * @param dictType 字典类型
 * @param valueType 字典值类型，默认 string 类型
 * @returns 字典数组
 */
function getDictOptions<T extends DictValueType = 'string'>(
  dictType: string,
  valueType: T = 'string' as T,
): T extends 'number'
  ? NumberDictDataType[]
  : T extends 'boolean'
    ? BooleanDictDataType[]
    : StringDictDataType[] {
  // 检查缓存
  const cachedData = dictCache.get(dictType, valueType);
  if (cachedData) {
    return cachedData as any;
  }

  const dictStore = useDictStore();
  const dictOpts = dictStore.getDictOptions(dictType);

  if (dictOpts.length === 0) {
    return [] as any;
  }

  const converter = valueConverters[valueType];
  const dictOptions: DictDataType[] = dictOpts.map((d: DictItem) => ({
    value: converter(d.value),
    label: d.label,
    colorType: d.colorType,
    cssClass: d.cssClass,
  }));

  // 缓存结果
  dictCache.set(dictType, valueType, dictOptions);

  return dictOptions as any;
}

/**
 * 清空字典缓存
 */
export const clearDictCache = (): void => {
  dictCache.clear();
};

/**
 * 删除指定字典类型的缓存
 * @param dictType 字典类型
 */
export const deleteDictCache = (dictType: string): void => {
  dictCache.delete(dictType);
};

/** 字典类型枚举 - 按模块分组和排序 */
enum DICT_TYPE {
  AI_GENERATE_MODE = 'ai_generate_mode', // AI 生成模式
  AI_IMAGE_STATUS = 'ai_image_status', // AI 图片状态
  AI_MODEL_TYPE = 'ai_model_type', // AI 模型类型
  AI_MUSIC_STATUS = 'ai_music_status', // AI 音乐状态
  // ========== AI - 人工智能模块  ==========
  AI_PLATFORM = 'ai_platform', // AI 平台
  AI_WRITE_FORMAT = 'ai_write_format', // AI 写作格式
  AI_WRITE_LANGUAGE = 'ai_write_language', // AI 写作语言
  AI_WRITE_LENGTH = 'ai_write_length', // AI 写作长度
  AI_WRITE_TONE = 'ai_write_tone', // AI 写作语气
  AI_WRITE_TYPE = 'ai_write_type', // AI 写作类型
  BPM_MODEL_FORM_TYPE = 'bpm_model_form_type',
  // ========== BPM 模块 ==========
  BPM_MODEL_TYPE = 'bpm_model_type',
  BPM_OA_LEAVE_TYPE = 'bpm_oa_leave_type',
  BPM_PROCESS_INSTANCE_STATUS = 'bpm_process_instance_status',
  BPM_PROCESS_LISTENER_TYPE = 'bpm_process_listener_type',
  BPM_PROCESS_LISTENER_VALUE_TYPE = 'bpm_process_listener_value_type',
  BPM_TASK_CANDIDATE_STRATEGY = 'bpm_task_candidate_strategy',
  BPM_TASK_STATUS = 'bpm_task_status',
  BROKERAGE_BANK_NAME = 'brokerage_bank_name', // 佣金提现银行
  BROKERAGE_BIND_MODE = 'brokerage_bind_mode', // 分销关系绑定模式

  BROKERAGE_ENABLED_CONDITION = 'brokerage_enabled_condition', // 分佣模式
  BROKERAGE_RECORD_BIZ_TYPE = 'brokerage_record_biz_type', // 佣金业务类型
  BROKERAGE_RECORD_STATUS = 'brokerage_record_status', // 佣金状态
  BROKERAGE_WITHDRAW_STATUS = 'brokerage_withdraw_status', // 佣金提现状态
  BROKERAGE_WITHDRAW_TYPE = 'brokerage_withdraw_type', // 佣金提现类型
  COMMON_STATUS = 'common_status',
  // ========== CRM - 客户管理模块 ==========
  CRM_AUDIT_STATUS = 'crm_audit_status', // CRM 审批状态
  CRM_BIZ_TYPE = 'crm_biz_type', // CRM 业务类型
  CRM_BUSINESS_END_STATUS_TYPE = 'crm_business_end_status_type', // CRM 商机结束状态类型
  CRM_CUSTOMER_INDUSTRY = 'crm_customer_industry', // CRM 客户所属行业

  CRM_CUSTOMER_LEVEL = 'crm_customer_level', // CRM 客户级别
  CRM_CUSTOMER_SOURCE = 'crm_customer_source', // CRM 客户来源
  CRM_FOLLOW_UP_TYPE = 'crm_follow_up_type', // CRM 跟进方式
  CRM_PERMISSION_LEVEL = 'crm_permission_level', // CRM 数据权限的级别
  CRM_PRODUCT_STATUS = 'crm_product_status', // CRM 商品状态
  CRM_PRODUCT_UNIT = 'crm_product_unit', // CRM 产品单位
  CRM_RECEIVABLE_RETURN_TYPE = 'crm_receivable_return_type', // CRM 回款的还款方式
  DATE_INTERVAL = 'date_interval', // 数据间隔

  // ========== ERP - 企业资源计划模块  ==========
  ERP_AUDIT_STATUS = 'erp_audit_status', // ERP 审批状态
  ERP_STOCK_RECORD_BIZ_TYPE = 'erp_stock_record_biz_type', // 库存明细的业务类型
  // ========== MALL - 交易模块 ==========
  EXPRESS_CHARGE_MODE = 'trade_delivery_express_charge_mode', // 快递的计费方式
  INFRA_API_ERROR_LOG_PROCESS_STATUS = 'infra_api_error_log_process_status',
  // ========== INFRA 模块 ==========
  INFRA_BOOLEAN_STRING = 'infra_boolean_string',
  INFRA_CODEGEN_FRONT_TYPE = 'infra_codegen_front_type',
  INFRA_CODEGEN_SCENE = 'infra_codegen_scene',

  INFRA_CODEGEN_TEMPLATE_TYPE = 'infra_codegen_template_type',
  INFRA_CONFIG_TYPE = 'infra_config_type',

  INFRA_FILE_STORAGE = 'infra_file_storage',
  INFRA_JOB_LOG_STATUS = 'infra_job_log_status',

  INFRA_JOB_STATUS = 'infra_job_status',

  INFRA_OPERATE_TYPE = 'infra_operate_type',
  IOT_DATA_FORMAT = 'iot_data_format', // IOT 数据格式
  IOT_DATA_TYPE = 'iot_data_type', // IOT 数据类型
  IOT_DEVICE_STATUS = 'iot_device_status', // IOT 设备状态
  // ========== IOT - 物联网模块  ==========
  IOT_NET_TYPE = 'iot_net_type', // IOT 联网方式
  IOT_PRODUCT_DEVICE_TYPE = 'iot_product_device_type', // IOT 产品设备类型
  IOT_PRODUCT_FUNCTION_TYPE = 'iot_product_function_type', // IOT 产品功能类型
  IOT_PRODUCT_STATUS = 'iot_product_status', // IOT 产品状态
  IOT_PROTOCOL_TYPE = 'iot_protocol_type', // IOT 接入网关协议
  IOT_RW_TYPE = 'iot_rw_type', // IOT 读写类型
  IOT_UNIT_TYPE = 'iot_unit_type', // IOT 单位类型
  IOT_VALIDATE_TYPE = 'iot_validate_type', // IOT 数据校验级别
  MEMBER_EXPERIENCE_BIZ_TYPE = 'member_experience_biz_type', // 会员经验业务类型
  // ========== Member 会员模块 ==========
  MEMBER_POINT_BIZ_TYPE = 'member_point_biz_type', // 积分的业务类型
  // ========== MP 模块 ==========
  MP_AUTO_REPLY_REQUEST_MATCH = 'mp_auto_reply_request_match', // 自动回复请求匹配类型

  MP_MESSAGE_TYPE = 'mp_message_type', // 消息类型
  // ========== PAY 模块 ==========
  PAY_CHANNEL_CODE = 'pay_channel_code', // 支付渠道编码类型
  PAY_NOTIFY_STATUS = 'pay_notify_status', // 商户支付回调状态
  PAY_NOTIFY_TYPE = 'pay_notify_type', // 商户支付回调状态
  PAY_ORDER_STATUS = 'pay_order_status', // 商户支付订单状态
  PAY_REFUND_STATUS = 'pay_refund_status', // 退款订单状态
  PAY_TRANSFER_STATUS = 'pay_transfer_status', // 转账订单状态
  PAY_TRANSFER_TYPE = 'pay_transfer_type', // 转账订单状态
  // ========== MALL - 商品模块 ==========
  PRODUCT_SPU_STATUS = 'product_spu_status', // 商品状态

  PROMOTION_BANNER_POSITION = 'promotion_banner_position', // banner 定位
  PROMOTION_BARGAIN_RECORD_STATUS = 'promotion_bargain_record_status', // 砍价记录的状态
  PROMOTION_COMBINATION_RECORD_STATUS = 'promotion_combination_record_status', // 拼团记录的状态
  PROMOTION_CONDITION_TYPE = 'promotion_condition_type', // 营销的条件类型枚举
  PROMOTION_COUPON_STATUS = 'promotion_coupon_status', // 优惠劵的状态
  PROMOTION_COUPON_TAKE_TYPE = 'promotion_coupon_take_type', // 优惠劵的领取方式
  PROMOTION_COUPON_TEMPLATE_VALIDITY_TYPE = 'promotion_coupon_template_validity_type', // 优惠劵模板的有限期类型
  // ========== MALL - 营销模块 ==========
  PROMOTION_DISCOUNT_TYPE = 'promotion_discount_type', // 优惠类型
  PROMOTION_PRODUCT_SCOPE = 'promotion_product_scope', // 营销的商品范围
  SYSTEM_DATA_SCOPE = 'system_data_scope',
  SYSTEM_LOGIN_RESULT = 'system_login_result',

  SYSTEM_LOGIN_TYPE = 'system_login_type',
  SYSTEM_MAIL_SEND_STATUS = 'system_mail_send_status',

  SYSTEM_MENU_TYPE = 'system_menu_type',
  SYSTEM_NOTICE_TYPE = 'system_notice_type',
  SYSTEM_NOTIFY_TEMPLATE_TYPE = 'system_notify_template_type',
  SYSTEM_OAUTH2_GRANT_TYPE = 'system_oauth2_grant_type',
  SYSTEM_ROLE_TYPE = 'system_role_type',
  SYSTEM_SMS_CHANNEL_CODE = 'system_sms_channel_code',
  SYSTEM_SMS_RECEIVE_STATUS = 'system_sms_receive_status',
  SYSTEM_SMS_SEND_STATUS = 'system_sms_send_status',
  SYSTEM_SMS_TEMPLATE_TYPE = 'system_sms_template_type',

  SYSTEM_SOCIAL_TYPE = 'system_social_type',
  // ========== SYSTEM 模块 ==========
  SYSTEM_USER_SEX = 'system_user_sex',
  TERMINAL = 'terminal', // 终端
  TRADE_AFTER_SALE_STATUS = 'trade_after_sale_status', // 售后 - 状态
  TRADE_AFTER_SALE_TYPE = 'trade_after_sale_type', // 售后 - 类型
  TRADE_AFTER_SALE_WAY = 'trade_after_sale_way', // 售后 - 方式
  TRADE_DELIVERY_TYPE = 'trade_delivery_type', // 配送方式
  TRADE_ORDER_ITEM_AFTER_SALE_STATUS = 'trade_order_item_after_sale_status', // 订单项 - 售后状态
  TRADE_ORDER_STATUS = 'trade_order_status', // 订单 - 状态
  TRADE_ORDER_TYPE = 'trade_order_type', // 订单 - 类型
  USER_TYPE = 'user_type',
}

export {
  type ColorType,
  DICT_TYPE,
  type DictValueType,
  getDictLabel,
  getDictObj,
  getDictOptions,
};
