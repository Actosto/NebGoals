const CONTRACT_ADDRESS = "n1xGZeyUknRGEqq1c3ykjFZ6A6h9qcKjBns";

class SmartContractApi {
    constructor(contractAdress) {
        let Nebulas = require("nebulas");
        this.neb = new Nebulas.Neb();
        this.neb.setRequest(new Nebulas.HttpRequest("https://mainnet.nebulas.io"));

        let NebPay = require("nebpay");
        this.nebPay = new NebPay();
        this._contractAdress = contractAdress || CONTRACT_ADDRESS;
    }

    getContractAddress() {
        return this._contractAdress;
    }

    _simulateCall({
        value = "0",
        callArgs = "[]",
        callFunction,
        callback
    }) {
        this.nebPay.simulateCall(this._contractAdress, value, callFunction, callArgs, {
            callback: function (resp) {
                if (resp && resp.result && resp.result.startsWith('TypeError')) {
                    console.error(resp);
                }
                if (callback) {
                    callback(resp);
                }
            }
        });
    }

    _call({
        value = "0",
        callArgs = "[]",
        callFunction,
        callback,
        callbackError
    }) {
        let self = this;
        this.nebPay.call(this._contractAdress, value, callFunction, callArgs, {
            callback: resp => {
                if (resp) {
                    if (resp.result && resp.result.startsWith('TypeError')) {
                        console.error(resp);
                    }
                    if (resp == "Error: Transaction rejected by user") {
                        console.warn(resp);
                        if (callbackError) {
                            callbackError({
                                rejected: true
                            });
                        }
                        return;
                    }
                    self._waitTransaction(resp.txhash, callback, callbackError);
                }
            }
        });
    }

    _waitTransaction(txhash, callback, callbackError) {
        let self = this;
        this.neb.api.getTransactionReceipt({
            hash: txhash
        }).then(function it(receipt) {
            let status = receipt.status;
            if (status == 0) { // failed
                console.error(receipt);
                if (callbackError) {
                    callbackError(receipt);
                }
            }
            if (status == 1 && callback) { // successful
                callback(receipt);
            }
            if (status == 2) { // pending
                setTimeout(() => self.neb.api.getTransactionReceipt({
                    hash: txhash
                }).then(it), 1000);
                return;
            }
            return status;
        });
    }
}

class ContractApi extends SmartContractApi {
    getGoals(dateFrom, dateTo, count, cb) {

        let args = "";
        args += dateFrom ? `"${dateFrom}"` : "";
        args += dateTo ? args ? `, "${dateFrom}"` : `"${dateFrom}"` : "";
        args += count ? args ? `, ${count}` : `"${count}` : "";
        args = args ? `[${args}]` : "";

        this._simulateCall({
            callArgs: args,
            callFunction: "getGoals",
            callback: cb
        });
    }

    getUserGoals(wallet, dateFrom, dateTo, count, cb) {
        let args = "";
        args += wallet ? `"${wallet}"` : "";
        args += dateFrom ? args ? `, "${dateFrom}"` : `"${dateFrom}"` : "";
        args += dateTo ? args ? `, "${dateTo}"` : `"${dateTo}"` : "";
        args += count ? args ? `, ${count}` : `"${count}` : "";
        args = args ? `[${args}]` : "";

        this._simulateCall({
            callArgs: args,
            callFunction: "getUserGoals",
            callback: cb
        });
    }

    create(title, message, amount, isMarked, callback, callbackError) {
        let value = isMarked ? 0.01 : 0;
        message = message.replaceAll("\n", "#n");
        isMarked = isMarked === "" || isMarked === undefined ? false : isMarked;
        isMarked = !!isMarked ? ", 1" : "";
        let args = `["${title}", "${message}", ${amount}${isMarked}]`;

        this._call({
            value: value,
            callArgs: args,
            callFunction: "create",
            callback: callback,
            callbackError: callbackError,
        });
    }

    edit(id, title, message, amount, isMarked, wasMarked, callback, callbackError) {
        let value = isMarked && !wasMarked ? 0.01 : 0;
        message = message.replaceAll("\n", "#n");
        isMarked = isMarked === "" || isMarked === undefined ? false : isMarked;
        isMarked = !!isMarked ? ", 1" : "";
        let args = `[${id}, "${title}", "${message}", ${amount}${isMarked}]`;

        this._call({
            value: value,
            callArgs: args,
            callFunction: "edit",
            callback: callback,
            callbackError: callbackError,
        });
    }

    delete(id, callback, callbackError) {
        this._call({
            callArgs: `[${id}]`,
            callFunction: "delete",
            callback: callback,
            callbackError: callbackError,
        });
    }

    donate(id, callback, callbackError) {
        this._call({
            value: 1,
            callArgs: `[${id}]`,
            callFunction: "donate",
            callback: callback,
            callbackError: callbackError,
        });
    }
}