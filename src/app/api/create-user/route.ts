import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json()
    
    const supabase = createClient()
    
    // Criar usuário
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (authData.user) {
      // Criar perfil do usuário na tabela user_profiles
      try {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            email: email,
            name: name || email.split('@')[0],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: 'active',
            role: 'user'
          })

        if (profileError) {
          console.log('Erro ao criar perfil:', profileError)
          // Continua mesmo se houver erro ao criar perfil
        }
      } catch (error) {
        console.log('Erro ao criar perfil:', error)
        // Continua mesmo se houver erro
      }

      // Criar registro na tabela customers se necessário (mantido para compatibilidade)
      try {
        await supabase
          .from('customers')
          .insert({
            name: name || email.split('@')[0],
            email: email,
            user_uid: authData.user.id,
            status: 'active',
          })
      } catch (error) {
        // Ignora erro se já existir
        console.log('Erro ao criar customer:', error)
      }

      return NextResponse.json({
        success: true,
        message: 'Usuário criado com sucesso!',
        user: authData.user,
      })
    }

    return NextResponse.json(
      { error: 'Erro ao criar usuário' },
      { status: 500 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}


