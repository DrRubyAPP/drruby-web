import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";

/**
 * 换发 bearer token（仅用于 Web 端从 cookie session 取得 bearer token）。
 *
 * 背景：后端数据 API 已收紧为**仅认 `Authorization: Bearer`、禁 cookie**
 * （`requireUser()`）。但 Web 端在两类场景本地没有 bearer token：
 *   - Google 整页重定向登录（回调不经客户端 fetch，捕获不到 `set-auth-token`）；
 *   - 页面刷新（内存态丢失，但 cookie session 仍在）。
 *
 * 本端点读 cookie session（仅用于换发，**不参与数据 API 鉴权**），返回其
 * `session.token`——即 bearer 插件所用的同源 session token。未登录返回 401。
 *
 * 安全边界：此端点只「把已认证的 cookie session 换成一串等价的 bearer token」，
 * 不扩大任何鉴权面；数据 API 仍然只认 bearer、不认 cookie。
 */
export async function GET() {
  const session = await getServerSession();
  if (!session?.session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ token: session.session.token });
}
