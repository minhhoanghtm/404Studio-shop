# Spring AI Tool Catalog

| Spring tool | Node tool | Access | Mutation policy |
| --- | --- | --- | --- |
| `searchProducts` | `search_products` | public/read | none |
| `productDetails` | `get_product_details` | public/read | none |
| `getCart` | `get_my_cart` | authenticated shopper | none |
| `addToCart` | `add_to_cart` | authenticated shopper | prepares Node confirmation only |
| `myOrders` | `get_my_orders` | authenticated shopper | ownership enforced by Node |
| `searchKnowledge` | `search_knowledge_base` | published content | none |

Wishlist, voucher, profile updates, order confirmation/cancellation and payment tools are `BLOCKED_BY_BACKEND` until their audited business adapters are available. They are not represented as fake tools.
