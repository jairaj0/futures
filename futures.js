import Binance from "node-binance-api";
const binance = new Binance().options({
  APIKEY: "exxOOqK4qQ6Tsf2ZRyZeWdIyZ2d3Rs7RkwSskyRroZYYAgSuSJ39nBmuSO70XkRv",
  APISECRET: "T2Dl7rKeRbAEO2dBDLgvSTss9VOCzgqNXuol9wGiMo0fYDkh77ARuTfZIz96Eid4",
});

export const getBalance = async (currency) => {
  let bal;
  const balance = await binance.futuresBalance();
  const keys = Object.keys(balance);
  keys.map((value) => {
    if (balance[value].asset === currency) {
      bal = parseFloat(balance[value].balance);
    }
  });

  return bal;
};

const exchange = async (coin) => {
  let min;
  let _exchange = await binance.futuresExchangeInfo();
  _exchange = await _exchange.symbols;
  const keys = Object.keys(_exchange);
  keys.map((value) => {
    if (_exchange[value].symbol === coin) {
      min = _exchange[value].filters["2"].minQty;
    }
  });
  return min;
};

const decimalCount = (number) => {
  const numberAsString = number.toString();
  if (numberAsString.includes(".")) {
    return numberAsString.split(".")[1].length;
  }
  return 0;
};

export const buy = async (coin, price, usd, leverage) => {
  const min = await exchange(coin);
  const dec = await decimalCount(min);
  let quantity = parseFloat(((1 / price) * usd * leverage).toFixed(dec));

  await binance.futuresMarginType(coin, "ISOLATED");
  await binance.futuresLeverage(coin, leverage);
  const txn = await binance.futuresMarketBuy(coin, quantity);
  console.log(coin , txn)
  return parseFloat(await txn.origQty)
};

export const closeBuy = async (coin , quantity) => {
  const txn = await binance.futuresMarketSell(coin, quantity);
  console.log("closeBuy" , coin , txn)
}

export const closeSell = async (coin , quantity) => {
  const txn = await binance.futuresMarketBuy(coin, quantity);
  console.log("closeSell" , coin ,txn)
}

export const sell = async (coin, price, usd, leverage) => {
  const min = await exchange(coin);
  const dec = await decimalCount(min);
  let quantity = parseFloat(((1 / price) * usd * leverage).toFixed(dec));

  await binance.futuresMarginType(coin, "ISOLATED");
  await binance.futuresLeverage(coin, leverage);
  const txn = await binance.futuresMarketSell(coin, quantity);
  console.log(coin , txn)
  return parseFloat(await txn.origQty)
};



