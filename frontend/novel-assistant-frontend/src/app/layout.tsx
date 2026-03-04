// 顶级节点
import type { Metadata } from "next";
import "./globals.css";
import { MailProvider } from "@/contexts/MailContext";
import { SlotProvider } from "@/contexts/SlotContext";
import { PluginLoader } from "@/components/common/PluginLoader";
import { MailboxDrawer } from "@/components/mail/MailboxDrawer";
import { MailButton } from "@/components/mail/MailButton";
import { NotificationToast } from "@/components/mail/NotificationToast";

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
        <SlotProvider>
          <PluginLoader />
          <MailProvider>
            {children}
            
            {/* Global Mail UI */}
            <MailboxDrawer />
            <NotificationToast />
            
            {/* Global Floating Entry Button (Positioned Top Right) */}
            <div className="fixed top-24 right-8 z-50">
               <MailButton />
            </div>
          </MailProvider>
        </SlotProvider>
      </body>
    </html>
  );
}
