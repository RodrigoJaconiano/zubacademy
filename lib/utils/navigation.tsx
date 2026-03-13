export type AppNavigationItem = {
  label: string;
  href: string;
};

export function getAppNavigation(isAdmin = false): AppNavigationItem[] {
  const items: AppNavigationItem[] = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Curso", href: "/curso" },
    { label: "Quiz", href: "/quiz" },
    { label: "Certificado", href: "/certificado" },
    { label: "Perfil", href: "/perfil" },
  ];

  if (isAdmin) {
    items.push({ label: "Admin", href: "/admin" });
  }

  return items;
}
