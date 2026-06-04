/** ========== COMMON - 通用模块 ========== */
const COMMON_DICT = {
  USER_TYPE: 'user_type',
  COMMON_STATUS: 'common_status',
  TERMINAL: 'terminal', // 终端
  DATE_INTERVAL: 'date_interval', // 数据间隔
} as const;

/** ========== SYSTEM - 系统模块 ========== */
const SYSTEM_DICT = {
  SYSTEM_USER_SEX: 'system_user_sex',
  SYSTEM_MENU_TYPE: 'system_menu_type',
  SYSTEM_ROLE_TYPE: 'system_role_type',
  SYSTEM_DATA_SCOPE: 'system_data_scope',
  SYSTEM_NOTICE_TYPE: 'system_notice_type',
  SYSTEM_LOGIN_TYPE: 'system_login_type',
  SYSTEM_LOGIN_RESULT: 'system_login_result',
  SYSTEM_SMS_CHANNEL_CODE: 'system_sms_channel_code',
  SYSTEM_SMS_TEMPLATE_TYPE: 'system_sms_template_type',
  SYSTEM_SMS_SEND_STATUS: 'system_sms_send_status',
  SYSTEM_SMS_RECEIVE_STATUS: 'system_sms_receive_status',
  SYSTEM_OAUTH2_GRANT_TYPE: 'system_oauth2_grant_type',
  SYSTEM_MAIL_SEND_STATUS: 'system_mail_send_status',
  SYSTEM_NOTIFY_TEMPLATE_TYPE: 'system_notify_template_type',
  SYSTEM_SOCIAL_TYPE: 'system_social_type',
} as const;

/** ========== INFRA - 基础设施模块 ========== */
const INFRA_DICT = {
  INFRA_BOOLEAN_STRING: 'infra_boolean_string',
  INFRA_JOB_STATUS: 'infra_job_status',
  INFRA_JOB_LOG_STATUS: 'infra_job_log_status',
  INFRA_API_ERROR_LOG_PROCESS_STATUS: 'infra_api_error_log_process_status',
  INFRA_CONFIG_TYPE: 'infra_config_type',
  INFRA_CODEGEN_TEMPLATE_TYPE: 'infra_codegen_template_type',
  INFRA_CODEGEN_FRONT_TYPE: 'infra_codegen_front_type',
  INFRA_CODEGEN_SCENE: 'infra_codegen_scene',
  INFRA_FILE_STORAGE: 'infra_file_storage',
  INFRA_OPERATE_TYPE: 'infra_operate_type',
} as const;

/** ========== BPM - 工作流模块 ========== */
const BPM_DICT = {
  BPM_MODEL_FORM_TYPE: 'bpm_model_form_type', // BPM 模型表单类型
  BPM_MODEL_TYPE: 'bpm_model_type', // BPM 模型类型
  BPM_OA_LEAVE_TYPE: 'bpm_oa_leave_type', // BPM OA 请假类型
  BPM_PROCESS_INSTANCE_STATUS: 'bpm_process_instance_status', // BPM 流程实例状态
  BPM_PROCESS_LISTENER_TYPE: 'bpm_process_listener_type', // BPM 流程监听器类型
  BPM_PROCESS_LISTENER_VALUE_TYPE: 'bpm_process_listener_value_type', // BPM 流程监听器值类型
  BPM_TASK_CANDIDATE_STRATEGY: 'bpm_task_candidate_strategy', // BPM 任务候选人策略
  BPM_TASK_STATUS: 'bpm_task_status', // BPM 任务状态
} as const;

/** ========== PAY - 支付模块 ========== */
const PAY_DICT = {
  PAY_CHANNEL_CODE: 'pay_channel_code', // 支付渠道编码类型
  PAY_ORDER_STATUS: 'pay_order_status', // 商户支付订单状态
  PAY_REFUND_STATUS: 'pay_refund_status', // 退款订单状态
  PAY_NOTIFY_STATUS: 'pay_notify_status', // 商户支付回调状态
  PAY_NOTIFY_TYPE: 'pay_notify_type', // 商户支付回调状态
  PAY_TRANSFER_STATUS: 'pay_transfer_status', // 转账订单状态
  PAY_TRANSFER_TYPE: 'pay_transfer_type', // 转账类型
} as const;

/** ========== MP - 公众号模块 ========== */
const MP_DICT = {
  MP_AUTO_REPLY_REQUEST_MATCH: 'mp_auto_reply_request_match', // 自动回复请求匹配类型
  MP_MESSAGE_TYPE: 'mp_message_type', // 消息类型
} as const;

