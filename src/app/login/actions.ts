'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

function getErrorMessage(error: any): string {
  if (!error) return 'Erro desconhecido'
  
  // Rate limit error
  if (error.code === 'over_email_send_rate_limit' || error.status === 429) {
    const waitTime = error.message?.match(/(\d+)\s+seconds?/i)?.[1] || 'alguns'
    return `Muitas tentativas! Aguarde ${waitTime} segundos antes de tentar novamente.`
  }
  
  // Invalid credentials
  if (error.message?.includes('Invalid login credentials') || error.message?.includes('Email not confirmed')) {
    return 'Email ou senha incorretos, ou email não confirmado.'
  }
  
  // User already exists
  if (error.message?.includes('already registered') || error.message?.includes('User already registered')) {
    return 'Este email já está cadastrado. Tente fazer login.'
  }
  
  // Weak password
  if (error.message?.includes('Password')) {
    return 'Senha muito fraca. Use pelo menos 6 caracteres.'
  }
  
  return error.message || 'Erro ao processar solicitação'
}

export async function login(formData: FormData) {
  const supabase = createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  if (!data.email || !data.password) {
    redirect('/login?error=' + encodeURIComponent('Por favor, preencha email e senha'))
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword(data)

    if (error) {
      console.log('Login error:', error)
    const errorMsg = getErrorMessage(error)
    redirect('/login?error=' + encodeURIComponent(errorMsg))
    }

  if (authData?.user) {
    // Atualizar último login na tabela user_profiles
    try {
      await supabase
        .from('user_profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', authData.user.id)
    } catch (error) {
      // Ignora erro se a tabela não existir ainda ou se o perfil não existir
      console.log('Erro ao atualizar last_login:', error)
    }
    
    revalidatePath('/admin', 'layout')
    redirect('/admin')
  } else {
    redirect('/login?error=' + encodeURIComponent('Erro ao fazer login. Tente novamente.'))
  }
}

export async function signup(formData: FormData) {
  const supabase = createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  if (!data.email || !data.password) {
    redirect('/login?error=' + encodeURIComponent('Por favor, preencha email e senha'))
  }

  if (data.password.length < 6) {
    redirect('/login?error=' + encodeURIComponent('A senha deve ter pelo menos 6 caracteres'))
  }

  const { data: authData, error } = await supabase.auth.signUp(data)

    if (error) {
      console.log('Signup error:', error)
    const errorMsg = getErrorMessage(error)
    redirect('/login?error=' + encodeURIComponent(errorMsg))
    }

  // Se signup foi bem-sucedido
  if (authData?.user) {
    // Criar perfil do usuário na tabela user_profiles
    try {
      const name = data.email.split('@')[0] // Usa parte do email como nome padrão
      await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: data.email,
          name: name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'active',
          role: 'user'
        })
    } catch (profileError: any) {
      // Se o perfil já existe ou erro de RLS, apenas loga o erro
      console.log('Erro ao criar perfil (pode ser normal se já existe):', profileError)
      // Não bloqueia o cadastro se houver erro ao criar perfil
    }
    
    revalidatePath('/admin', 'layout')
    redirect('/admin')
  } else {
    redirect('/login?error=' + encodeURIComponent('Erro ao criar conta. Tente novamente.'))
  }
}

export async function logout() {
  const supabase = createClient()
  
  await supabase.auth.signOut()
  
  revalidatePath('/login', 'layout')
  redirect('/login')
}

export async function generateExampleData(user_uid: string) {
  const supabase = createClient()
}
