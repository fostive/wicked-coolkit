import { createElement } from "lwc";
import HitCounter from "wck/hitCounter";
import TradingCard from "wck/tradingCard";
import Webring from "wck/webring";

// eslint-disable-next-line @lwc/lwc/no-document-query
const main = document.querySelector("#main");

Object.entries({ TradingCard, Webring, HitCounter }).forEach(([name, is]) => {
  const tagName = ("wck" + name).replace(
    /[A-Z]/g,
    (l) => "-" + l.toLowerCase()
  );
  main.appendChild(createElement(tagName, { is }));
});
