import CryptoJS from "crypto-js";

export const decrypt = (encrypted: string): string => {
  // Use only the first part before the colon
  const cipherPart = encrypted.split(":")[0];

  const key = CryptoJS.enc.Utf8.parse("638udh3829162018");
  const iv = CryptoJS.enc.Utf8.parse("fedcba9876543210");

  const decrypted = CryptoJS.AES.decrypt(cipherPart, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return decrypted.toString(CryptoJS.enc.Utf8);
};