/** ========== MEMBER - 会员模块 ========== */
const MEMBER_DICT = {
  MEMBER_EXPERIENCE_BIZ_TYPE: 'member_experience_biz_type', // 会员经验业务类型
  MEMBER_POINT_BIZ_TYPE: 'member_point_biz_type', // 积分的业务类型
} as const;

/** ========== MALL - 商城模块 ========== */
const MALL_DICT = {
  /** ========== MALL - 商品模块 ========== */
  PRODUCT_SPU_STATUS: 'product_spu_status', // 商品状态

  /** ========== MALL - 交易模块 ========== */
  EXPRESS_CHARGE_MODE: 'trade_delivery_express_charge_mode', // 快递的计费方式
  TRADE_AFTER_SALE_STATUS: 'trade_after_sale_status', // 售后 - 状态
  TRADE_AFTER_SALE_TYPE: 'trade_after_sale_type', // 售后 - 类型
  TRADE_AFTER_SALE_WAY: 'trade_after_sale_way', // 售后 - 方式
  TRADE_DELIVERY_TYPE: 'trade_delivery_type', // 配送方式
  TRADE_ORDER_ITEM_AFTER_SALE_STATUS: 'trade_order_item_after_sale_status', // 订单项 - 售后状态
  TRADE_ORDER_STATUS: 'trade_order_status', // 订单 - 状态
  TRADE_ORDER_TYPE: 'trade_order_type', // 订单 - 类型
  BROKERAGE_BANK_NAME: 'brokerage_bank_name', // 佣金提现银行
  BROKERAGE_BIND_MODE: 'brokerage_bind_mode', // 分销关系绑定模式
  BROKERAGE_ENABLED_CONDITION: 'brokerage_enabled_condition', // 分佣模式
  BROKERAGE_RECORD_BIZ_TYPE: 'brokerage_record_biz_type', // 佣金业务类型
  BROKERAGE_RECORD_STATUS: 'brokerage_record_status', // 佣金状态
  BROKERAGE_WITHDRAW_STATUS: 'brokerage_withdraw_status', // 佣金提现状态
  BROKERAGE_WITHDRAW_TYPE: 'brokerage_withdraw_type', // 佣金提现类型

  /** ========== MALL - 营销模块 ========== */

  PROMOTION_BANNER_POSITION: 'promotion_banner_position', // banner 定位
  PROMOTION_BARGAIN_RECORD_STATUS: 'promotion_bargain_record_status', // 砍价记录的状态
  PROMOTION_COMBINATION_RECORD_STATUS: 'promotion_combination_record_status', // 拼团记录的状态
  PROMOTION_CONDITION_TYPE: 'promotion_condition_type', // 营销的条件类型枚举
  PROMOTION_COUPON_STATUS: 'promotion_coupon_status', // 优惠劵的状态
  PROMOTION_COUPON_TAKE_TYPE: 'promotion_coupon_take_type', // 优惠劵的领取方式
  PROMOTION_COUPON_TEMPLATE_VALIDITY_TYPE:
    'promotion_coupon_template_validity_type', // 优惠劵模板的有限期类型
  PROMOTION_DISCOUNT_TYPE: 'promotion_discount_type', // 优惠类型
  PROMOTION_PRODUCT_SCOPE: 'promotion_product_scope', // 营销的商品范围
} as const;

/** ========== CRM - 客户管理模块 ========== */
const CRM_DICT = {
  CRM_AUDIT_STATUS: 'crm_audit_status', // CRM 审批状态
  CRM_BIZ_TYPE: 'crm_biz_type', // CRM 业务类型
  CRM_BUSINESS_END_STATUS_TYPE: 'crm_business_end_status_type', // CRM 商机结束状态类型
  CRM_CUSTOMER_INDUSTRY: 'crm_customer_industry', // CRM 客户所属行业
  CRM_CUSTOMER_LEVEL: 'crm_customer_level', // CRM 客户级别
  CRM_CUSTOMER_SOURCE: 'crm_customer_source', // CRM 客户来源
  CRM_FOLLOW_UP_TYPE: 'crm_follow_up_type', // CRM 跟进方式
  CRM_PERMISSION_LEVEL: 'crm_permission_level', // CRM 数据权限的级别
  CRM_PRODUCT_STATUS: 'crm_product_status', // CRM 商品状态
  CRM_PRODUCT_UNIT: 'crm_product_unit', // CRM 产品单位
  CRM_RECEIVABLE_RETURN_TYPE: 'crm_receivable_return_type', // CRM 回款的还款方式
} as const;

