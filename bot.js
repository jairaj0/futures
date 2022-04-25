import WebSocket from "ws";
import { buy, closeBuy, closeSell, getBalance, sell } from "./futures.js";
const ws = new WebSocket("wss://fstream.binance.com/ws/!ticker@arr");


let trade = [];
let tradeHis = [];
let tt = 0;
let balance = await getBalance("USDT"); // $ * laverage
let tradeUSD = 5;
let _leverage = 10;

ws.onmessage = (event) => {
  let data = JSON.parse(event.data);
  data.map(async (value) => {
    if (value.s.substring(value.s.length - 4) === "USDT") {
      if (parseFloat(value.c) >= parseFloat(value.h)) {
        if (!trade.includes(value.s)) {

          balance = await getBalance("USDT");

          if (balance >= tradeUSD) {

            tradeHandler(value, "long");
            trade.push(value.s);

          }

          balance = await getBalance("USDT");
        }
      } else if (parseFloat(value.c) <= parseFloat(value.l)) {
        if (!trade.includes(value.s)) {

          balance = await getBalance("USDT");

          if (balance >= tradeUSD) {

            tradeHandler(value, "short");
            trade.push(value.s);

          }

          balance = await getBalance("USDT");
        }
      } else if (balance < tradeUSD) {
        console.log("Low Balance !!!");
      }
    }
  });
};

const tradeOn = async(cointradehis) => {
  let coin = cointradehis.coin.toLowerCase();

  // console.log(cointradehis); // start trade withe these data

  const ws2 = new WebSocket(`wss://fstream.binance.com/ws/${coin}@markPrice`);


  ws2.onmessage = async(event) => {
    let data = JSON.parse(event.data);
    let price = parseFloat(data.p);

    if (cointradehis.trade === "LONG") {
      if (price >= cointradehis.takeProfit) {

        await closeBuy(cointradehis.coin , cointradehis.quantity)

        cointradehis.pnl = price - cointradehis.price;

        cointradehis.takeProfit = price;

        tt += cointradehis.pnl;

        // console.log(cointradehis, tt);

        ws2.close();

        delete tradeHis[cointradehis.coin];

        trade.splice(trade.indexOf(cointradehis.coin), 1);
      } else if (price <= cointradehis.stopLose) {

        await closeBuy(cointradehis.coin , cointradehis.quantity)

        cointradehis.pnl = price - cointradehis.price;

        cointradehis.stopLose = price;

        tt += cointradehis.pnl;

        // console.log(cointradehis, tt);

        ws2.close();

        delete tradeHis[cointradehis.coin];

        trade.splice(trade.indexOf(cointradehis.coin), 1);
      }
    } else if (cointradehis.trade === "SHORT") {
      if (price <= cointradehis.takeProfit) {

        await closeSell(cointradehis.coin , cointradehis.quantity)

        cointradehis.pnl = cointradehis.price - price;

        cointradehis.takeProfit = price;

        tt += cointradehis.pnl;



        // console.log(cointradehis, tt);

        ws2.close();

        delete tradeHis[cointradehis.coin];

        trade.splice(trade.indexOf(cointradehis.coin), 1);
      } else if (price >= cointradehis.stopLose) {

        await closeSell(cointradehis.coin , cointradehis.quantity)

        cointradehis.pnl = cointradehis.price - price;

        cointradehis.stopLose = price;

        tt += cointradehis.pnl;

        // console.log(cointradehis, tt);

        ws2.close();

        delete tradeHis[cointradehis.coin];

        trade.splice(trade.indexOf(cointradehis.coin), 1);
      }
    }
  };
};


const tradeHandler = async(value, trade) => {
  if (trade === "long") {

    // (coin , price , usd , leverage)
    let q = await buy(value.s , parseFloat(value.c) , tradeUSD , _leverage)

    tradeHis[value.s] = {
      quantity : q ,
      coin: value.s,
      trade: "LONG",
      price: parseFloat(value.c),
      takeProfit: parseFloat(value.c) * 1.005,
      stopLose: parseFloat(value.c) * 0.98,
      pnl: 0,
    };
    tradeOn(tradeHis[value.s]);
  } else if (trade === "short") {

    // (coin , price , usd , leverage)
    let q = await sell(value.s , parseFloat(value.c) , tradeUSD , _leverage)

    tradeHis[value.s] = {
      quantity : q ,
      coin: value.s,
      trade: "SHORT",
      price: parseFloat(value.c),
      takeProfit: parseFloat(value.c) * 0.995,
      stopLose: parseFloat(value.c) * 1.02,
      pnl: 0,
    };
    tradeOn(tradeHis[value.s]);
  }
};

console.log("Running . . .");
