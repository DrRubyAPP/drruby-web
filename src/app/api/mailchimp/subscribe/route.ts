import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { subscribeMember } from "@/lib/mailchimp";

export const SubscribeBody = z.object({
  email: z.email().describe("订阅邮箱"),
  firstName: z.string().optional().describe("名"),
  phone: z.string().optional().describe("电话（可选）"),
  formId: z.string().optional().describe("来源表单：home | skin | healthspan"),
  age: z.string().optional(),
  concerns: z.string().optional(),
  spend: z.string().optional(),
  winning: z.string().optional(),
});

export const SubscribeResponse = z.object({
  ok: z.boolean().optional(),
  message: z.string().optional(),
  error: z.string().optional(),
});

/**
 * Subscribe to newsletter
 * @description 将邮箱加入 Mailchimp 受众
 * @body SubscribeBody
 * @response SubscribeResponse
 * @openapi
 */
export async function POST(req: NextRequest) {
  const input = await req.json();
  const { status, body } = await subscribeMember(input);
  return NextResponse.json(body, { status });
}
