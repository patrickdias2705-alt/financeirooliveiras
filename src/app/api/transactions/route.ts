import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('transactions')
    .select('*, installments, installment_value, transaction_date')
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

  const newTransaction = await request.json();
  const { installments = 1, installment_value, transaction_date, ...transactionData } = newTransaction;

  // Inserir transação
  const { data: transaction, error } = await supabase
    .from('transactions')
    .insert([
      { 
        ...transactionData, 
        installments: transactionData.type === 'expense' ? installments : 1,
        installment_value: transactionData.type === 'expense' && installments > 1 ? installment_value : null,
        transaction_date: transaction_date || new Date().toISOString().split('T')[0],
        user_uid: user.id 
      }
    ])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Se for despesa parcelada, criar parcelas
  if (transactionData.type === 'expense' && installments > 1 && transaction) {
    const installmentRecords = [];
    const baseDate = transaction_date ? new Date(transaction_date + 'T00:00:00') : new Date();
    
    for (let i = 0; i < installments; i++) {
      const dueDate = new Date(baseDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      
      installmentRecords.push({
        transaction_id: transaction.id,
        installment_number: i + 1,
        amount: installment_value || transactionData.amount / installments,
        due_date: dueDate.toISOString().split('T')[0],
        paid: false,
        paid_at: null,
      });
    }

    const { error: installmentsError } = await supabase
      .from('expense_installments')
      .insert(installmentRecords);

    if (installmentsError) {
      console.error('Error creating expense installments:', installmentsError);
      // Não falhar a transação se houver erro nas parcelas
    }
  }

  return NextResponse.json(transaction)
}
