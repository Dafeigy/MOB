import { WebWorkspace } from "@/components/web-workspace"
import { requireSession } from "@/lib/auth/require-session"

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  await requireSession()
  return <WebWorkspace>{children}</WebWorkspace>
}
