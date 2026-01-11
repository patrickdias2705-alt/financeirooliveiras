"use client";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { EllipsisVerticalIcon, Loader2Icon } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { formatDate } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/date-picker";

type TransactionType = "income" | "expense";

interface Transaction {
  id: number;
  description: string;
  type: TransactionType;
  category: string;
  created_at: string;
  transaction_date?: string;
  amount: number;
  status: string;
  installments?: number;
  installment_value?: number;
}

export default function Cashier() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false);
  const [transactionToDelete, setTransactionToDelete] =
    useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    description: "",
    category: "",
    type: "income",
    amount: 0,
    status: "completed",
    installments: 1,
    transaction_date: new Date().toISOString().split('T')[0],
  });
  const [showInstallmentsDialog, setShowInstallmentsDialog] = useState(false);
  const [transactionInstallments, setTransactionInstallments] = useState<any[]>([]);
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  const [isEditTransactionDialogOpen, setIsEditTransactionDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editTransaction, setEditTransaction] = useState<Partial<Transaction>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewTransaction((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTransaction = async () => {
    try {
      const transactionData = {
        ...newTransaction,
        installments: newTransaction.type === "expense" && (newTransaction.installments || 1) > 1 
          ? newTransaction.installments 
          : 1,
        installment_value: newTransaction.type === "expense" && (newTransaction.installments || 1) > 1
          ? (newTransaction.amount || 0) / (newTransaction.installments || 1)
          : null,
        transaction_date: newTransaction.transaction_date || new Date().toISOString().split('T')[0],
      };

      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transactionData),
      });

      if (response.ok) {
        const addedTransaction = await response.json();
        setTransactions((prev) => [...prev, addedTransaction]);
        setNewTransaction({
          description: "",
          category: "",
          type: "income",
          amount: 0,
          status: "completed",
          installments: 1,
          transaction_date: new Date().toISOString().split('T')[0],
        });
        // Recarregar transações
        const refreshResponse = await fetch("/api/transactions");
        if (refreshResponse.ok) {
          const refreshedTransactions = await refreshResponse.json();
          setTransactions(refreshedTransactions);
        }
      } else {
        const errorData = await response.json();
        console.error("Failed to add transaction:", errorData);
        alert(`Erro ao adicionar transação: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
      alert("Erro ao adicionar transação. Tente novamente.");
    }
  };

  const handleDeleteTransaction = useCallback(async () => {
    if (!transactionToDelete) return;
    try {
      const response = await fetch(
        `/api/transactions/${transactionToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setTransactions(
          transactions.filter((t) => t.id !== transactionToDelete.id)
        );
        setIsDeleteConfirmationOpen(false);
        setTransactionToDelete(null);
      } else {
        console.error("Failed to delete transaction");
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  }, [transactionToDelete, transactions]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch("/api/transactions");
        if (!response.ok) {
          throw new Error("Failed to fetch transactions");
        }
        const data = await response.json();
        setTransactions(data);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2Icon className="mx-auto h-12 w-12 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Transações do Caixa</CardTitle>
          <CardDescription>Gerencie as transações do caixa.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Parcelas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{transaction.id}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>{transaction.category}</TableCell>
                  <TableCell>
                    <Badge variant={transaction.type}>{transaction.type === "income" ? "Receita" : "Despesa"}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(transaction.created_at)}</TableCell>
                  <TableCell>R$ {transaction.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    {transaction.installments && transaction.installments > 1 ? (
                      <span className="text-sm">
                        {transaction.installments}x de R$ {transaction.installment_value?.toFixed(2) || (transaction.amount / transaction.installments).toFixed(2)}
                      </span>
                    ) : (
                      "À vista"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        transaction.status === "completed"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {transaction.status === "completed" ? "Concluído" : "Pendente"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-haspopup="true"
                          size="icon"
                          variant="ghost"
                        >
                          <EllipsisVerticalIcon className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setEditTransaction({
                              description: transaction.description,
                              category: transaction.category,
                              type: transaction.type,
                              amount: transaction.amount,
                              status: transaction.status,
                              installments: transaction.installments || 1,
                              transaction_date: transaction.transaction_date || transaction.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
                            });
                            setIsEditTransactionDialogOpen(true);
                          }}
                        >
                          Editar
                        </DropdownMenuItem>
                        {transaction.type === "expense" && transaction.installments && transaction.installments > 1 && (
                          <DropdownMenuItem
                            onClick={async () => {
                              setSelectedTransactionId(transaction.id);
                              // Buscar parcelas da despesa
                              const response = await fetch(`/api/transactions/${transaction.id}/installments`);
                              if (response.ok) {
                                const installments = await response.json();
                                setTransactionInstallments(installments);
                                setShowInstallmentsDialog(true);
                              }
                            }}
                          >
                            Ver Parcelas
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => {
                            setTransactionToDelete(transaction);
                            setIsDeleteConfirmationOpen(true);
                          }}
                        >
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell>Novo</TableCell>
                <TableCell>
                  <Input
                    name="description"
                    value={newTransaction.description}
                    onChange={handleInputChange}
                    placeholder="Descrição"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    name="category"
                    value={newTransaction.category}
                    onChange={handleInputChange}
                    placeholder="Categoria"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    defaultValue={newTransaction.type}
                    onValueChange={(value) =>
                      setNewTransaction({
                        ...newTransaction,
                        type: value as TransactionType,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Receita</SelectItem>
                      <SelectItem value="expense">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>{formatDate(new Date().toISOString())}</TableCell>
                <TableCell>
                  <Input
                    name="amount"
                    type="number"
                    step="0.01"
                    value={newTransaction.amount}
                    onChange={handleInputChange}
                    placeholder="Valor"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    defaultValue={newTransaction.status}
                    onValueChange={(value) =>
                      setNewTransaction({
                        ...newTransaction,
                        status: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button onClick={handleAddTransaction}>Adicionar</Button>
                </TableCell>
              </TableRow>
              {newTransaction.type === "expense" && (
                <TableRow>
                  <TableCell colSpan={2}>
                    <Label>Parcelas (apenas para despesas)</Label>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="1"
                      max="12"
                      value={newTransaction.installments || 1}
                      onChange={(e) =>
                        setNewTransaction({
                          ...newTransaction,
                          installments: parseInt(e.target.value) || 1,
                        })
                      }
                      placeholder="Número de parcelas"
                    />
                  </TableCell>
                  <TableCell colSpan={2}>
                    <Label>Data da Transação</Label>
                  </TableCell>
                  <TableCell>
                    <DatePicker
                      value={newTransaction.transaction_date}
                      onChange={(date) =>
                        setNewTransaction({
                          ...newTransaction,
                          transaction_date: date,
                        })
                      }
                      min="2025-10-01"
                      max="2027-12-31"
                    />
                  </TableCell>
                  <TableCell colSpan={3}>
                    {(newTransaction.installments || 1) > 1 && (
                      <span className="text-sm text-muted-foreground">
                        {newTransaction.installments}x de R$ {((newTransaction.amount || 0) / (newTransaction.installments || 1)).toFixed(2)}
                      </span>
                    )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
        {/* Remove card footer */}
      </Card>
      <Dialog
        open={isDeleteConfirmationOpen}
        onOpenChange={setIsDeleteConfirmationOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta transação? Esta ação
              não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmationOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteTransaction}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Parcelas */}
      <Dialog open={showInstallmentsDialog} onOpenChange={setShowInstallmentsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Parcelas da Despesa</DialogTitle>
            <DialogDescription>
              Gerencie as parcelas desta despesa
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {transactionInstallments.map((installment) => (
              <div
                key={installment.id}
                className={`p-3 border rounded-lg flex items-center justify-between ${
                  installment.paid
                    ? "bg-green-500/20 border-green-500/50"
                    : "bg-orange-500/20 border-orange-500/50"
                }`}
              >
                <div>
                  <p className="font-medium">
                    {installment.installment_number}ª Parcela
                  </p>
                  <p className="text-sm text-muted-foreground">
                    R$ {installment.amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Vencimento: {new Date(installment.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${
                    installment.paid ? "text-green-700" : "text-orange-700"
                  }`}>
                    {installment.paid ? "✓ Paga" : "⏳ Pendente"}
                  </span>
                  {!installment.paid && (
                    <Button
                      size="sm"
                      onClick={async () => {
                        if (!selectedTransactionId) return;
                        const response = await fetch(`/api/transactions/installments/${installment.id}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ paid: true, paid_at: new Date().toISOString() }),
                        });
                        if (response.ok) {
                          // Recarregar parcelas
                          const refreshResponse = await fetch(`/api/transactions/${selectedTransactionId}/installments`);
                          if (refreshResponse.ok) {
                            const refreshed = await refreshResponse.json();
                            setTransactionInstallments(refreshed);
                          }
                        }
                      }}
                    >
                      Marcar como Paga
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowInstallmentsDialog(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Editar Transação */}
      <Dialog open={isEditTransactionDialogOpen} onOpenChange={setIsEditTransactionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Transação</DialogTitle>
            <DialogDescription>
              Edite os detalhes da transação
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editDescription">Descrição</Label>
              <Input
                id="editDescription"
                value={editTransaction.description || ""}
                onChange={(e) => setEditTransaction({ ...editTransaction, description: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editCategory">Categoria</Label>
              <Input
                id="editCategory"
                value={editTransaction.category || ""}
                onChange={(e) => setEditTransaction({ ...editTransaction, category: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editType">Tipo</Label>
              <Select
                value={editTransaction.type}
                onValueChange={(value: TransactionType) =>
                  setEditTransaction({ ...editTransaction, type: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editAmount">Valor</Label>
              <Input
                id="editAmount"
                type="number"
                step="0.01"
                value={editTransaction.amount || 0}
                onChange={(e) => setEditTransaction({ ...editTransaction, amount: parseFloat(e.target.value) || 0 })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editStatus">Status</Label>
              <Select
                value={editTransaction.status}
                onValueChange={(value) =>
                  setEditTransaction({ ...editTransaction, status: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editDate">Data</Label>
              <DatePicker
                value={editTransaction.transaction_date}
                onChange={(date) => setEditTransaction({ ...editTransaction, transaction_date: date })}
                min="2025-10-01"
                max="2027-12-31"
                className="col-span-3"
              />
            </div>
            {editTransaction.type === "expense" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editInstallments">Parcelas</Label>
                <Input
                  id="editInstallments"
                  type="number"
                  min="1"
                  max="12"
                  value={editTransaction.installments || 1}
                  onChange={(e) => setEditTransaction({ ...editTransaction, installments: parseInt(e.target.value) || 1 })}
                  className="col-span-3"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditTransactionDialogOpen(false);
                setSelectedTransaction(null);
                setEditTransaction({});
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (!selectedTransaction) return;
                try {
                  const response = await fetch(`/api/transactions/${selectedTransaction.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(editTransaction),
                  });
                  if (response.ok) {
                    // Recarregar transações
                    const refreshResponse = await fetch("/api/transactions");
                    if (refreshResponse.ok) {
                      const refreshed = await refreshResponse.json();
                      setTransactions(refreshed);
                    }
                    setIsEditTransactionDialogOpen(false);
                    setSelectedTransaction(null);
                    setEditTransaction({});
                  } else {
                    const errorData = await response.json();
                    alert(`Erro ao atualizar: ${errorData.error || 'Erro desconhecido'}`);
                  }
                } catch (error) {
                  console.error(error);
                  alert("Erro ao atualizar transação");
                }
              }}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
