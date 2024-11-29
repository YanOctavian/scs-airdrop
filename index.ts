
// async function send(url: string, privateKey: string, ) {
    
// }

import { Airdrop } from "./airdrop";
import {url, privateKey} from "./constant";
import {read_csv} from "./utils";


async function main () {
    console.log("Hello via Bun!");
    const airdrop = new Airdrop(privateKey, url);
    const results = await read_csv("addresses.csv");
    console.log("hhhh: ", results[0]);
    console.log("结束")
    // const result = await airdrop.send(null, results[0].to, results[0].value);
    await airdrop.run(results);
    // console.log("result: ", result);

}

main().catch(console.error)