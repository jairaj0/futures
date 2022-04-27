import Binance from "node-binance-api";
import 'dotenv/config';

const binance = new Binance().options({
  APIKEY: process.env.API_KEY,
  APISECRET: process.env.API_SECRET,
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

const PNL = async(coin) => {
  let income = await binance.futuresIncome();
  let letestPnl ;
  Object.keys(income).map(value => {
    if(income[value].symbol === coin && income[value].incomeType === "REALIZED_PNL"){
      letestPnl= income[value]
    }
  })
  return letestPnl
}

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

export const buy = async (coin, price, usd, leverage , tradelen) => {
  let balance = await getBalance("USDT");

  if ((balance - (usd * tradelen)) > usd) {
    // console.log((balance - (usd * tradelen)) , usd , tradelen)
    const min = await exchange(coin);
    const dec = await decimalCount(min);
    let quantity = parseFloat(((1 / price) * usd * leverage).toFixed(dec));

    await binance.futuresMarginType(coin, "ISOLATED");
    await binance.futuresLeverage(coin, leverage);
    const txn = await binance.futuresMarketBuy(coin, quantity);
    console.log(coin, txn);
    return parseFloat(await txn.origQty);
  }
};

export const sell = async (coin, price, usd, leverage , tradelen) => {
  let balance = await getBalance("USDT");

  if ((balance - (usd * tradelen)) > usd) {
    // console.log((balance - (usd * tradelen)) , usd , tradelen)
    const min = await exchange(coin);
    const dec = await decimalCount(min);
    let quantity = parseFloat(((1 / price) * usd * leverage).toFixed(dec));

    await binance.futuresMarginType(coin, "ISOLATED");
    await binance.futuresLeverage(coin, leverage);
    const txn = await binance.futuresMarketSell(coin, quantity);
    console.log(coin, txn);
    return parseFloat(await txn.origQty);
  }
};

export const closeBuy = async (coin, quantity) => {
  await binance.futuresMarketSell(coin, quantity);
let _pnl = await PNL(coin);
  console.log("closeBuy", coin, _pnl);
};

export const closeSell = async (coin, quantity) => {
  await binance.futuresMarketBuy(coin, quantity);
  let _pnl = await PNL(coin);
  console.log("closeSell", coin, _pnl);
};




