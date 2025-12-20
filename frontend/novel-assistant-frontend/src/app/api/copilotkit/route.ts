
import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  ExperimentalEmptyAdapter,
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";

// 访问的后端,还有什么其他配置嘛?
const runtime = new CopilotRuntime({
  // 端点
  remoteEndpoints: [{url: "http://localhost:8001/copilotkit"},],
  // 还可以配置agent,action...
});
const serviceAdapter = new ExperimentalEmptyAdapter();
//app文件夹下为路由,->Next.app->文件夹即路由,
//使用 POST 访问“这个文件所在路径”时，Next.js 会执行这段函数，并把它返回的 Response 作为真正的 HTTP 应答
// 这里就是访问/api/copilotkit时执行该代码

//所以当tsx中发送/api/copilotkit时就会跳转到这里,并调用后端的代码。
export const POST = async (req: NextRequest) => {
const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    // 中间层的适配器,当前表示不处理
    serviceAdapter,
    // 路由,当前表示/api/copilotkit,就是做验证的(吗?反正保持一致就好了)
    endpoint: "/api/copilotkit",
  });
return handleRequest(req);
};