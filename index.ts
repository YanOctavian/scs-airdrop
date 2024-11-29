
// async function send(url: string, privateKey: string, ) {
    
// }

import { Airdrop } from "./airdrop";
import {url, privateKey} from "./constant";
import {read_csv} from "./utils";


async function main () {
    console.log("Hello via Bun!");
    const airdrop = new Airdrop(privateKey, url);
    const results = await read_csv("addresses.csv");
    await airdrop.run(results);

}

main().catch(console.error)