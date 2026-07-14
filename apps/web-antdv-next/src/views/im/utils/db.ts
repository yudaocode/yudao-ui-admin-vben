import type { MessageDO, SettingDO } from '../home/types';

import { toRaw } from 'vue';

import { getCurrentUserId } from '#/views/im/utils/auth';

import { ImConversationType } from './constants';

export const DB_SCHEMA_VERSION = 2;

export type DbStoreName =
  | 'channels'
  | 'conversationReads'
  | 'conversations'
  | 'friendRequests'
  | 'friends'
  | 'groupMembers'
  | 'groupRequests'
  | 'groups'
  | 'messages'
  | 'settings';

export type DbTransaction = IDBTransaction;

/** 数据库消息分页游标 */
export interface MessageDOPageCursor {
  messageKey: string;
  sendTime: number;
}

/** 数据库消息分页结果 */
export interface MessageDOPageResult {
  hasMore: boolean;
  list: MessageDO[];
}

/** IM 本地存储 key */
export const StorageKeys = {
  localStorage: {
    /** 侧边栏宽度，三个 Tab 共用一份记忆 */
    asideWidth: 'im:aside',
    /** 会话列表置顶折叠展开态 */
    conversationPinnedExpanded: 'im:conversation:pinnedExpanded',
  },
  settings: {
    /** 私聊消息拉取游标 */
    privateMessageMaxId: 'privateMessageMaxId',
    /** 群聊消息拉取游标 */
    groupMessageMaxId: 'groupMessageMaxId',
    /** 频道消息拉取游标 */
    channelMessageMaxId: 'channelMessageMaxId',
    /** 最近转发会话 key 列表 */
    recentForwardConversationKeys: 'recentForwardConversationKeys',
    // 状态事件补偿增量拉取游标：与上面消息 maxId 游标共用同一 settings keyspace，统一登记在此避免撞 key；
    // 走 update_time + id 复合游标（非单条 maxId），故用 PullCursor 后缀区分语义
    /** 好友关系增量拉取游标 */
    friendPullCursor: 'friendPullCursor',
    /** 好友申请增量拉取游标 */
    friendRequestPullCursor: 'friendRequestPullCursor',
    /** 加群申请增量拉取游标 */
    groupRequestPullCursor: 'groupRequestPullCursor',
    /** 会话读位置增量拉取游标 */
    conversationReadPullCursor: 'conversationReadPullCursor',
  },
} as const;

let currentDb: IDBDatabase | null = null;
let currentUserId: null | number = null;
let currentSession = 0;
let stopPromise: Promise<void> | undefined;

/** 校验当前 IM IndexedDB session 仍有效 */
export function isCurrentDbSession(session: number): boolean {
  return session === currentSession;
}

/** 获取当前 IM IndexedDB session */
export function getDbSession(): number {
  return currentSession;
}

/** 拼接当前用户 IM DB 名称 */
function getDbName(userId: number): string {
  return `im:${userId}`;
}

/** 包装 IndexedDB request */
function requestToPromise<T = unknown>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject(request.error));
  });
}

/** 等待事务完成 */
function transactionDone(transaction: DbTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.addEventListener('complete', () => resolve());
    transaction.addEventListener('error', () => reject(transaction.error));
    transaction.addEventListener('abort', () => reject(transaction.error));
  });
}

/** 创建索引 */
function createIndex(
  store: IDBObjectStore,
  name: string,
  keyPath: string | string[],
  options?: IDBIndexParameters,
) {
  if (!store.indexNames.contains(name)) {
    store.createIndex(name, keyPath, options);
  }
}

