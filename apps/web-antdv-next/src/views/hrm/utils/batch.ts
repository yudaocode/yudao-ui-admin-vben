import { message } from 'antdv-next';

/** 执行前端批量操作，并提示成功和失败数量 */
export async function executeBatch(requests: Promise<unknown>[]) {
  const results = await Promise.allSettled(requests);
  let successCount = 0;
  for (const result of results) {
    if (result.status === 'fulfilled') {
      successCount += 1;
    }
  }
  const failureCount = results.length - successCount;
  const content = `操作完成：成功 ${successCount} 个，失败 ${failureCount} 个`;
  if (failureCount === 0) {
    message.success(content);
  } else if (successCount > 0) {
    message.warning(content);
  } else {
    message.error(content);
  }
  return successCount > 0;
}
