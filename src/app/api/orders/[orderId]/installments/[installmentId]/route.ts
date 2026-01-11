import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: { orderId: string; installmentId: string } }
) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orderId = params.orderId;
  const installmentId = params.installmentId;
  const { paid, paid_at } = await request.json();

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

  // Atualizar parcela
  const { data, error } = await supabase
    .from('installments')
    .update({ 
      paid: paid || false,
      paid_at: paid ? (paid_at || new Date().toISOString()) : null
    })
    .eq('id', installmentId)
    .eq('order_id', orderId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