/** ========== ERP - 企业资源计划模块 ========== */
const ERP_DICT = {
  ERP_AUDIT_STATUS: 'erp_audit_status', // ERP 审批状态
  ERP_STOCK_RECORD_BIZ_TYPE: 'erp_stock_record_biz_type', // 库存明细的业务类型
} as const;

/** ========== AI - 人工智能模块 ========== */
const AI_DICT = {
  AI_GENERATE_MODE: 'ai_generate_mode', // AI 生成模式
  AI_IMAGE_STATUS: 'ai_image_status', // AI 图片状态
  AI_MODEL_TYPE: 'ai_model_type', // AI 模型类型
  AI_MUSIC_STATUS: 'ai_music_status', // AI 音乐状态
  AI_PLATFORM: 'ai_platform', // AI 平台
  AI_WRITE_FORMAT: 'ai_write_format', // AI 写作格式
  AI_WRITE_LANGUAGE: 'ai_write_language', // AI 写作语言
  AI_WRITE_LENGTH: 'ai_write_length', // AI 写作长度
  AI_WRITE_TONE: 'ai_write_tone', // AI 写作语气
  AI_WRITE_TYPE: 'ai_write_type', // AI 写作类型
  AI_MCP_CLIENT_NAME: 'ai_mcp_client_name', // AI MCP Client 名字
} as const;

/** ========== IOT - 物联网模块 ========== */
const IOT_DICT = {
  IOT_ALERT_LEVEL: 'iot_alert_level', // IoT 告警级别
  IOT_ALERT_RECEIVE_TYPE: 'iot_alert_receive_type', // IoT 告警接收类型
  IOT_SERIALIZE_TYPE: 'iot_serialize_type', // IOT 序列化类型
  IOT_DATA_FORMAT: 'iot_data_format', // IOT 数据格式
  IOT_DATA_SINK_TYPE_ENUM: 'iot_data_sink_type_enum', // IoT 数据流转目的类型
  IOT_DATA_TYPE: 'iot_data_type', // IOT 数据类型
  IOT_DEVICE_STATE: 'iot_device_state', // IOT 设备状态
  IOT_LOCATION_TYPE: 'iot_location_type', // IOT 定位类型
  IOT_NET_TYPE: 'iot_net_type', // IOT 联网方式
  IOT_OTA_TASK_DEVICE_SCOPE: 'iot_ota_task_device_scope', // IoT OTA任务设备范围
  IOT_OTA_TASK_RECORD_STATUS: 'iot_ota_task_record_status', // IoT OTA 记录状态
  IOT_OTA_TASK_STATUS: 'iot_ota_task_status', // IoT OTA 任务状态
  IOT_PRODUCT_DEVICE_TYPE: 'iot_product_device_type', // IOT 产品设备类型
  IOT_PRODUCT_FUNCTION_TYPE: 'iot_product_function_type', // IOT 产品功能类型
  IOT_PRODUCT_STATUS: 'iot_product_status', // IOT 产品状态
  IOT_PROTOCOL_TYPE: 'iot_protocol_type', // IOT 接入网关协议
  IOT_RULE_SCENE_ACTION_TYPE_ENUM: 'iot_rule_scene_action_type_enum', // IoT 规则场景的触发类型枚举
  IOT_RULE_SCENE_TRIGGER_TYPE_ENUM: 'iot_rule_scene_trigger_type_enum', // IoT 场景流转的触发类型枚举
  IOT_RW_TYPE: 'iot_rw_type', // IOT 读写类型
  IOT_THING_MODEL_TYPE: 'iot_thing_model_type', // IOT 产品功能类型
  IOT_THING_MODEL_UNIT: 'iot_thing_model_unit', // IOT 物模型单位
  IOT_UNIT_TYPE: 'iot_unit_type', // IOT 单位类型
  IOT_VALIDATE_TYPE: 'iot_validate_type', // IOT 数据校验级别
  IOT_MODBUS_MODE: 'iot_modbus_mode', // IoT Modbus 工作模式
  IOT_MODBUS_FRAME_FORMAT: 'iot_modbus_frame_format', // IoT Modbus 帧格式
} as const;

