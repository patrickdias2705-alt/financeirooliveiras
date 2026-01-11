"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2Icon, CheckCircle2, Clock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Installment {
  id: number;
  installment_number: number;
  amount: number;
  due_date: string;
  paid: boolean;
  paid_at: string | null;
  order_id?: number;
  transaction_id?: number;
  order?: {
    id: number;
    total_amount: number;
    customer?: {
      name: string;
    };
  };
  transaction?: {
    id: number;
    description: string;
    amount: number;
  };
}

export default function InstallmentsPage() {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "paid" | "pending">("all");
  const [type, setType] = useState<"all" | "orders" | "expenses">("all");

  const fetchInstallments = useCallback(async () => {
    try {
      setLoading(true);
      
      const allInstallments: Installment[] = [];

      // Buscar parcelas de pedidos
      if (type === "all" || type === "orders") {
        const ordersResponse = await fetch("/api/orders");
        if (ordersResponse.ok) {
          const orders = await ordersResponse.json();
          for (const order of orders) {
            if (order.installments && order.installments > 1) {
              try {
                const installmentsResponse = await fetch(`/api/orders/${order.id}/installments`);
                if (installmentsResponse.ok) {
                  const orderInstallments = await installmentsResponse.json();
                  if (orderInstallments && orderInstallments.length > 0) {
                    allInstallments.push(
                      ...orderInstallments.map((inst: any) => ({
                        ...inst,
                        order_id: order.id,
                        order: {
                          id: order.id,
                          total_amount: order.total_amount,
                          customer: order.customer,
                        },
                      }))
                    );
                  }
                }
              } catch (error) {
                console.error(`Error fetching installments for order ${order.id}:`, error);
              }
            }
          }
        }
      }

      // Buscar parcelas de despesas
      if (type === "all" || type === "expenses") {
        const transactionsResponse = await fetch("/api/transactions");
        if (transactionsResponse.ok) {
          const transactions = await transactionsResponse.json();
          for (const transaction of transactions) {
            if (transaction.type === "expense" && transaction.installments && transaction.installments > 1) {
              try {
                const installmentsResponse = await fetch(`/api/transactions/${transaction.id}/installments`);
                if (installmentsResponse.ok) {
                  const expenseInstallments = await installmentsResponse.json();
                  if (expenseInstallments && expenseInstallments.length > 0) {
                    allInstallments.push(
                      ...expenseInstallments.map((inst: any) => ({
                        ...inst,
                        transaction_id: transaction.id,
                        transaction: {
                          id: transaction.id,
                          description: transaction.description,
                          amount: transaction.amount,
                        },
                      }))
                    );
                  }
                }
              } catch (error) {
                console.error(`Error fetching installments for transaction ${transaction.id}:`, error);
              }
            }
          }
        }
      }

      // Filtrar por status
      let filtered = allInstallments;
      if (filter === "paid") {
        filtered = allInstallments.filter((inst) => inst.paid);
      } else if (filter === "pending") {
        filtered = allInstallments.filter((inst) => !inst.paid);
      }

      // Ordenar por data de vencimento
      filtered.sort((a, b) => {
        const dateA = new Date(a.due_date).getTime();
        const dateB = new Date(b.due_date).getTime();
        return dateA - dateB;
      });

      setInstallments(filtered);
    } catch (error) {
      console.error("Error fetching installments:", error);
    } finally {
      setLoading(false);
    }
  }, [filter, type]);

  useEffect(() => {
    fetchInstallments();
  }, [fetchInstallments]);

  const handleMarkAsPaid = async (installment: Installment) => {
    try {
      let response;
      if (installment.order_id) {
        // Parcela de pedido
        response = await fetch(`/api/orders/${installment.order_id}/installments/${installment.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paid: true, paid_at: new Date().toISOString() }),
        });
      } else if (installment.transaction_id) {
        // Parcela de despesa
        response = await fetch(`/api/transactions/installments/${installment.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paid: true, paid_at: new Date().toISOString() }),
        });
      }

      if (response?.ok) {
        // Recarregar parcelas
        fetchInstallments();
      } else {
        const errorData = await response?.json();
        alert(`Erro ao marcar como paga: ${errorData?.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error("Error marking installment as paid:", error);
      alert("Erro ao marcar parcela como paga");
    }
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2Icon className="mx-auto h-12 w-12 animate-spin" />
      </div>
    );
  }

  const totalPending = installments.filter((inst) => !inst.paid).reduce((sum, inst) => sum + inst.amount, 0);
  const totalPaid = installments.filter((inst) => inst.paid).reduce((sum, inst) => sum + inst.amount, 0);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Pagamentos Parcelados</CardTitle>
            <CardDescription>
              Gerencie todas as parcelas de pedidos e despesas
            </CardDescription>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="type">Tipo</Label>
              <Select value={type} onValueChange={(value: "all" | "orders" | "expenses") => setType(value)}>
                <SelectTrigger id="type" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="orders">Pedidos</SelectItem>
                  <SelectItem value="expenses">Despesas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="filter">Status</Label>
              <Select value={filter} onValueChange={(value: "all" | "paid" | "pending") => setFilter(value)}>
                <SelectTrigger id="filter" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="paid">Pagas</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex gap-4 mt-4">
          <div className="p-3 bg-orange-500/20 border border-orange-500/50 rounded-lg">
            <p className="text-sm text-orange-600">Pendentes</p>
            <p className="text-xl font-bold text-orange-700">R$ {totalPending.toFixed(2)}</p>
          </div>
          <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
            <p className="text-sm text-green-600">Pagas</p>
            <p className="text-xl font-bold text-green-700">R$ {totalPaid.toFixed(2)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Parcela</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {installments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma parcela encontrada
                  </TableCell>
                </TableRow>
              ) : (
                installments.map((installment) => (
                  <TableRow key={installment.id}>
                    <TableCell>
                      <Badge variant={installment.order_id ? "default" : "secondary"}>
                        {installment.order_id ? "Pedido" : "Despesa"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {installment.order_id ? (
                        <div>
                          <p className="font-medium">Pedido #{installment.order_id}</p>
                          {installment.order?.customer && (
                            <p className="text-xs text-muted-foreground">
                              {installment.order.customer.name}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium">Despesa #{installment.transaction_id}</p>
                          {installment.transaction && (
                            <p className="text-xs text-muted-foreground">
                              {installment.transaction.description}
                            </p>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {installment.installment_number}ª Parcela
                    </TableCell>
                    <TableCell>R$ {installment.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      {new Date(installment.due_date + 'T00:00:00').toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>
                      {installment.paid ? (
                        <Badge className="bg-green-500/20 text-green-700 border-green-500/50">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Paga
                        </Badge>
                      ) : (
                        <Badge className="bg-orange-500/20 text-orange-700 border-orange-500/50">
                          <Clock className="w-3 h-3 mr-1" />
                          Pendente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {!installment.paid && (
                        <Button
                          size="sm"
                          onClick={() => handleMarkAsPaid(installment)}
                        >
                          Marcar como Paga
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