/** 初始化 schema */
function upgradeSchema(db: IDBDatabase) {
  if (!db.objectStoreNames.contains('conversations')) {
    const store = db.createObjectStore('conversations', {
      keyPath: 'clientConversationId',
    });
    createIndex(store, 'lastSendTime', 'lastSendTime');
  }
  if (!db.objectStoreNames.contains('conversationReads')) {
    const store = db.createObjectStore('conversationReads', {
      keyPath: 'clientConversationId',
    });
    createIndex(
      store,
      'conversationType+targetId',
      ['conversationType', 'targetId'],
      {
        unique: true,
      },
    );
  }
  if (!db.objectStoreNames.contains('messages')) {
    const store = db.createObjectStore('messages', { keyPath: 'messageKey' });
    createIndex(store, 'clientConversationId', 'clientConversationId');
    createIndex(store, 'clientConversationId+sendTime', [
      'clientConversationId',
      'sendTime',
    ]);
    createIndex(store, 'clientMessageId', 'clientMessageId', { unique: true });
  }
  if (!db.objectStoreNames.contains('friends')) {
    const store = db.createObjectStore('friends', { keyPath: 'id' });
    createIndex(store, 'friendUserId', 'friendUserId', { unique: true });
    createIndex(store, 'status', 'status');
  }
  if (!db.objectStoreNames.contains('friendRequests')) {
    const store = db.createObjectStore('friendRequests', { keyPath: 'id' });
    createIndex(store, 'status', 'status');
    createIndex(store, 'createTime', 'createTime');
  }
  if (!db.objectStoreNames.contains('groups')) {
    const store = db.createObjectStore('groups', { keyPath: 'id' });
    createIndex(store, 'name', 'name');
    createIndex(store, 'status', 'status');
  }
  if (!db.objectStoreNames.contains('groupMembers')) {
    const store = db.createObjectStore('groupMembers', { keyPath: 'id' });
    createIndex(store, 'groupId', 'groupId');
    createIndex(store, 'groupId+userId', ['groupId', 'userId'], {
      unique: true,
    });
  }
  if (!db.objectStoreNames.contains('groupRequests')) {
    const store = db.createObjectStore('groupRequests', { keyPath: 'id' });
    createIndex(store, 'status', 'status');
    createIndex(store, 'createTime', 'createTime');
  }
  if (!db.objectStoreNames.contains('channels')) {
    const store = db.createObjectStore('channels', { keyPath: 'id' });
    createIndex(store, 'status', 'status');
    createIndex(store, 'sort', 'sort');
  }
  if (!db.objectStoreNames.contains('settings')) {
    db.createObjectStore('settings', { keyPath: 'key' });
  }
}

/** 打开 IM IndexedDB */
function openDb(name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, DB_SCHEMA_VERSION);
    // 创建或升级对象仓库
    request.addEventListener('upgradeneeded', () =>
      upgradeSchema(request.result),
    );
    // 返回可复用连接
    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject(request.error));
  });
}

/** 初始化当前用户 IM DB */
export async function initDb(): Promise<void> {
  while (stopPromise) {
    await stopPromise;
  }
  const userId = getCurrentUserId();
  if (!Number.isFinite(userId) || userId <= 0) {
    throw new Error('当前用户不存在，无法初始化 IM DB');
  }
  if (currentDb && currentUserId === userId) {
    return;
  }
  const session = ++currentSession;
  const previousDb = currentDb;
  currentDb = null;
  currentUserId = userId;
  previousDb?.close();
  const nextDb = await openDb(getDbName(userId));
  if (
    !isCurrentDbSession(session) ||
    currentUserId !== userId ||
    getCurrentUserId() !== userId
  ) {
    nextDb.close();
    throw new Error('IM DB 初始化已失效');
  }
  currentDb = nextDb;
}

/** 关闭当前 IM DB 连接 */
function closeDbConnection() {
  currentDb?.close();
  currentDb = null;
  currentUserId = null;
}

/** 获取当前 IM DB */
function getRawDb(): IDBDatabase {
  if (!currentDb) {
    throw new Error('IM DB 未初始化');
  }
  return currentDb;
}

/** 校验单次事务仍属于当前用户与 DB session */
function guardSession(session: number, userId: number) {
  if (
    !isCurrentDbSession(session) ||
    currentUserId !== userId ||
    getCurrentUserId() !== userId
  ) {
    throw new Error('IM DB session 已失效');
  }
}

/** 克隆可入库对象 */
function toDbValue<T>(value: T): T {
  return cloneDbValue(value) as T;
}

/** 转换为 IndexedDB 可克隆对象 */
function cloneDbValue(value: unknown): unknown {
  const raw = toRaw(value);
  if (Array.isArray(raw)) {
    return raw.map((item) => cloneDbValue(item));
  }
  if (!raw || typeof raw !== 'object') {
    return raw;
  }
  const prototype = Object.getPrototypeOf(raw);
  if (prototype !== Object.prototype && prototype !== null) {
    return raw;
  }
  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).map(([key, item]) => [
      key,
      cloneDbValue(item),
    ]),
  );
}

class DbClient {
  /** 清空 store 记录 */
  async clearStore(storeName: DbStoreName, tx?: DbTransaction): Promise<void> {
    if (tx) {
      await requestToPromise(tx.objectStore(storeName).clear());
      return;
    }
    await this.transaction([storeName], 'readwrite', (tx) =>
      this.clearStore(storeName, tx),
    );
  }

  /** 删除记录 */
  async delete(
    storeName: DbStoreName,
    key: IDBValidKey,
    tx?: DbTransaction,
  ): Promise<void> {
    if (tx) {
      await requestToPromise(tx.objectStore(storeName).delete(key));
      return;
    }
    await this.transaction([storeName], 'readwrite', (tx) =>
      this.delete(storeName, key, tx),
    );
  }

