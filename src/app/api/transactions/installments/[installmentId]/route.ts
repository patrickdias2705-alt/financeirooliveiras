import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: { installmentId: string } }
) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const installmentId = params.installmentId;
  const { paid, paid_at } = await request.json();

  // Verificar se a parcela pertence a uma transação do usuário
  const { data: installment } = await supabase
    .from('expense_installments')
    .select('transaction_id, transactions!inner(user_uid)')
    .eq('id', installmentId)
    .single();

  if (!installment || (installment as any).transactions?.user_uid !== user.id) {
    return NextResponse.json({ error: 'Installment not found or not authorized' }, { status: 404 })
  }

  // Atualizar parcela
  const { data, error } = await supabase
    .from('expense_installments')
    .update({ 
      paid: paid || false,
      paid_at: paid ? (paid_at || new Date().toISOString()) : null
    })
    .eq('id', installmentId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
