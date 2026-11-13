import type { Metadata } from "next";
import { ProductForm } from "../../product-form";
import { SiteShell } from "../../site-shell";

export const metadata: Metadata = {
  title: "naidista — Новый товар",
  description: "Выложить изделие в каталог naidista.",
};

export default function NewProductPage() {
  return (
    <SiteShell>
      <ProductForm />
    </SiteShell>
  );
}
