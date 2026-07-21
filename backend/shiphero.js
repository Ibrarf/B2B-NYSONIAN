const https = require("https");

const SHIPHERO_HOST = "public-api.shiphero.com";
const SHIPHERO_PATH = "/graphql";

function getToken() {
  const t = process.env.SHIPHERO_TOKEN;
  if (!t) throw new Error("SHIPHERO_TOKEN not set in environment");
  return t;
}

const VERIFY_QUERY = `
  query VerifyOrder($orderNo: String!) {
    orders(order_number: $orderNo) {
      data {
        edges {
          node {
            id
            order_number
            fulfillment_status
            line_items {
              edges {
                node {
                  id
                  sku
                  quantity
                  name
                  unit_price
                }
              }
            }
          }
        }
      }
    }
  }
`;

function gqlRequest(orderNumber) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: VERIFY_QUERY, variables: { orderNo: orderNumber } });
    const options = {
      hostname: SHIPHERO_HOST,
      path:     SHIPHERO_PATH,
      method:   "POST",
      headers: {
        "Content-Type":   "application/json",
        "Content-Length": Buffer.byteLength(body),
        "Authorization":  `Bearer ${getToken()}`,
      },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        if (res.statusCode !== 200) {
          reject(new Error(`ShipHero responded ${res.statusCode}: ${data.slice(0, 200)}`));
          return;
        }
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error("ShipHero returned invalid JSON")); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function verifyOrder(orderNumber) {
  let json = await gqlRequest(orderNumber);

  if (json.errors?.length) {
    const msg = json.errors.map(e => e.message).join("; ");
    if (msg.toLowerCase().includes("unauthorized") || msg.toLowerCase().includes("jwt")) {
      throw new Error("ShipHero token expired or invalid — update SHIPHERO_TOKEN in backend/.env");
    }
    throw new Error(`ShipHero error: ${msg}`);
  }

  let edges = json?.data?.orders?.data?.edges ?? [];

  // ShipHero stores orders with a # prefix (e.g. #779924).
  // If not found, retry with # prepended.
  if (edges.length === 0 && !orderNumber.startsWith("#")) {
    json = await gqlRequest(`#${orderNumber}`);
    edges = json?.data?.orders?.data?.edges ?? [];
  }

  if (edges.length === 0) return { found: false };

  const node = edges[0].node;
  const lineItems = (node.line_items?.edges ?? []).map(e => ({
    id:         e.node.id,
    sku:        e.node.sku,
    quantity:   e.node.quantity,
    name:       e.node.name,
    unit_price: e.node.unit_price,
  }));

  return {
    found: true,
    order: {
      id:                 node.id,
      order_number:       node.order_number,
      fulfillment_status: node.fulfillment_status,
      line_items:         lineItems,
    },
  };
}

module.exports = { verifyOrder };
