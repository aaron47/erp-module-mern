import type { Product, Warehouse, Stock, Order } from "../types/entities";
export function reference(id: string) {
  return "#" + id.slice(0, 8).toUpperCase();
}
export function productName(products: Product[], id: string) {
  return (
    products.find((product) => product._id === id)?.name ?? "Unknown product"
  );
}
export function warehouseName(warehouses: Warehouse[], id: string) {
  return (
    warehouses.find((warehouse) => warehouse._id === id)?.name ??
    "Unknown warehouse"
  );
}
export function stockLabel(
  stock: Stock,
  products: Product[],
  warehouses: Warehouse[],
) {
  return (
    productName(products, stock.productId) +
    " / " +
    warehouseName(warehouses, stock.warehouseId)
  );
}
export function orderLabel(order: Order) {
  return (
    (order.description ? order.description + " " : "") + reference(order._id)
  );
}
