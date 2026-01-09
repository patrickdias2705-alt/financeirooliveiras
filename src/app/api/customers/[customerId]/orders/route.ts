import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { customerId: string } }
) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const customerId = parseInt(params.customerId);

  // Buscar pedidos do cliente com itens e produtos
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select(`
      id,
      total_amount,
      status,
      created_at,
      installments,
      installment_value,
      payment_method:payment_method_id (
        name
      ),
      order_items:order_items (
        id,
        quantity,
        price,
        product:products (
          id,
          name,
          price
        )
      )
    `)
    .eq('customer_id', customerId)
    .eq('user_uid', user.id)
    .order('created_at', { ascending: false });

  if (ordersError) {
    return NextResponse.json({ error: ordersError.message }, { status: 500 })
  }

  // Buscar parcelas pendentes
  const { data: installments, error: installmentsError } = await supabase
    .from('installments')
    .select('*')
    .in('order_id', orders?.map(o => o.id) || [])
    .order('due_date', { ascending: true });

  if (installmentsError) {
    console.error('Error fetching installments:', installmentsError);
  }

  // Combinar dados
  const ordersWithInstallments = orders?.map(order => ({
    ...order,
    installments_data: installments?.filter(i => i.order_id === order.id) || []
  }));

  return NextResponse.json(ordersWithInstallments || [])
}

