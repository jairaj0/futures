import WebSocket from "ws";
import { buy, closeBuy, closeSell, sell } from "./futures.js";
const ws = new WebSocket("wss://fstream.binance.com/ws/!ticker@arr");


let tradeCoins = [];
let tradeHis = [];
let tradeUSD = 5;
let _leverage = 2;

ws.onmessage = (event) => {
  let data = JSON.parse(event.data);
  data.map(async (value) => {
    if (value.s.substring(value.s.length - 4) === "USDT") {
      if (parseFloat(value.c) >= parseFloat(value.h)) {
          if (!tradeCoins.includes(value.s)) {
            tradeHandler(value, "long");
        }
      } else if (parseFloat(value.c) <= parseFloat(value.l)) {
          if (!tradeCoins.includes(value.s)) {
            tradeHandler(value, "short");
        }
      } 
    }
  });
};

const tradeOn = async (cointradehis) => {
  let coin = cointradehis.coin.toLowerCase();

  tradeCoins.push(cointradehis.coin);

  // console.log(cointradehis); // start trade withe these data

  const ws2 = new WebSocket(`wss://fstream.binance.com/ws/${coin}@markPrice`);

  ws2.onmessage = async (event) => {
    let data = JSON.parse(event.data);
    let price = parseFloat(data.p);

    if (cointradehis.trade === "LONG") {
      if (price >= cointradehis.takeProfit) {
        await closeBuy(cointradehis.coin, cointradehis.quantity);

        cointradehis.pnl = price - cointradehis.price;

        cointradehis.takeProfit = price;


        ws2.close();

        delete tradeHis[cointradehis.coin];

        tradeCoins.splice(tradeCoins.indexOf(cointradehis.coin), 1);
      } else if (price <= cointradehis.stopLose) {
        await closeBuy(cointradehis.coin, cointradehis.quantity);

        cointradehis.pnl = price - cointradehis.price;

        cointradehis.stopLose = price;


        ws2.close();

        delete tradeHis[cointradehis.coin];

        tradeCoins.splice(tradeCoins.indexOf(cointradehis.coin), 1);
      }
    } else if (cointradehis.trade === "SHORT") {
      if (price <= cointradehis.takeProfit) {
        await closeSell(cointradehis.coin, cointradehis.quantity);

        cointradehis.pnl = cointradehis.price - price;

        cointradehis.takeProfit = price;


        ws2.close();

        delete tradeHis[cointradehis.coin];

        tradeCoins.splice(tradeCoins.indexOf(cointradehis.coin), 1);
      } else if (price >= cointradehis.stopLose) {
        await closeSell(cointradehis.coin, cointradehis.quantity);

        cointradehis.pnl = cointradehis.price - price;

        cointradehis.stopLose = price;


        ws2.close();

        delete tradeHis[cointradehis.coin];

        tradeCoins.splice(tradeCoins.indexOf(cointradehis.coin), 1);
      }
    }
  };
};

const tradeHandler = async (value, trade) => {
  if (trade === "long") {
    // (coin , price , usd , leverage)
    let q = await buy(value.s, parseFloat(value.c), tradeUSD, _leverage , tradeCoins.length + 1);

    if (q > 0) {
      tradeHis[value.s] = {
        quantity: q,
        coin: value.s,
        trade: "LONG",
        price: parseFloat(value.c),
        takeProfit: parseFloat(value.c) * 1.0025,
        stopLose: parseFloat(value.c) * 0.99,
        pnl: 0,
      };
      tradeOn(tradeHis[value.s]);
    }
  } else if (trade === "short") {
    // (coin , price , usd , leverage)
    let q = await sell(value.s, parseFloat(value.c), tradeUSD, _leverage , tradeCoins.length + 1);

    if (q > 0) {
      tradeHis[value.s] = {
        quantity: q,
        coin: value.s,
        trade: "SHORT",
        price: parseFloat(value.c),
        takeProfit: parseFloat(value.c) * 0.9975,
        stopLose: parseFloat(value.c) * 1.01,
        pnl: 0,
      };
      tradeOn(tradeHis[value.s]);
    }
  }
};

console.log("Running . . .");
