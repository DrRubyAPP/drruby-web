import { Resend } from "resend";
import { getAuthEnv } from "@/lib/auth/env";

/**
 * OTP 邮件发送封装（Resend）。
 *
 * 客户端惰性初始化，便于单测 mock；发送失败抛出可读错误，调用方据此向用户
 * 返回友好提示，不暴露内部细节。
 */
let client: Resend | null = null;

function getClient(): Resend {
  if (!client) client = new Resend(getAuthEnv().RESEND_API_KEY);
  return client;
}

export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  const { EMAIL_FROM } = getAuthEnv();
  const { error } = await getClient().emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Your DrRuby verification code",
    html: `<p>Your verification code is <strong>${otp}</strong>. It expires in 5 minutes.</p>`,
  });
  if (error) throw new Error(`Failed to send OTP email: ${error.message}`);
}
