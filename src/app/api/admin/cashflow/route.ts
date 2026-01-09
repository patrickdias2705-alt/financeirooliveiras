import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Obter parâmetros de filtro de data
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  let query = supabase
    .from('transactions')
    .select('amount, created_at')
    .eq('status', 'completed')
    .eq('user_uid', user.id)
    .order('created_at', { ascending: true });

  // Aplicar filtros de data se fornecidos
  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data: transactionsData, error: transactionsError } = await query;

  if (transactionsError) {
    console.error('Error fetching cash flow data:', transactionsError);
    return NextResponse.json({ error: 'Failed to fetch cash flow data' }, { status: 500 });
  }

  const cashFlow = transactionsData?.reduce((acc, transaction) => {
    const date = new Date(transaction.created_at).toISOString().split('T')[0];
    if (acc[date]) {
      acc[date] += transaction.amount;
    } else {
      acc[date] = transaction.amount;
    }
    return acc;
  }, {} as Record<string, number>);

  return NextResponse.json({ cashFlow });
}
