/** Traduz erros do Supabase Auth para mensagens amigáveis (sem vazar detalhes internos). */
export function authErrorMessage(
  error: { message?: string; code?: string; status?: number } | null,
): string {
  const code = error?.code ?? "";
  const msg = (error?.message ?? "").toLowerCase();

  if (code === "invalid_credentials" || msg.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }
  if (code === "email_not_confirmed" || msg.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.";
  }
  if (code === "user_already_exists" || msg.includes("already registered")) {
    return "Já existe uma conta com este e-mail.";
  }
  if (code === "weak_password") {
    return "Senha muito fraca. Use ao menos 10 caracteres com letras e números.";
  }
  if (code === "same_password") {
    return "A nova senha deve ser diferente da atual.";
  }
  if (
    code === "over_request_rate_limit" ||
    code === "over_email_send_rate_limit" ||
    error?.status === 429
  ) {
    return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  }
  if (code === "user_banned") {
    return "Esta conta está suspensa. Entre em contato com o suporte.";
  }
  return "Não foi possível concluir a operação. Tente novamente em instantes.";
}
