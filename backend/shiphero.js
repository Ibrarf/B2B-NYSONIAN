/**
 * shiphero.js — ShipHero GraphQL API helper
 * Uses the long-lived JWT from SHIPHERO_TOKEN env var.
 *
 * verifyOrder(orderNumber) → { found, order } or throws
 *   order = { id, order_number, fulfillment_status, line_items[] }
 *   line_items[i] = { sku, quantity, name }
 */

const SHIPHERO_GQL = "https://public-api.shiphero.com/graphql";

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

/**
 * Look up an order by order_number in ShipHero.
 * Returns { found: true, order: {...} } or { found: false }.
 * Throws on network/auth errors.
 */
async function verifyOrder(orderNumber) {
  const res = await fetch(SHIPHERO_GQL, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${getToken()}`,
    },
    body: JSON.stringify({
      query:     VERIFY_QUERY,
      variables: { orderNo: orderNumber },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`ShipHero responded ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = await res.json();

  if (json.errors?.length) {
    const msg = json.errors.map(e => e.message).join("; ");
    // Token expired
    if (msg.toLowerCase().includes("unauthorized") || msg.toLowerCase().includes("jwt")) {
      throw new Error("ShipHero token expired or invalid — update SHIPHERO_TOKEN in backend/.env");
    }
    throw new Error(`ShipHero error: ${msg}`);
  }

  const edges = json?.data?.orders?.data?.edges ?? [];
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
