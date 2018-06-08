'use strict';

let account = new Account();
let contract = new ContractApi();
let isExtensionExist;

window.addEventListener('message', function (e) {
    if (e.data.data && !!e.data.data.account) {
        account.setWallet(e.data.data.account);
    }
});

$(document).ready(() => {
    isExtensionExist = typeof (webExtensionWallet) !== "undefined";

    if (!isExtensionExist) {
        document.querySelector(".noExtension").attributes.removeNamedItem("hidden");
    }

    window.postMessage({
        "target": "contentscript",
        "data": {},
        "method": "getAccount",
    }, "*");

    onCreateHandler();
    onEditHandler();
    onMarkHandler();
    loadMyGoalsHandler();

    loadGoals();
});