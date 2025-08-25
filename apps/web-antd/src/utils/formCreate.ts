/**
 * 针对 https://github.com/xaboy/form-create-designer 封装的工具类
 */
// TODO @芋艿：后续这些 form-create 的优化；另外需要使用 form-create-helper 会好点
import { isRef } from 'vue';

import formCreate from '@form-create/ant-design-vue';
// 编码表单 Conf
export const encodeConf = (designerRef: any) => {
  return JSON.stringify(designerRef.value.getOption());
};

// 编码表单 Fields
export const encodeFields = (designerRef: any) => {
  const rule = JSON.parse(designerRef.value.getJson());
  const fields: string[] = [];
  rule.forEach((item: unknown) => {
    fields.push(JSON.stringify(item));
  });
  return fields;
};

// 解码表单 Fields
export const decodeFields = (fields: string[]) => {
  const rule: object[] = [];
  fields.forEach((item) => {
    rule.push(formCreate.parseJson(item));
  });
  return rule;
};

// 设置表单的 Conf 和 Fields，适用 FcDesigner 场景
export const setConfAndFields = (
  designerRef: any,
  conf: string,
  fields: string | string[],
) => {
  designerRef.value.setOption(formCreate.parseJson(conf));
  // 处理 fields 参数类型，确保传入 decodeFields 的是 string[] 类型
  const fieldsArray = Array.isArray(fields) ? fields : [fields];
  designerRef.value.setRule(decodeFields(fieldsArray));
};

// 设置表单的 Conf 和 Fields，适用 form-create 场景
export const setConfAndFields2 = (
  detailPreview: any,
  conf: string,
  fields: string[],
  value?: any,
) => {
  if (isRef(detailPreview)) {
    detailPreview = detailPreview.value;
  }
  detailPreview.option = formCreate.parseJson(conf);
  detailPreview.rule = decodeFields(fields);
  if (value) {
    detailPreview.value = value;
  }
};
