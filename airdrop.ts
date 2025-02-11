

import { ApiPromise, Keyring, HttpProvider } from "@polkadot/api";
const ethers = require("ethers");
import {read_csv, Account} from "./utils"
import {JsonRpcProvider, Wallet, parseEther, HDNodeWallet, Transaction} from "ethers";

class SCSTransaction {
    public chainId: number;
    public nonce: number;
    public value: bigint;
    // public data: string;
    public maxPriorityFeePerGas: number;
    public maxFeePerGas: number;
    public gasLimit: number;
    public call: string;
    public input: string = "0x";
    public r: string;
    public s: string;
    public oddYParity: boolean;
    public accessList = [];

}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

export class Airdrop {

    private privateKey: string;
    private ethersWallet: Wallet;
    private ethersProvider: JsonRpcProvider;
    private pokadotProvider: HttpProvider;
    private nonce: number;
    private polkadotPair;

    constructor(privateKey: string, url: string) {
        this.privateKey = privateKey;
        this.ethersProvider = new JsonRpcProvider(url);
        this.ethersWallet = new Wallet(this.privateKey, this.ethersProvider);
        this.pokadotProvider = new HttpProvider(url);
        const keyring = new Keyring({
            type: "ethereum", ss58Format: 42
        });
        this.polkadotPair = keyring.addFromUri("0x" + this.privateKey);
        // this.address = 
        console.log(`程序启动成功。url: ${url}, private key: ${privateKey}, 地址是: ${this.ethersWallet.address}`);
    }

    async getNonce(address: string): Promise<number> {
        const api = await ApiPromise.create({ provider: this.pokadotProvider , });
        const nonce = await api.query.system.account(this.polkadotPair.address);
        return nonce["nonce"].toNumber();
    }
    

    async run(accounts: Account[], startAccount: string | null) {
        
        this.nonce = await this.getNonce(this.polkadotPair.address);
        console.log("准备空投的nonce值是: ", this.nonce);
        console.log("准备空投的用户数量为: ", accounts.length);
        let ss = [];
        const addrees1 = "0x93A3A1c3dbccdbA8Df744a97f4Cc702e2F8663D1".toLowerCase();
        const address2 = "0x8B3f123cf9F3b2E147142d3e99396695c09A34E7".toLowerCase();
        let isStart = startAccount === null ? true: false;

        for (const v of accounts) {

            if (isStart) {
                if (v.to === "" || v.value === "0" || v.to === addrees1 || v.to == address2){
                    continue;
                }
                // nonce值要递增 这样提交才不会出错  不要在这里搞并发
                await this.send(this.nonce, v.to, v.value);
                this.nonce += 1;
            }

            if (startAccount == v.to && startAccount != null && isStart == false) {
                isStart = true
            }

        }
    }

    /**
     * 向波卡网络发送一个交易
     * @param nonce 
     */
    async send(nonce: number | null, to: string, value: bigint): Promise<string>{
        const tx = await this.getEthersTransaction(nonce, value, to);
        const result = await this.sendToPolkadot(tx);
        console.log("成功发送: ", result);
        return result;
    }

    /**
     * 获取以太坊签名交易（为了获得r、s和v）
     * @param nonce 
     * @param value 
     * @param to 
     * @returns 返回签名后的交易
     */
    async getEthersTransaction(nonce: number | null, value: bigint, to: string): Promise<SCSTransaction> {
        
        // Memo 字符串
        const memo = "SuperEx's Airdrop";
        // 编码 memo 为字节数组
        const memoData = Buffer.from(memo, "utf8");
        console.log("memoData: ", memoData);
        const tx = {
            nonce: nonce, 
            to: to, 
            value:value,
            data: "0x" + memoData.toString("hex"),
            gasLimit: 210000, 
            maxPriorityFeePerGas: 500000000,
            maxFeePerGas: 500000000,
            // data: "0x",
        };
        // 创建以太坊的签名交易 （为了给波卡交易获取参数）
        const pop = await this.ethersWallet.populateTransaction(tx);
        delete pop.from;
        const txObj = Transaction.from(pop);
        const signTransaction = await this.ethersWallet.signTransaction(txObj);
        const t = Transaction.from(signTransaction).toJSON();
        console.log("signTransaction: \n", t);

        let scsTransaction = new SCSTransaction();
        const v = t["sig"]["v"];
        scsTransaction.chainId = t["chainId"];
        scsTransaction.nonce = t["nonce"];
        scsTransaction.value = t["value"];
        // scsTransaction.data = t["data"];
        scsTransaction.maxPriorityFeePerGas =t["maxPriorityFeePerGas"];
        scsTransaction.maxFeePerGas = t["maxFeePerGas"];
        scsTransaction.gasLimit = t["gasLimit"];
        scsTransaction.call = t["to"];
        scsTransaction.input = t["data"];
        scsTransaction.r = t["sig"]["r"];
        scsTransaction.s = t["sig"]["s"];
        scsTransaction.oddYParity = v === 28 ? true: false;
        scsTransaction.accessList = t["accessList"]
        console.log(scsTransaction);
        return scsTransaction;
    }


    /**
     * 向波卡网络发送交易
     * @param t 
     * @returns 返回交易hash
     */
    async sendToPolkadot(t: SCSTransaction): Promise<string>{

        const api = await ApiPromise.create({ provider: this.pokadotProvider , });
        const eip1559Transaction = api.registry.createType('EthereumTransactionEip1559Transaction', {
            chain_id: t.chainId,
            nonce: t.nonce,
            max_priority_fee_per_gas: t.maxPriorityFeePerGas,
            max_fee_per_gas: t.maxFeePerGas,
            gas_limit: t.gasLimit,
            action: { Call: t.call},  // 使用 Call 变体
            value: t.value,
            input: t.input, // 注意 空值是0x 不是空
            access_list: t.accessList,
            odd_y_parity: t.oddYParity,
            r: t.r,
            s: t.s,
          });

        const tx = await api.tx.ethereum.transact({"EIP1559": eip1559Transaction});
        const nonce = await api.query.system.account(this.polkadotPair.address);
        console.log("nonce: ", nonce["nonce"].toNumber());
        console.log("发送到波卡的交易hex是: \n", tx.toHex());
        const result = await tx.send();
        return result.toHex();

    }



}