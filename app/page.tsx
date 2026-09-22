import { redirect } from "next/navigation";

/// Root path redirects to the default tab, mirroring the original
/// go_router shell's initial location.
export default function RootPage() {
  redirect("/wardrobe");
}
