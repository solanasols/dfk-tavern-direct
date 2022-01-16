import Web3 from "web3";
import { GraphQLClient, gql } from 'graphql-request';
import HDWalletProvider from "@truffle/hdwallet-provider";


import dfkHeroABI from "../dfkHeroABI.json";
const dfkHeroAddress = "0x5f753dcdf9b1ad9aabc1346614d1f4746fd6ce5c";

import dfkHeroAuction from "../dfkHeroAuctionABI.json";
const dfkHeroAuctionAddress = "0x13a65B9F8039E2c032Bc022171Dc05B30c3f2892";

async function getHeroIdsBatch(where, client, offset) {
  let query = gql`
	query {
    heros(
      first: 1000,
      skip: ${offset},
      where: {
        ${where}
      }
    ) {
      id
    }
  }`;

	return await client.request(query).catch((error) => console.error(error));
}

async function getHeroIds(where) 
{
	const endpoint = 'https://graph2.defikingdoms.com/subgraphs/name/defikingdoms/apiv5'

	const graphQLClient = new GraphQLClient(endpoint, {
		headers: {
			'Content-Type': 'application/json',
		},
	})

  let offset = 0;
  let result = [];
  let last = 0;
	do {
    const r = await getHeroIdsBatch(where, graphQLClient, offset);
    offset += 1000;
    const ids = r.heros.map(h => h.id);
    result = result.concat(ids);
    last = ids.length;
  }
  while (last === 1000);
  return result;
}

async function* queryListRpcWithRetry(list, query, batchSize, retries = 3) {
  let retryQueue = [];
  let currentQueue = list.map(item => ({ item }));
  while (currentQueue.length && retries > 0) {
    while (currentQueue.length) {
      const currentBatch = currentQueue.splice(0, batchSize);
      const r = await Promise.all(
        currentBatch.map(cur => query(cur.item).catch(error => { retryQueue.push(({item: cur.item, error})); }))
      );
      for (const s of r) {
        if (s !== undefined && s !== null) yield s;
      }
      console.log(`current: ${currentQueue.length}, retry: ${retryQueue.length}, retries: ${retries}, batchSize: ${batchSize}`)
    }
    currentQueue = retryQueue;
    retryQueue = [];
    batchSize = batchSize > retries ? batchSize - retries : 1;
    retries--;
  }
  for (const failed of currentQueue) {
    console.log(`${failed.item} failed: ${failed.error}`);
  }
}

async function querySingleRpcWithRetry(query, retries) {
  let error;
  while (retries > 0) {
    try {
      return await query();
    }
    catch (e) {
      error = e;
    }
    retries--;
  }
  throw error;
}

async function* getHeroes(list, maxPrice) {
  const web3 = new Web3(new Web3.providers.HttpProvider("https://api.harmony.one"));
  const heroContract = new web3.eth.Contract(dfkHeroABI, dfkHeroAddress);
  const auctionContract = new web3.eth.Contract(dfkHeroAuction, dfkHeroAuctionAddress);
  
  for await (const heroId of queryListRpcWithRetry(list, id => auctionContract.methods.isOnAuction(id).call().then(onAuction => onAuction ? id : null), 10, 3)) {
    try {
      const auction = await querySingleRpcWithRetry(auctionContract.methods.getAuction(heroId).call, 5);
      const price = Number.parseInt(auction.startingPrice.substring(0, auction.startingPrice.length - 15), 10);
      if (price <= maxPrice * 1000) {
        const hero = await querySingleRpcWithRetry(heroContract.methods.getHero(heroId).call, 5);
        yield {
          heroId,
          auction,
          price,
          hero
        }
      }
    }
    catch (error) {
      console.log(`${heroId} failed: ${error}`);
    }
  }
}

export function queryHeroes() {
  document.getElementById('result').innerHTML = "Starting query<br />";
  const maxPrice = $("#maxprice").val();
  const query = [0,1,2,3,4,5,6,7,8,9].map(i => [ $(`#filter${i}property`).val(), $(`#filter${i}value`).val() ])
    .filter(x => x[0]?.length > 0 && x[1]?.length > 0)
    .map(x => `${x[0]}: ${["mainClass", "subClass", "profession", "statBoost1", "statBoost2"].includes(x[0]) ? `"${x[1]}"` : x[1]}`)
    .join("\n");
  try {
    getHeroIds(query)
    .then(async ids => {
      for await (const hero of getHeroes(ids, maxPrice)) {
        document.getElementById('result').innerHTML += `Found Hero ${hero.heroId} at price ${hero.price}! Details: ${JSON.stringify(hero.hero)}<br />`;
      }
      document.getElementById('result').innerHTML += "Finished";
    });
  }
  catch(e) {
    document.getElementById('result').innerHTML += e;
  }
  finally {}
}

async function buyHeroAsync(provider, heroId, userAddress, priceInWei) {
  const web3 = new Web3(provider);
  const auctionContract = new web3.eth.Contract(dfkHeroAuction, dfkHeroAuctionAddress);
  try {
    const result = await auctionContract.methods.bid(heroId, priceInWei) // 40 JEWEL = "40000000000000000000" //web3.utils.toWei("40", 'ether')
      .send({from: userAddress, gas: 500000, gasPrice: '1890000000000'});
    document.getElementById("buyResult").innerHTML = result;
  }
  catch(e) {
    document.getElementById("buyResult").innerHTML = e;
  }
}

export function buyHero() {
  const id = $("#heroid").val();
  const secret = $("#secret").val();
  const userAddress = $('#address').val();
  const priceInWei = $('#price').val();

  document.getElementById('buyResult').innerHTML = `Buying hero ${id} for ${userAddress} at price of ${priceInWei} with wallet ${secret}`;
  const provider = new HDWalletProvider({
    mnemonic: {
      phrase: secret
    },
    providerOrUrl: "https://api.harmony.one"
  });
  buyHeroAsync(provider, id, userAddress, priceInWei)
}