String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

Date.toUnixtime = function (date) {
    date = typeof date == "string" ? new Date(date) : date;
    return date.getTime();
}
Date.fromUnixtime = function (milliseconds) {
    return new Date(milliseconds).toLocaleString();
}

const weiAtNas = new BigNumber(1000000000000000000);

function convertWeiToNas(value) {
    return new BigNumber(value).dividedBy(weiAtNas).toNumber();
}

function convertNasToWei(value) {
    return new BigNumber(value).multipliedBy(weiAtNas).toNumber();
}