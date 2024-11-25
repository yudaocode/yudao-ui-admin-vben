import CryptoJS from 'crypto-js';

/**
 * @word 要加密的内容
 * @keyWord String  服务器随机返回的关键字
 */
export function aesEncrypt(word: string, keyWord = 'XwKsGlMcdPMEhR1B') {
  const key = CryptoJS.enc.Utf8.parse(keyWord);
  const src = CryptoJS.enc.Utf8.parse(word);
  const encrypted = CryptoJS.AES.encrypt(src, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  });
  return encrypted.toString();
}
