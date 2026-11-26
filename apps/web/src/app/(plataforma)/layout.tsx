import type { ReactNode } from "react";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { Toaster } from "@/components/ui/sonner";

export default function LayoutDaPlataforma({ children }: { children: ReactNode }) {
	return (
		<>
			<ConvexClientProvider>{children}</ConvexClientProvider>
			<Toaster position="top-center" richColors closeButton />
		</>
	);
}
