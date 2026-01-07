/**
 * Utilitários para trabalhar com datas no timezone de São Paulo, Brasil (UTC-3)
 */

/**
 * Obtém a data atual no timezone de São Paulo, Brasil
 */
export function getBrazilDate(): Date {
  const now = new Date();
  // São Paulo está em UTC-3
  // Converter para o timezone do Brasil
  const brazilOffset = -3 * 60; // UTC-3 em minutos
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const brazilTime = new Date(utc + (3600000 * brazilOffset));
  return brazilTime;
}

/**
 * Formata uma data para o formato YYYY-MM-DD no timezone do Brasil
 */
export function formatBrazilDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Adiciona meses a uma data mantendo o dia, ajustando se necessário
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const currentDay = result.getDate();
  result.setMonth(result.getMonth() + months);
  
  // Ajustar se o dia não existe no mês (ex: 31 de janeiro -> 28/29 de fevereiro)
  if (result.getDate() !== currentDay) {
    result.setDate(0); // Vai para o último dia do mês anterior
  }
  
  return result;
}

/**
 * Obtém a data atual formatada no timezone do Brasil
 */
export function getCurrentBrazilDateString(): string {
  return formatBrazilDate(getBrazilDate());
}

/**
 * Converte uma data ISO para o timezone do Brasil
 */
export function convertToBrazilDate(isoDate: string | Date): Date {
  const date = typeof isoDate === 'string' ? new Date(isoDate) : isoDate;
  const brazilOffset = -3 * 60; // UTC-3 em minutos
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utc + (3600000 * brazilOffset));
}

