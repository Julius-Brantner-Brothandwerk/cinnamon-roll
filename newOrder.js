const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const express = require("express");
const axios = require("axios");

const router = express.Router();

router.post("/", async (req, res) => {
  const articleUrl = process.env.AIRTABLE_ARTICLE_URL;
  const customerUrl = process.env.AIRTABLE_CUSTOMER_URL;
  const records = [];
  const { restaurant, orderProducts, deliveryDate } = req.body;

  const airtableArticle = await fetchAirtable(articleUrl);
  const airtableCustomers = await fetchAirtable(customerUrl);
  const articleDict = arrayToDict(airtableArticle, "Artikelnummer");
  const customerDict = arrayToDict(airtableCustomers, "Kundennummer");

  if (restaurant[0].customerNumber === undefined) return res.sendStatus(422);
  if (customerDict[`${restaurant[0].customerNumber}`] === undefined) return res.sendStatus(422);

  const airtableCustomerId = customerDict[`${restaurant[0].customerNumber}`].id;

  for (const order of orderProducts[0].product) {
    if (articleDict[`${order.externalId}`] === undefined) return res.sendStatus(422);
    let airtableArticleId = articleDict[`${order.externalId}`].id;
    let lineItemRecord = {
      fields: {
        Kunde: [airtableCustomerId],
        Artikel: [airtableArticleId],
        Menge: +order.amount,
        Lieferzeitpunkt: deliveryDate,
      },
    };
    records.push(lineItemRecord);
  }
  const request = await createLineItem(records);

  res.sendStatus(200);
});

async function fetchAirtable(baseUrl, offset = "") {
  let url = `${baseUrl}`;
  if (offset != "") {
    url = `${baseUrl}&offset=${offset}`;
  }
  const headers = {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
  };

  try {
    const response = await axios.get(url, {
      headers: headers,
    });
    const data = response.data;
    const records = data.records;

    if (data.offset) {
      return records.concat(await fetchAirtable(baseUrl, data.offset));
    } else {
      return records;
    }
  } catch (error) {
    console.error(error.toJSON());
  }
}

function arrayToDict(array, key) {
  const newDict = {};
  array.map((record) => {
    newDict[record.fields[key]] = {
      ...record,
    };
  });
  delete newDict[undefined];
  return newDict;
}

async function createLineItem(records) {
  const headers = {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
  };
  console.log(headers);
  const url = process.env.AIRTABLE_NEW_LINE_ITEM_URL;
  try {
    const response = await axios.post(url, { records: records }, { headers: headers });
    if (response) {
      console.log("response", response.data);
    }
  } catch (error) {
    console.error("error", error.toJSON());
  }
}

module.exports = router;
