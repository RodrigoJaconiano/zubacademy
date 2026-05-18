export type AppNavigationItem = {
  label: string;
  href: string;
};

type GetAppNavigationParams = {
  isAdmin?: boolean;
  quizHref?: string;
};

export function getAppNavigation({
  isAdmin = false,
  quizHref = "/treinamentos",
}: GetAppNavigationParams = {}): AppNavigationItem[] {
  const items: AppNavigationItem[] = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Treinamentos", href: "/treinamentos" },
    { label: "Quiz", href: quizHref },
    { label: "Certificações", href: "/certificado" },
    { label: "Perfil", href: "/perfil" },
  ];

  if (isAdmin) {
    items.push({ label: "Admin", href: "/admin" });
  }

  return items;
}
