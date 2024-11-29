
// async function send(url: string, privateKey: string, ) {
    
// }

import { Airdrop } from "./airdrop";
import {url, privateKey} from "./constant";
import {read_csv} from "./utils";



async function main () {

    console.log("Hello via Bun!");
    const airdrop = new Airdrop(privateKey, url);
    const results = await read_csv("addresses.csv");
    // 上一个成功转账的地址（没有报错的）
    const address = "0x42834b4Fbac4eD47E7012A163D2642e43eE7A36a".toLowerCase();
    await airdrop.run(results, null);

}

main().catch(console.error)