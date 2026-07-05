"use client";

"use client";

import { logoutAction } from "@/app/login/actions";
import { btn } from "@/components/ui";
import { cn } from "@/lib/utils";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        title="Chiqish"
        className={cn(btn.ghost, "!px-2 !py-1 text-xs hover:!text-rose-400 classic:hover:!text-rose-600")}
      >
        Chiqish
      </button>
    </form>
  );
}
