// 顶级节点
import type { Metadata } from "next";
import { CopilotKit } from "@copilotkit/react-core";
import "./globals.css";
import "@copilotkit/react-ui/styles.css";
// import "../styles/base.css";
// import "../styles/mail-icon.css";
// import "../styles/copilot-custom.css";
import "../components/Sidebar/Header/Header.css";
import "../components/Sidebar/Button/Button.css";
import "../components/Sidebar/Input/Input.css";
import "../components/DocumentEdit/document-editor.css";
import "../components/Table/table-of-contents.css";

export const metadata: Metadata = {
  title: "小说助手",
  description: "大家创作愉快,除了姓铁的某个家伙",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={"antialiased"}>
        <CopilotKit runtimeUrl="/api/copilotkit">
          {children}
        </CopilotKit>
      </body>
    </html>
  );
}