  /** 按索引删除记录 */
  async deleteByIndex(
    storeName: DbStoreName,
    indexName: string,
    query: IDBKeyRange | IDBValidKey,
    tx?: DbTransaction,
  ): Promise<void> {
    if (!tx) {
      await this.transaction([storeName], 'readwrite', (tx) =>
        this.deleteByIndex(storeName, indexName, query, tx),
      );
      return;
    }
    const index = tx.objectStore(storeName).index(indexName);
    await new Promise<void>((resolve, reject) => {
      const request = index.openCursor(query);
      request.addEventListener('error', () => reject(request.error));
      request.addEventListener('success', () => {
        const cursor = request.result;
        if (!cursor) {
          resolve();
          return;
        }
        cursor.delete();
        cursor.continue();
      });
    });
  }

  /** 获取单条记录 */
  async get<T>(
    storeName: DbStoreName,
    key: IDBValidKey,
    tx?: DbTransaction,
  ): Promise<T | undefined> {
    if (tx) {
      return requestToPromise<T | undefined>(
        tx.objectStore(storeName).get(key),
      );
    }
    return this.transaction<T | undefined>([storeName], 'readonly', (tx) =>
      this.get<T>(storeName, key, tx),
    );
  }

  /** 获取 store 全量记录 */
  async getAll<T>(storeName: DbStoreName, tx?: DbTransaction): Promise<T[]> {
    if (tx) {
      return requestToPromise<T[]>(tx.objectStore(storeName).getAll());
    }
    return this.transaction<T[]>([storeName], 'readonly', (tx) =>
      this.getAll<T>(storeName, tx),
    );
  }

  /** 按索引获取记录列表 */
  async getAllByIndex<T>(
    storeName: DbStoreName,
    indexName: string,
    query?: IDBKeyRange | IDBValidKey,
    tx?: DbTransaction,
  ): Promise<T[]> {
    if (tx) {
      return requestToPromise<T[]>(
        tx.objectStore(storeName).index(indexName).getAll(query),
      );
    }
    return this.transaction<T[]>([storeName], 'readonly', (tx) =>
      this.getAllByIndex<T>(storeName, indexName, query, tx),
    );
  }

  /** 按唯一索引获取单条记录 */
  async getByIndex<T>(
    storeName: DbStoreName,
    indexName: string,
    query: IDBKeyRange | IDBValidKey,
    tx?: DbTransaction,
  ): Promise<T | undefined> {
    if (tx) {
      return requestToPromise<T | undefined>(
        tx.objectStore(storeName).index(indexName).get(query),
      );
    }
    return this.transaction<T | undefined>([storeName], 'readonly', (tx) =>
      this.getByIndex<T>(storeName, indexName, query, tx),
    );
  }

  /** 按会话分页获取消息 */
  async getMessageListByConversation(
    clientConversationId: string,
    options?: { before?: MessageDOPageCursor; limit?: number },
    tx?: DbTransaction,
  ): Promise<MessageDOPageResult> {
    const limit = options?.limit ?? 50;
    const before = options?.before;
    const upper = before?.sendTime ?? Number.MAX_SAFE_INTEGER;
    const range = IDBKeyRange.bound(
      [clientConversationId, 0],
      [clientConversationId, upper],
      false,
      !before,
    );
    const read = async (tx: DbTransaction): Promise<MessageDOPageResult> => {
      const index = tx
        .objectStore('messages')
        .index('clientConversationId+sendTime');
      const out: MessageDO[] = [];
      await new Promise<void>((resolve, reject) => {
        // 从新到旧读取一页
        const request = index.openCursor(range, 'prev');
        request.addEventListener('error', () => reject(request.error));
        request.addEventListener('success', () => {
          const cursor = request.result;
          if (!cursor) {
            resolve();
            return;
          }
          const message = cursor.value as MessageDO;
          if (
            before &&
            message.sendTime === before.sendTime &&
            message.messageKey >= before.messageKey
          ) {
            cursor.continue();
            return;
          }
          out.push(message);
          if (out.length > limit) {
            resolve();
            return;
          }
          cursor.continue();
        });
      });
      // 气泡渲染需要按时间升序
      return {
        hasMore: out.length > limit,
        list: out.slice(0, limit).toReversed(),
      };
    };
    if (tx) {
      return read(tx);
    }
    return this.transaction<MessageDOPageResult>(
      ['messages'],
      'readonly',
      read,
    );
  }

  /** 读取设置 */
  async getSetting<T>(key: string, tx?: DbTransaction): Promise<T | undefined> {
    const item = await this.get<SettingDO<T>>('settings', key, tx);
    return item?.value;
  }

  /** 写入记录 */
  async put<T>(
    storeName: DbStoreName,
    value: T,
    tx?: DbTransaction,
  ): Promise<void> {
    if (tx) {
      await requestToPromise(tx.objectStore(storeName).put(toDbValue(value)));
      return;
    }
    await this.transaction([storeName], 'readwrite', (tx) =>
      this.put(storeName, value, tx),
    );
  }

