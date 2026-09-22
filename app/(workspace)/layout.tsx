import { AppSidebar } from "@/components/app-sidebar"
import { WorkspaceHeader } from "@/components/workspace-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { requireSession } from "@/lib/auth/require-session"

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSession()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0 bg-muted/30">
        <WorkspaceHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
