export function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  if (parseInt(digits[9]) !== check) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  return parseInt(digits[10]) === check;
}

export function validateCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(digits[i]) * weights1[i];
  let check = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (parseInt(digits[12]) !== check) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) sum += parseInt(digits[i]) * weights2[i];
  check = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return parseInt(digits[13]) === check;
}

export function validateDocument(value: string): { valid: boolean; error: string } {
  const digits = value.replace(/\D/g, '');
  if (!digits) return { valid: true, error: '' }; // empty is handled by required check
  if (digits.length <= 11) {
    if (digits.length < 11) return { valid: false, error: 'CPF deve ter 11 dígitos' };
    return validateCPF(digits)
      ? { valid: true, error: '' }
      : { valid: false, error: 'CPF inválido' };
  }
  if (digits.length < 14) return { valid: false, error: 'CNPJ deve ter 14 dígitos' };
  if (digits.length > 14) return { valid: false, error: 'Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos' };
  return validateCNPJ(digits)
    ? { valid: true, error: '' }
    : { valid: false, error: 'CNPJ inválido' };
}