  /** 写入设置 */
  async setSetting<T>(
    key: string,
    value: T,
    tx?: DbTransaction,
  ): Promise<void> {
    await this.put<SettingDO<T>>(
      'settings',
      { key, value, updateTime: Date.now() },
      tx,
    );
  }

  /** 执行事务 */
  async transaction<T>(
    storeNames: DbStoreName[],
    mode: IDBTransactionMode,
    runner: (tx: DbTransaction) => Promise<T>,
  ): Promise<T> {
    // 开启事务前校验 session
    const session = getDbSession();
    const userId = getCurrentUserId();
    guardSession(session, userId);
    const tx = getRawDb().transaction(storeNames, mode);
    const done = transactionDone(tx);
    let result: T;
    try {
      // 事务内只执行 IndexedDB request 链
      result = await runner(tx);
    } catch (error) {
      try {
        tx.abort();
      } catch {}
      await done.catch(() => undefined);
      throw error;
    }
    // commit 后再次校验 session
    await done;
    guardSession(session, userId);
    return result;
  }
}

const dbClient = new DbClient();

/** 获取当前 IM DB client */
export function getDb(): DbClient {
  return dbClient;
}

/** 当前用户会话主键 */
export function getClientConversationId(
  type: number,
  targetId: number,
): string {
  return `${type}:${targetId}`;
}

/** 解析当前用户会话主键 */
export function parseClientConversationId(
  clientConversationId: string,
): null | { targetId: number; type: number } {
  const [typeText, targetIdText] = clientConversationId.split(':');
  const type = Number(typeText);
  const targetId = Number(targetIdText);
  if (!Number.isFinite(type) || !Number.isFinite(targetId) || targetId <= 0) {
    return null;
  }
  return { type, targetId };
}

/** 服务端消息主键 */
export function getServerMessageKey(
  conversationType: number,
  id: number,
): string {
  return `${conversationType}:${id}`;
}

/** 客户端临时消息主键 */
export function getClientMessageKey(clientMessageId: string): string {
  return `client:${clientMessageId}`;
}

/** 更新消息拉取游标 */
export async function setMessageMaxId(
  conversationType: number,
  maxId: number | undefined,
  tx?: DbTransaction,
): Promise<void> {
  if (!maxId) {
    return;
  }
  let key: string;
  switch (conversationType) {
    case ImConversationType.CHANNEL: {
      key = StorageKeys.settings.channelMessageMaxId;
      break;
    }
    case ImConversationType.GROUP: {
      key = StorageKeys.settings.groupMessageMaxId;
      break;
    }
    case ImConversationType.PRIVATE: {
      key = StorageKeys.settings.privateMessageMaxId;
      break;
    }
    default: {
      throw new Error(`未知 IM 会话类型：${conversationType}`);
    }
  }
  const db = getDb();
  const updateMaxId = async (transaction: DbTransaction) => {
    const current = (await db.getSetting<number>(key, transaction)) || 0;
    if (maxId > current) {
      await db.setSetting(key, maxId, transaction);
    }
  };
  if (tx) {
    await updateMaxId(tx);
    return;
  }
  await db.transaction(['settings'], 'readwrite', updateMaxId);
}

/** 停止当前 IM DB session */
export function stopRequests(): Promise<void> {
  const session = ++currentSession;
  closeDbConnection();
  const task = (async () => {
    const [
      { useMessageStoreWithOut },
      { useConversationStoreWithOut },
      { useFriendStoreWithOut },
      { useGroupStoreWithOut },
      { useChannelStoreWithOut },
      { useGroupRequestStoreWithOut },
      { useFaceStoreWithOut },
      { useRtcStore },
    ] = await Promise.all([
      import('../home/store/messageStore'),
      import('../home/store/conversationStore'),
      import('../home/store/friendStore'),
      import('../home/store/groupStore'),
      import('../home/store/channelStore'),
      import('../home/store/groupRequestStore'),
      import('../home/store/faceStore'),
      import('../home/store/rtcStore'),
    ]);
    if (!isCurrentDbSession(session)) {
      return;
    }
    useMessageStoreWithOut().clear();
    useConversationStoreWithOut().clear();
    useFriendStoreWithOut().clear();
    useGroupStoreWithOut().clear();
    useChannelStoreWithOut().clear();
    useGroupRequestStoreWithOut().clear();
    useFaceStoreWithOut().clear();
    useRtcStore().reset();
    useRtcStore().clearGroupCallCache();
  })();
  const settled = task.finally(() => {
    if (stopPromise === settled) {
      stopPromise = undefined;
    }
  });
  stopPromise = settled;
  return settled;
}
