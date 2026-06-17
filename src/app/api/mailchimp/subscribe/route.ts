import { type NextRequest, NextResponse } from "next/server";
import { subscribeMember } from "@/lib/mailchimp";

export async function POST(req: NextRequest) {
  const input = await req.json();
  const { status, body } = await subscribeMember(input);
  return NextResponse.json(body, { status });
}
