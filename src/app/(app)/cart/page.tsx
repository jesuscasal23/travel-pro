import { requirePageAuth } from "@/lib/auth/require-page-auth";
import { CartView } from "@/components/cart/CartView";

export default async function CartPage() {
  await requirePageAuth("/cart");

  return <CartView />;
}
