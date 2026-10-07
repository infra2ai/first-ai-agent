module.exports = async function (context, req) {
    const orders = {
        "BP-1042": { item: "Chocolate celebration cake", status: "Out for delivery", eta: "Today between 2 pm and 3 pm" },
        "BP-1043": { item: "Vanilla cupcakes, box of 12", status: "In the oven", eta: "Ready for pickup tomorrow from 9 am" },
        "BP-1044": { item: "Lemon tart", status: "Delivered", eta: "Delivered yesterday at 4:12 pm" }
    };
    const id = (req.query.orderId || "").trim().toUpperCase();
    const order = orders[id];
    context.res = {
        headers: { "Content-Type": "application/json" },
        body: order
            ? { orderId: id, found: true, ...order }
            : { orderId: id, found: false, message: "There is no order with this number." }
    };
};
