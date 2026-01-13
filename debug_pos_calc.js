
const products = [
  {
    id: "s-4",
    productName: "NID Correction",
    sellingPrice: 100,
    type: "service",
  },
  {
    id: "p-1",
    productName: "Highspeed Pen",
    sellingPrice: 3.75,
    type: "product",
  }
];

const selectedIds = new Set(["s-4"]);
const quantities = { "s-4": 1 };
const priceOptions = {}; // Defaults to fixed
const customPrices = {};

function calculateTotal() {
    let sum = 0;
    selectedIds.forEach((id) => {
      const product = products.find((p) => p.id === id);
      if (product) {
        const qty = quantities[id] || 1;
        const option = priceOptions[id] || 'fixed';

        let price = 0;

        if (option === 'fixed') {
          price = product.sellingPrice;
          console.log(`Item ${id}: Fixed Price ${price}`);
        } else {
          const customVal = parseFloat(customPrices[id] || "0");
          price = isNaN(customVal) ? 0 : customVal;
          console.log(`Item ${id}: Custom Price ${price}`);
        }

        sum += price * qty;
      }
    });
    return sum;
}

const total = calculateTotal();
console.log("Total:", total);
