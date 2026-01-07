import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getBrazilDate, formatBrazilDate, addMonths } from '@/lib/date-utils'

export async function GET(request: Request) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      customer_id,
      total_amount,
      user_uid,
      status,
      created_at,
      customer:customer_id (
        name
      )
      `)
    .eq('user_uid', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { customerId, paymentMethodId, products, total, installments = 1, installmentValue } = await request.json();

  try {
    // Insert the order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: customerId,
        total_amount: total,
        user_uid: user.id,
        status: 'completed',
        installments: installments,
        installment_value: installmentValue || total,
        payment_method_id: paymentMethodId
      })
      .select('*, customer:customers(name)')
      .single();

    if (orderError) {
      throw orderError;
    }

    // Insert the order items
    const orderItems = products.map((product: { id: number, quantity: number, price: number }) => ({
      order_id: orderData.id,
      product_id: product.id,
      quantity: product.quantity,
      price: product.price
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      // If there's an error inserting order items, delete the order
      await supabase.from('orders').delete().eq('id', orderData.id);
      throw itemsError;
    }

    // Insert installments if more than 1
    if (installments > 1) {
      const installmentRecords = [];
      // Usar data atual no timezone de São Paulo, Brasil (UTC-3)
      const now = getBrazilDate();
      
      for (let i = 0; i < installments; i++) {
        // Calcular data de vencimento: primeira parcela = hoje, demais = mesmo dia dos próximos meses
        let dueDate: Date;
        
        if (i === 0) {
          // Primeira parcela: data atual do Brasil
          dueDate = new Date(now);
        } else {
          // Próximas parcelas: adicionar i meses mantendo o dia
          dueDate = addMonths(now, i);
        }
        
        // Formatar data no formato YYYY-MM-DD (timezone Brasil)
        const formattedDate = formatBrazilDate(dueDate);
        
        // Data atual formatada para paid_at (primeira parcela) no timezone do Brasil
        const paidAtISO = i === 0 ? now.toISOString() : null;
        
        installmentRecords.push({
          order_id: orderData.id,
          installment_number: i + 1,
          amount: installmentValue || total / installments,
          due_date: formattedDate,
          paid: i === 0, // Primeira parcela paga
          paid_at: paidAtISO
        });
      }
      const { error: installmentsError } = await supabase
        .from('installments')
        .insert(installmentRecords);
      
      if (installmentsError) {
        console.error('Error creating installments:', installmentsError);
      }
    }

    // Insert the transaction record (primeira parcela ou valor total)
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        order_id: orderData.id,
        payment_method_id: paymentMethodId,
        amount: installments > 1 ? (installmentValue || total / installments) : total,
        user_uid: user.id,
        status: 'completed',
        category: 'selling',
        type: 'income',
        description: installments > 1 
          ? `Pagamento parcelado - Pedido #${orderData.id} (1/${installments})`
          : `Pagamento para pedido #${orderData.id}`
      });

    if (transactionError) {
      // If there's an error inserting the transaction, delete the order and order items
      await supabase.from('orders').delete().eq('id', orderData.id);
      await supabase.from('order_items').delete().eq('order_id', orderData.id);
      throw transactionError;
    }

    return NextResponse.json(orderData);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
