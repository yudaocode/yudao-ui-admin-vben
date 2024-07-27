import type { BasicColumn, FormSchema } from "@/components/Table";
import { useRender } from "@/components/Table";
import type { DescItem } from "@/components/Description";
import { getListSimpleUsers } from "@/api/system/user";

export const columns: BasicColumn[] = [
  {
    title: "日志编号",
    dataIndex: "id",
    width: 100,
  },
  {
    title: "操作人",
    dataIndex: "userName",
    width: 120,
  },
  {
    title: "操作模块",
    dataIndex: "type",
    width: 200,
  },
  {
    title: "操作名",
    dataIndex: "subType",
    width: 180,
  },
  {
    title: "操作内容",
    dataIndex: "action",
    customRender: ({ text }) => {
      // 和 action 关键字冲突，所以通过 customRender 解决
      return text;
    },
  },
  {
    title: "操作时间",
    dataIndex: "createTime",
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDate(text);
    },
  },
  {
    title: "业务编号",
    dataIndex: "bizId",
    width: 120,
  },
  {
    title: "操作 IP",
    dataIndex: "userIp",
    width: 120,
  },
];

export const searchFormSchema: FormSchema[] = [
  {
    label: "操作人",
    field: "userId",
    component: "ApiSelect",
    componentProps: {
      api: () => getListSimpleUsers(),
      labelField: "nickname",
      valueField: "id",
    },
    colProps: { span: 8 },
  },
  {
    label: "操作模块",
    field: "type",
    component: "Input",
    colProps: { span: 8 },
  },
  {
    label: "操作名",
    field: "subType",
    component: "Input",
    colProps: { span: 8 },
  },
  {
    label: "操作内容",
    field: "action",
    component: "Input",
    colProps: { span: 8 },
  },
  {
    label: "操作时间",
    field: "createTime",
    component: "RangePicker",
    colProps: { span: 8 },
  },
  {
    label: "业务编号",
    field: "bizId",
    component: "Input",
    colProps: { span: 8 },
  },
];

export const infoSchema: DescItem[] = [
  {
    field: "id",
    label: "日志编号",
  },
  {
    field: "userName",
    label: "操作人",
  },
  {
    field: "type",
    label: "操作模块",
  },
  {
    field: "subType",
    label: "操作名",
  },
  {
    field: "action",
    label: "操作内容",
  },
  {
    field: "createTime",
    label: "操作时间",
    render(value) {
      return useRender.renderDate(value);
    },
  },
  {
    field: "bizId",
    label: "业务编号",
  },
  {
    field: "userIp",
    label: "操作 IP",
  },
  {
    field: "extra",
    label: "拓展字段",
  },
  {
    field: "requestMethod",
    label: "请求方法名",
  },
  {
    field: "requestUrl",
    label: "请求 URL",
  },
  {
    field: "userAgent",
    label: "浏览器 UA",
  },
];
