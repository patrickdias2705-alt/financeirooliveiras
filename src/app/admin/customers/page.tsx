"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2Icon,
  PlusCircle,
  Trash2,
  SearchIcon,
  FilterIcon,
  FilePenIcon,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

type Customer = {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive";
  last_order_date?: string;
  customer_status?: "ativo" | "hibernando";
};

type Order = {
  id: number;
  total_amount: number;
  status: string;
  created_at: string;
  installments?: number;
  installment_value?: number;
  payment_method?: { name: string };
  order_items: Array<{
    id: number;
    quantity: number;
    price: number;
    product: {
      id: number;
      name: string;
      price: number;
    };
  }>;
  installments_data?: Array<{
    id: number;
    installment_number: number;
    amount: number;
    due_date: string;
    paid: boolean;
    paid_at: string | null;
  }>;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerStatus, setNewCustomerStatus] = useState<
    "active" | "inactive"
  >("active");
  const [isEditCustomerDialogOpen, setIsEditCustomerDialogOpen] =
    useState(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
  });
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null
  );
  const [showOrdersDialog, setShowOrdersDialog] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch("/api/customers");
        if (!response.ok) {
          throw new Error("Failed to fetch customers");
        }
        const data = await response.json();
        
        // Buscar última compra de todos os clientes de uma vez (mais eficiente)
        try {
          const ordersResponse = await fetch("/api/orders");
          if (ordersResponse.ok) {
            const allOrders: any[] = await ordersResponse.json();
            
            // Criar mapa de última compra por cliente (já vem ordenado por data)
            const lastOrderMap = new Map<number, string>();
            
            // Como já vem ordenado, pegar apenas a primeira ocorrência de cada cliente
            allOrders.forEach((order: any) => {
              const customerId = order.customer_id;
              if (customerId && !lastOrderMap.has(customerId)) {
                lastOrderMap.set(customerId, order.created_at);
              }
            });
            
            // Aplicar status aos clientes
            const customersWithStatus = data.map((customer: Customer) => {
              const lastOrderDate = lastOrderMap.get(customer.id);
              if (lastOrderDate) {
                customer.last_order_date = lastOrderDate;
                const orderDate = new Date(lastOrderDate);
                const daysSince = Math.floor(
                  (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24)
                );
                
                if (daysSince >= 30) {
                  customer.customer_status = "hibernando";
                } else {
                  customer.customer_status = "ativo";
                }
              } else {
                customer.customer_status = "hibernando";
              }
              return customer;
            });
            
            setCustomers(customersWithStatus);
          } else {
            // Se não conseguir buscar pedidos, apenas definir status padrão
            setCustomers(data.map((c: Customer) => ({
              ...c,
              customer_status: "ativo" as const
            })));
          }
        } catch (error) {
          console.error("Error calculating customer status:", error);
          // Em caso de erro, apenas definir status padrão sem travar
          setCustomers(data.map((c: Customer) => ({
            ...c,
            customer_status: "ativo" as const
          })));
        }
      } catch (error) {
        setError((error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const handleViewOrders = async (customerId: number) => {
    setSelectedCustomerId(customerId);
    setLoadingOrders(true);
    setShowOrdersDialog(true);
    try {
      const response = await fetch(`/api/customers/${customerId}/orders`);
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }
      const orders = await response.json();
      setCustomerOrders(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      if (filters.status !== "all" && customer.status !== filters.status) {
        return false;
      }
      return (
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm)
      );
    });
  }, [customers, filters.status, searchTerm]);

  const resetSelectedCustomer = () => {
    setSelectedCustomerId(null);
    setNewCustomerName("");
    setNewCustomerEmail("");
    setNewCustomerPhone("");
    setNewCustomerStatus("active");
  };

  const handleAddCustomer = useCallback(async () => {
    try {
      if (!newCustomerName.trim() || !newCustomerEmail.trim()) {
        alert("Por favor, preencha pelo menos o nome e email do cliente.");
        return;
      }

      const newCustomer = {
        name: newCustomerName.trim(),
        email: newCustomerEmail.trim(),
        phone: newCustomerPhone.trim() || null,
        status: newCustomerStatus,
      };
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCustomer),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error creating customer");
      }

      const createdCustomer = await response.json();
      setCustomers([createdCustomer, ...customers]);
      setShowNewCustomerDialog(false);
      resetSelectedCustomer();
      // Recarregar clientes para garantir sincronização
      const refreshResponse = await fetch("/api/customers");
      if (refreshResponse.ok) {
        const refreshedCustomers = await refreshResponse.json();
        setCustomers(refreshedCustomers);
      }
    } catch (error: any) {
      console.error(error);
      alert(`Erro ao adicionar cliente: ${error.message || 'Erro desconhecido'}`);
    }
  }, [
    newCustomerName,
    newCustomerEmail,
    newCustomerPhone,
    newCustomerStatus,
    customers,
  ]);

  const handleEditCustomer = useCallback(async () => {
    if (!selectedCustomerId) return;
    try {
      if (!newCustomerName.trim() || !newCustomerEmail.trim()) {
        alert("Por favor, preencha pelo menos o nome e email do cliente.");
        return;
      }

      const updatedCustomer = {
        name: newCustomerName.trim(),
        email: newCustomerEmail.trim(),
        phone: newCustomerPhone.trim() || null,
        status: newCustomerStatus,
      };
      const response = await fetch(`/api/customers/${selectedCustomerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedCustomer),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error updating customer");
      }

      const updatedCustomerData = await response.json();
      setCustomers(
        customers.map((c) =>
          c.id === updatedCustomerData.id ? updatedCustomerData : c
        )
      );
      setIsEditCustomerDialogOpen(false);
      resetSelectedCustomer();
      // Recarregar clientes para garantir sincronização
      const refreshResponse = await fetch("/api/customers");
      if (refreshResponse.ok) {
        const refreshedCustomers = await refreshResponse.json();
        setCustomers(refreshedCustomers);
      }
    } catch (error: any) {
      console.error(error);
      alert(`Erro ao atualizar cliente: ${error.message || 'Erro desconhecido'}`);
    }
  }, [
    selectedCustomerId,
    newCustomerName,
    newCustomerEmail,
    newCustomerPhone,
    newCustomerStatus,
    customers,
  ]);

  const handleDeleteCustomer = useCallback(async () => {
    if (!customerToDelete) return;
    try {
      const response = await fetch(`/api/customers/${customerToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error deleting customer");
      }

      setCustomers(customers.filter((c) => c.id !== customerToDelete.id));
      setIsDeleteConfirmationOpen(false);
      setCustomerToDelete(null);
    } catch (error) {
      console.error(error);
    }
  }, [customerToDelete, customers]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (value: string) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      status: value,
    }));
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2Icon className="mx-auto h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Clientes</h1>
        <Card>
          <CardContent>
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className="flex flex-col gap-6 p-6">
      <CardHeader className="p-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={handleSearch}
                className="pr-8"
              />
              <SearchIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <FilterIcon className="w-4 h-4" />
                  <span>Filtros</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Filtrar por Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={filters.status === "all"}
                  onCheckedChange={() => handleFilterChange("all")}
                >
                  Todos os Status
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filters.status === "active"}
                  onCheckedChange={() => handleFilterChange("active")}
                >
                  Ativo
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filters.status === "inactive"}
                  onCheckedChange={() => handleFilterChange("inactive")}
                >
                  Inativo
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button size="sm" onClick={() => setShowNewCustomerDialog(true)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Adicionar Cliente
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Última Compra</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => {
                const statusColor = customer.customer_status === "ativo" 
                  ? "bg-green-500/20 text-green-600 border-green-500/50" 
                  : customer.customer_status === "hibernando"
                  ? "bg-orange-500/20 text-orange-600 border-orange-500/50"
                  : "bg-gray-500/20 text-gray-600 border-gray-500/50";
                
                return (
                <TableRow key={customer.id}>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${statusColor}`}>
                        {customer.customer_status === "ativo" ? "Ativo" : customer.customer_status === "hibernando" ? "Hibernando" : "Inativo"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {customer.last_order_date 
                        ? new Date(customer.last_order_date).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            timeZone: 'America/Sao_Paulo'
                          })
                        : "Nunca comprou"}
                    </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleViewOrders(customer.id)}
                          title="Ver compras"
                        >
                          <SearchIcon className="w-4 h-4" />
                          <span className="sr-only">Ver compras</span>
                        </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setSelectedCustomerId(customer.id);
                          setNewCustomerName(customer.name);
                          setNewCustomerEmail(customer.email);
                          setNewCustomerPhone(customer.phone);
                          setNewCustomerStatus(customer.status);
                          setIsEditCustomerDialogOpen(true);
                        }}
                      >
                        <FilePenIcon className="w-4 h-4" />
                          <span className="sr-only">Editar</span>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setCustomerToDelete(customer);
                          setIsDeleteConfirmationOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                          <span className="sr-only">Excluir</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        {/* Pagination can be added here if needed */}
      </CardFooter>

      <Dialog
        open={showNewCustomerDialog || isEditCustomerDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setShowNewCustomerDialog(false);
            setIsEditCustomerDialogOpen(false);
            resetSelectedCustomer();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {showNewCustomerDialog ? "Criar Novo Cliente" : "Editar Cliente"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={newCustomerEmail}
                onChange={(e) => setNewCustomerEmail(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status">Status</Label>
              <Select
                value={newCustomerStatus}
                onValueChange={(value: "active" | "inactive") =>
                  setNewCustomerStatus(value)
                }
              >
                <SelectTrigger id="status" className="col-span-3">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setShowNewCustomerDialog(false);
                setIsEditCustomerDialogOpen(false);
                resetSelectedCustomer();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={
                showNewCustomerDialog ? handleAddCustomer : handleEditCustomer
              }
            >
              {showNewCustomerDialog ? "Criar Cliente" : "Atualizar Cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDeleteConfirmationOpen}
        onOpenChange={setIsDeleteConfirmationOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          Tem certeza que deseja excluir este cliente? Esta ação não pode ser
          desfeita.
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setIsDeleteConfirmationOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteCustomer}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showOrdersDialog}
        onOpenChange={setShowOrdersDialog}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Compras do Cliente</DialogTitle>
          </DialogHeader>
          {loadingOrders ? (
            <div className="flex items-center justify-center py-8">
              <Loader2Icon className="h-8 w-8 animate-spin" />
            </div>
          ) : customerOrders.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Este cliente ainda não realizou compras.
            </p>
          ) : (
            <div className="space-y-4">
              {customerOrders.map((order) => (
                <Card key={order.id} className="border-l-4 border-l-amber-500">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          Pedido #{order.id}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'America/Sao_Paulo'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          R$ {order.total_amount.toFixed(2)}
                        </p>
                        {order.payment_method && (
                          <p className="text-xs text-muted-foreground">
                            {order.payment_method.name}
                          </p>
                        )}
                        {order.installments && order.installments > 1 && (
                          <p className="text-xs text-blue-600">
                            {order.installments}x de R$ {order.installment_value?.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm font-medium mb-2">Produtos:</p>
                      {order.order_items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center p-2 bg-muted/50 rounded"
                        >
                          <div>
                            <p className="font-medium">{item.product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Qtd: {item.quantity} x R$ {item.price.toFixed(2)}
                            </p>
                          </div>
                          <p className="font-medium">
                            R$ {(item.quantity * item.price).toFixed(2)}
                          </p>
                        </div>
                      ))}
                      {order.installments_data && order.installments_data.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-medium mb-2">Parcelas:</p>
                          <div className="grid grid-cols-2 gap-2">
                            {order.installments_data.map((installment) => (
                              <div
                                key={installment.id}
                                className={`p-2 rounded text-xs ${
                                  installment.paid
                                    ? 'bg-green-500/20 text-green-700 border border-green-500/50'
                                    : 'bg-orange-500/20 text-orange-700 border border-orange-500/50'
                                }`}
                              >
                                <p className="font-medium">
                                  {installment.installment_number}ª Parcela
                                </p>
                                <p>R$ {installment.amount.toFixed(2)}</p>
                                <p className="text-xs">
                                  Venc: {new Date(installment.due_date + 'T00:00:00-03:00').toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    timeZone: 'America/Sao_Paulo'
                                  })}
                                </p>
                                <p className="text-xs font-medium">
                                  {installment.paid ? '✓ Paga' : '⏳ Pendente'}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
