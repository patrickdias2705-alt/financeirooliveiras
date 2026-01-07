"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";

type Product = {
  id: number;
  name: string;
  price: number;
};

type Customer = {
  id: number;
  name: string;
};

type PaymentMethod = {
  id: number;
  name: string;
};

interface POSProduct extends Product {
  quantity: number;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<POSProduct[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [installments, setInstallments] = useState(1);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    fetchPaymentMethods();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      if (!response.ok) throw new Error("Failed to fetch customers");
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch("/api/payment-methods");
      if (!response.ok) throw new Error("Failed to fetch payment methods");
      const data = await response.json();
      setPaymentMethods(data);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    }
  };

  const handleSelectProduct = (productId: number | string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    if (selectedProducts.some((p) => p.id === productId)) {
      setSelectedProducts(
        selectedProducts.map((p) =>
          p.id === productId ? { ...p, quantity: p.quantity + 1 } : p
        )
      );
    } else {
      setSelectedProducts([...selectedProducts, { ...product, quantity: 1 }]);
    }
  };

  const handleSelectCustomer = (customerId: number | string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setSelectedCustomer(customer);
    }
  };

  const handleSelectPaymentMethod = (paymentMethodId: number | string) => {
    const method = paymentMethods.find((pm) => pm.id === paymentMethodId);
    if (method) {
      setPaymentMethod(method);
    }
  };

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    setSelectedProducts(
      selectedProducts.map((p) =>
        p.id === productId ? { ...p, quantity: newQuantity } : p
      )
    );
  };

  const handleRemoveProduct = (productId: number) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== productId));
  };

  const total = selectedProducts.reduce(
    (sum, product) => sum + product.price * (product.quantity || 1),
    0
  );

  // Calcular valor da parcela baseado no total e número de parcelas
  const installmentValue = useMemo(() => {
    if (installments > 0 && total > 0) {
      return total / installments;
    }
    return total;
  }, [total, installments]);

  const handleCreateOrder = async () => {
    if (!selectedCustomer || !paymentMethod || selectedProducts.length === 0) {
      return;
    }

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          paymentMethodId: paymentMethod.id,
          products: selectedProducts.map(p => ({ id: p.id, quantity: p.quantity, price: p.price })),
          total,
          installments: installments > 1 ? installments : 1,
          installmentValue: installmentValue,
        }),
      });

      if (!response.ok) throw new Error("Failed to create order");

      const order = await response.json();

      // Reset the form
      setSelectedProducts([]);
      setSelectedCustomer(null);
      setPaymentMethod(null);
      setInstallments(1);
    } catch (error) {
      console.error("Error creating order:", error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Detalhes da Venda</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <Combobox
              items={customers}
              placeholder="Selecione o Cliente"
              onSelect={handleSelectCustomer}
            />
          </div>
          <div className="flex-1">
            <Combobox
              items={paymentMethods}
              placeholder="Selecione o Método de Pagamento"
              onSelect={handleSelectPaymentMethod}
            />
          </div>
          {paymentMethod && (paymentMethod.name === 'Crédito' || paymentMethod.name === 'Pix') && (
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">
                💳 Parcelas (até 12x)
              </label>
              <select
                value={installments}
                onChange={(e) => {
                  const newInstallments = parseInt(e.target.value);
                  setInstallments(newInstallments);
                }}
                className="w-full p-2 border-2 border-amber-500/50 rounded bg-background text-foreground font-medium"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => {
                  const valuePerInstallment = total > 0 ? total / num : 0;
                  return (
                    <option key={num} value={num}>
                      {num === 1 ? 'À Vista' : `${num}x de R$ ${valuePerInstallment.toFixed(2)}`}
                    </option>
                  );
                })}
              </select>
              {installments > 1 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  ⚠️ Venda será parcelada em {installments}x
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Produtos</CardTitle>
          <div className="mt-5">
          <Combobox
            items={products}
              placeholder="Selecione o Produto (pode selecionar vários)"
            noSelect
            onSelect={handleSelectProduct}
          />
            <p className="text-xs text-muted-foreground mt-2">
              Clique no produto para adicionar. Você pode selecionar múltiplos produtos.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>R$ {product.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <input
                      type="number"
                      min="1"
                      value={product.quantity || 1}
                      onChange={(e) =>
                        handleQuantityChange(
                          product.id,
                          parseInt(e.target.value) || 1
                        )
                      }
                      className="w-16 p-2 border rounded bg-background text-foreground"
                      style={{ color: 'inherit' }}
                    />
                  </TableCell>
                  <TableCell>
                    R$ {((product.quantity || 1) * product.price).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveProduct(product.id)}
                    >
                      Remover
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 space-y-2 p-4 bg-muted/50 rounded-lg border-2 border-amber-500/30">
            <div className="text-right space-y-1">
              <div className="text-lg">
                <strong>Total: R$ {total.toFixed(2)}</strong>
              </div>
              {installments > 1 && (
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                    💳 VENDA PARCELADA
                  </div>
                  <div className="text-base font-bold text-amber-700 dark:text-amber-300">
                    {installments}x de R$ {installmentValue.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total parcelado: R$ {total.toFixed(2)}
                  </div>
                </div>
              )}
              {installments === 1 && paymentMethod && (
                <div className="text-xs text-muted-foreground">
                  Pagamento à vista
                </div>
              )}
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={handleCreateOrder} disabled={selectedProducts.length === 0 || !selectedCustomer || !paymentMethod}>
              Criar Pedido
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
