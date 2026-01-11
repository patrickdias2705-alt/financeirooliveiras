import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orderId = params.orderId;

  // Verificar se o pedido pertence ao usuário
  const { data: order } = await supabase
    .from('orders')
    .select('id')
    .eq('id', orderId)
    .eq('user_uid', user.id)
    .single();

  if (!order) {
    return NextResponse.json({ error: 'Order not found or not authorized' }, { status: 404 })
  }

  // Buscar parcelas
  const { data: installments, error } = await supabase
    .from('installments')
    .select('*')
    .eq('order_id', orderId)
    .order('installment_number', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(installments || [])
}
