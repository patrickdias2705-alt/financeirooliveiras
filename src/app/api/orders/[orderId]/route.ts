import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const updatedOrder = await request.json();
  const orderId = params.orderId;

  // Buscar pedido atual para verificar se está mudando para cancelled
  const { data: currentOrder } = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single();

  // Remover id do objeto se existir, pois não deve ser atualizado
  const { id, ...orderData } = updatedOrder;

  const { data, error } = await supabase
    .from('orders')
    .update({ ...orderData, user_uid: user.id })
    .eq('id', orderId)
    .eq('user_uid', user.id)
    .select('*, customer:customers(name)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Order not found or not authorized' }, { status: 404 })
  }

  // Se o status mudou para cancelled, retornar produtos ao estoque
  if (currentOrder && currentOrder.status !== 'cancelled' && updatedOrder.status === 'cancelled') {
    // Buscar itens do pedido
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', orderId);

    if (orderItems && orderItems.length > 0) {
      // Retornar cada produto ao estoque
      for (const item of orderItems) {
        // Buscar produto atual
        const { data: product } = await supabase
          .from('products')
          .select('in_stock')
          .eq('id', item.product_id)
          .eq('user_uid', user.id)
          .single();
        
        if (product) {
          await supabase
            .from('products')
            .update({ in_stock: product.in_stock + item.quantity })
            .eq('id', item.product_id)
            .eq('user_uid', user.id);
        }
      }
    }
  }

  return NextResponse.json(data)
}

export async function DELETE(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orderId = params.orderId;

  // First, delete related order_items
  const { error: orderItemsError } = await supabase
    .from('order_items')
    .delete()
    .eq('order_id', orderId)

  if (orderItemsError) {
    return NextResponse.json({ error: orderItemsError.message }, { status: 500 })
  }

  // Then, delete the order
  const { error: orderError } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId)
    .eq('user_uid', user.id)

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Order and related items deleted successfully' })
}
