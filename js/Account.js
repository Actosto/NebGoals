class Account {
    constructor(wallet) {
        this.wallet = wallet || "";
    }

    setWallet(wallet) {
        this.wallet = wallet;
        $(`*[data-id=account-wallet]`).html(wallet);
    }
}