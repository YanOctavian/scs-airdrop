
import fs from 'fs';
import { parse } from 'fast-csv';
const web3 = require("web3");
// import {} from "ethers";


// 
export interface Account {
    to: string;
    value: bigint;
}


function base64ToHex(b: string): string {
    const decodedBytes = Buffer.from(b, "base64");
    const hexString = web3.utils.bytesToHex(decodedBytes);
    return hexString;
}


/**
 * 读取csv文件中的数据
 * @param file 
 * @returns 返回用户地址和金额
 */
export function read_csv(file: string): Promise<Account[]> {
  return new Promise((resolve, reject) => {
    // const decodedBytes = utils.base64.decode("hahahah");
    
    const results: Account[] = [];
    fs.createReadStream(file)
      .pipe(parse({ headers: true }))
      .on('data', (row: any) => {
        let account: Account = {
          to: base64ToHex(row["hash"]),
          value: row["fetched_coin_balance"] === "" ? "0": row["fetched_coin_balance"]  // 确保 value 是数字
        };
        results.push(account);
      })
      .on('end', () => {
        console.log('CSV file successfully processed:');
        console.log(results);  // 输出提取的字段
        resolve(results);  // 当 CSV 处理完毕，返回结果
      })
      .on('error', (err) => {
        reject(err);  // 如果有错误发生，拒绝 Promise
      });
  });
}
