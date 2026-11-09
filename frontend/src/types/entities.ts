export interface Product {
  _id: string;
  name: string;
  price: number;
}
export interface Warehouse {
  _id: string;
  code: string;
  name: string;
  city: string;
  address: string;
  active: boolean;
}
export interface Stock {
  _id: string;
  productId: string;
  warehouseId: string;
  quantityOnHand: number;
  quantityReserved: number;
}
export interface Line {
  productId: string;
  quantity: number;
}
export interface Order {
  _id: string;
  description: string;
  status: "PENDING" | "CONFIRMED" | "REJECTED" | "COMPLETED";
  items: (Line & { unitPrice: number })[];
}
export interface Reservation {
  _id: string;
  orderId: string;
  stockId: string;
  quantity: number;
  status: "RESERVED" | "FULFILLED" | "RELEASED";
}
export interface PurchaseOrder {
  _id: string;
  stockId: string;
  productId: string;
  supplierId: string;
  quantity: number;
}
