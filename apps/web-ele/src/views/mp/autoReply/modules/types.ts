// 消息类型（Follow: 关注时回复；Message: 消息回复；Keyword: 关键词回复）
// 作为 tab.name，enum 的数字不能随意修改，与 api 参数相关
// TODO @hw：ele 相比 antd 多了，看看要不要统一下；
export enum MsgType {
  Follow = 1,
  Keyword = 3,
  Message = 2,
}