/** ========== MES - 制造执行模块 ========== */
const MES_DICT = {
  MES_MD_ITEM_OR_PRODUCT: 'mes_md_item_or_product', // MES 物料/产品标识
  MES_MD_AUTO_CODE_CYCLE_METHOD: 'mes_md_auto_code_cycle_method', // MES 编码规则循环方式
  MES_MD_AUTO_CODE_PADDED_METHOD: 'mes_md_auto_code_padded_method', // MES 编码规则补齐方式
  MES_MD_AUTO_CODE_PART_TYPE: 'mes_md_auto_code_part_type', // MES 编码规则分段类型
  MES_CLIENT_TYPE: 'mes_client_type', // MES 客户类型
  MES_VENDOR_LEVEL: 'mes_vendor_level', // MES 供应商级别
  MES_CAL_HOLIDAY_TYPE: 'mes_cal_holiday_type', // MES 假期类型
  MES_CAL_SHIFT_TYPE: 'mes_cal_shift_type', // MES 轮班方式
  MES_CAL_SHIFT_METHOD: 'mes_cal_shift_method', // MES 倒班方式
  MES_CAL_CALENDAR_TYPE: 'mes_cal_calendar_type', // MES 班组类型
  MES_CAL_PLAN_STATUS: 'mes_cal_plan_status', // MES 排班计划状态
  MES_TM_TOOL_STATUS: 'mes_tm_tool_status', // MES 工具状态
  MES_TM_MAINTEN_TYPE: 'mes_tm_mainten_type', // MES 保养维护类型
  MES_DV_MACHINERY_STATUS: 'mes_dv_machinery_status', // MES 设备状态
  MES_DV_SUBJECT_TYPE: 'mes_dv_subject_type', // MES 点检保养项目类型
  MES_DV_CYCLE_TYPE: 'mes_dv_cycle_type', // MES 点检保养周期类型
  MES_DV_CHECK_PLAN_STATUS: 'mes_dv_check_plan_status', // MES 点检保养方案状态
  MES_MAINTEN_RECORD_STATUS: 'mes_mainten_record_status', // MES 保养记录状态
  MES_MAINTEN_STATUS: 'mes_mainten_status', // MES 保养结果
  MES_DV_REPAIR_STATUS: 'mes_dv_repair_status', // MES 维修工单状态
  MES_DV_REPAIR_RESULT: 'mes_dv_repair_result', // MES 维修结果
  MES_DV_CHECK_RECORD_STATUS: 'mes_dv_check_record_status', // MES 点检记录状态
  MES_DV_CHECK_RESULT: 'mes_dv_check_result', // MES 点检结果
  MES_PRO_LINK_TYPE: 'mes_pro_link_type', // MES 工序关系类型
  MES_PRO_WORK_ORDER_STATUS: 'mes_pro_work_order_status', // MES 生产工单状态
  MES_PRO_WORK_ORDER_TYPE: 'mes_pro_work_order_type', // MES 工单类型
  MES_PRO_WORK_ORDER_SOURCE_TYPE: 'mes_pro_work_order_source_type', // MES 工单来源类型
  MES_PRO_TASK_STATUS: 'mes_pro_task_status', // MES 生产任务状态
  MES_PRO_FEEDBACK_STATUS: 'mes_pro_feedback_status', // MES 生产报工状态
  MES_PRO_FEEDBACK_TYPE: 'mes_pro_feedback_type', // MES 生产报工类型
  MES_PRO_FEEDBACK_CHANNEL: 'mes_pro_feedback_channel', // MES 生产报工途径
  MES_PRO_ANDON_STATUS: 'mes_pro_andon_status', // MES 安灯处置状态
  MES_PRO_ANDON_LEVEL: 'mes_pro_andon_level', // MES 安灯级别
  MES_PRO_WORK_RECORD_TYPE: 'mes_pro_work_record_type', // MES 上下工状态类型
  MES_TIME_UNIT_TYPE: 'mes_time_unit_type', // MES 时间单位
  MES_ORDER_STATUS: 'mes_order_status', // MES 单据状态
  MES_INDICATOR_TYPE: 'mes_indicator_type', // MES 检测项类型
  MES_QC_RESULT_TYPE: 'mes_qc_result_type', // MES 质检结果值类型
  MES_QC_TYPE: 'mes_qc_type', // MES 质检方案类型
  MES_QC_CHECK_RESULT: 'mes_qc_check_result', // MES 检测结果
  MES_QC_SOURCE_DOC_TYPE: 'mes_qc_source_doc_type', // MES 来源单据类型
  MES_IPQC_TYPE: 'mes_ipqc_type', // MES IPQC 检验类型
  MES_RQC_TYPE: 'mes_rqc_type', // MES 退货检验类型
  MES_DEFECT_LEVEL: 'mes_defect_level', // MES 缺陷等级
  MES_WM_BARCODE_BIZ_TYPE: 'mes_wm_barcode_biz_type', // MES 条码业务类型
  MES_WM_BARCODE_FORMAT: 'mes_wm_barcode_format', // MES 条码格式
  MES_WM_PACKAGE_STATUS: 'mes_wm_package_status', // MES 装箱单状态
  MES_WM_PRODUCT_SALES_STATUS: 'mes_wm_product_sales_status', // MES 销售出库单状态
  MES_WM_QUALITY_STATUS: 'mes_wm_quality_status', // MES 质量状态
  MES_WM_MISC_ISSUE_TYPE: 'mes_wm_misc_issue_type', // MES 杂项出库类型
  MES_WM_MISC_ISSUE_STATUS: 'mes_wm_misc_issue_status', // MES 杂项出库单状态
  MES_WM_MISC_RECEIPT_TYPE: 'mes_wm_misc_receipt_type', // MES 杂项入库类型
  MES_WM_MISC_RECEIPT_STATUS: 'mes_wm_misc_receipt_status', // MES 杂项入库单状态
  MES_WM_OUTSOURCE_ISSUE_STATUS: 'mes_wm_outsource_issue_status', // MES 外协发料单状态
  MES_WM_OUTSOURCE_RECEIPT_STATUS: 'mes_wm_outsource_receipt_status', // MES 外协入库单状态
  MES_WM_ARRIVAL_NOTICE_STATUS: 'mes_wm_arrival_notice_status', // MES 到货通知单状态
  MES_WM_ITEM_RECEIPT_STATUS: 'mes_wm_item_receipt_status', // MES 采购入库单状态
  MES_WM_RETURN_VENDOR_STATUS: 'mes_wm_return_vendor_status', // MES 供应商退货单状态
  MES_WM_SALES_NOTICE_STATUS: 'mes_wm_sales_notice_status', // MES 发货通知单状态
  MES_WM_RETURN_SALES_STATUS: 'mes_wm_return_sales_status', // MES 销售退货单状态
  MES_WM_RETURN_ISSUE_STATUS: 'mes_wm_return_issue_status', // MES 生产退料单状态
  MES_WM_RETURN_ISSUE_TYPE: 'mes_wm_return_issue_type', // MES 退料类型
  MES_WM_PRODUCT_ISSUE_STATUS: 'mes_wm_product_issue_status', // MES 领料出库单状态
  MES_WM_PRODUCT_RECEIPT_STATUS: 'mes_wm_product_receipt_status', // MES 产品入库单状态
  MES_WM_STOCK_TAKING_TYPE: 'mes_wm_stock_taking_type', // MES 盘点类型
  MES_WM_STOCK_TAKING_TASK_STATUS: 'mes_wm_stock_taking_task_status', // MES 盘点任务状态
  MES_WM_STOCK_TAKING_LINE_STATUS: 'mes_wm_stock_taking_task_line_status', // MES 盘点任务行状态
  MES_WM_STOCK_TAKING_PLAN_PARAM_TYPE: 'mes_wm_stock_taking_plan_param_type', // MES 盘点方案参数类型
  MES_WM_TRANSFER_STATUS: 'mes_wm_transfer_status', // MES 转移单状态
  MES_WM_TRANSFER_TYPE: 'mes_wm_transfer_type', // MES 转移单类型
} as const;

/** ========== WMS - 仓储管理模块 ========== */
const WMS_DICT = {
  WMS_MERCHANT_TYPE: 'merchant_type', // WMS 往来企业类型
  WMS_ORDER_TYPE: 'wms_order_type', // WMS 单据类型
  WMS_ORDER_STATUS: 'wms_order_status', // WMS 单据状态
  WMS_RECEIPT_ORDER_TYPE: 'wms_receipt_order_type', // WMS 入库单类型
  WMS_SHIPMENT_ORDER_TYPE: 'wms_shipment_order_type', // WMS 出库单类型
} as const;

/** 字典类型枚举 - 统一导出 */
const DICT_TYPE = {
  ...AI_DICT,
  ...BPM_DICT,
  ...CRM_DICT,
  ...ERP_DICT,
  ...INFRA_DICT,
  ...IOT_DICT,
  ...MES_DICT,
  ...WMS_DICT,
  ...MEMBER_DICT,
  ...MP_DICT,
  ...PAY_DICT,
  ...MALL_DICT,
  ...SYSTEM_DICT,
  ...COMMON_DICT,
} as const;

export { DICT_TYPE };
