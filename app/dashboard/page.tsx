import Link from "next/link";
import { redirect } from "next/navigation";

import WelcomePopup from "@/components/ui/WelcomePopup";

import PageContainer from "@/components/ui/page-container";
import Card from "@/components/ui/card";
import SectionHeading from "@/components/ui/section-heading";

import { createClient } from "@/lib/supabase/server";

import {
  getMissingProfileFields,
  type ProfileData,
} from "@/lib/utils/progress";

export const dynamic = "force-dynamic";

type RawProfileRow = {
  name?: string | null;
  phone?: string | null;
  cpf?: string | null;
  cep?: string | null;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  number?: string | number | null;
  terms_accepted?: boolean | null;
  store_id?: string | null;
  primary_store_name?: string | null;
  secondary_store_names?: string | null;
  store_selected_at?: string | null;
};

type StoreApplicationRow = {
  id: string;
  is_primary?: boolean | null;
  store_id?: string | null;
  stores?: {
    id?: string | null;
    name?: string | null;
    brand_id?: string | null;
    brands?: {
      id?: string | null;
      name?: string | null;
      slug?: string | null;
    } | null;
  } | null;
};

type ActiveCourseRow = {
  id: string;
  brand_id: string | null;
  slug: string;
  title: string;
  description: string | null;
  active: boolean | null;
};

type SuggestedTraining = {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  courseDescription: string | null;
  brandName: string;
  storeName: string;
  isPrimary: boolean;
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { data: rawProfile, error: profileError },
    { data: applications, error: applicationsError },
    { data: activeCourses, error: coursesError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "name, phone, cpf, cep, city, state, address, number, terms_accepted, store_id, primary_store_name, secondary_store_names, store_selected_at"
      )
      .eq("id", user.id)
      .maybeSingle<RawProfileRow>(),

    supabase
      .from("store_applications")
      .select(
        `
        id,
        is_primary,
        store_id,
        stores (
          id,
          name,
          brand_id,
          brands (
            id,
            name,
            slug
          )
        )
      `
      )
      .eq("user_id", user.id)
      .returns<StoreApplicationRow[]>(),

    supabase
      .from("courses")
      .select("id, brand_id, slug, title, description, active")
      .eq("active", true)
      .returns<ActiveCourseRow[]>(),
  ]);

  if (profileError || applicationsError || coursesError) {
    console.error("profileError:", profileError);
    console.error("applicationsError:", applicationsError);
    console.error("coursesError:", coursesError);

    return (
      <PageContainer>
        <Card>
          <SectionHeading
            eyebrow="Painel"
            title="Área do aluno"
            description="Não foi possível carregar seus dados agora."
          />

          <p className="text-sm text-slate-600">
            Verifique as consultas do dashboard e tente novamente em instantes.
          </p>
        </Card>
      </PageContainer>
    );
  }

  const profileRow = rawProfile ?? null;

  const selectedApplications = applications ?? [];
  const safeActiveCourses = activeCourses ?? [];

  const primaryApplication =
    selectedApplications.find((application) => application.is_primary) ?? null;

  const hasSelectedStore = Boolean(
    profileRow?.store_id || primaryApplication?.store_id
  );

  if (!hasSelectedStore) {
    redirect("/unidade");
  }

  const profile: ProfileData | null = profileRow
    ? {
        name: profileRow.name ?? null,
        phone: profileRow.phone ?? null,
        cpf: profileRow.cpf ?? null,
        cep: profileRow.cep ?? null,
        city: profileRow.city ?? null,
        state: profileRow.state ?? null,
        address: profileRow.address ?? null,
        number:
          profileRow.number === null || profileRow.number === undefined
            ? null
            : String(profileRow.number),
      }
    : null;

  const missingProfileFields = getMissingProfileFields(profile);
  const profileIncomplete = missingProfileFields.length > 0;
  const termsAccepted = Boolean(profileRow?.terms_accepted);

  if (profileIncomplete || !termsAccepted) {
    redirect("/perfil");
  }

  const primaryStoreName =
    primaryApplication?.stores?.name ??
    profileRow?.primary_store_name ??
    "Loja principal selecionada";

  const secondaryStoreNames =
    selectedApplications
      .filter((application) => !application.is_primary)
      .map((application) => application.stores?.name)
      .filter((storeName): storeName is string => Boolean(storeName)) ?? [];

  const activeCourseByBrandId = new Map<string, ActiveCourseRow>();

  for (const course of safeActiveCourses) {
    if (!course.brand_id) continue;
    activeCourseByBrandId.set(course.brand_id, course);
  }

  const suggestedTrainingByCourseId = new Map<string, SuggestedTraining>();

  const sortedApplications = [...selectedApplications].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return 0;
  });

  for (const application of sortedApplications) {
    const store = application.stores;
    const brandId = store?.brand_id;
    const course = brandId ? activeCourseByBrandId.get(brandId) : null;

    if (!store?.name || !brandId || !course) {
      continue;
    }

    if (suggestedTrainingByCourseId.has(course.id)) {
      continue;
    }

    suggestedTrainingByCourseId.set(course.id, {
      courseId: course.id,
      courseSlug: course.slug,
      courseTitle: course.title,
      courseDescription: course.description,
      brandName: store.brands?.name ?? course.title,
      storeName: store.name,
      isPrimary: Boolean(application.is_primary),
    });
  }

  const suggestedTrainings = Array.from(suggestedTrainingByCourseId.values());

  return (
    <>
      <WelcomePopup />

      <PageContainer className="space-y-8">
        <Card className="rounded-[32px] bg-[linear-gradient(135deg,rgba(239,246,255,0.95),rgba(255,255,255,0.92))]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <SectionHeading
                eyebrow="Painel do aluno"
                title="Boas-vindas!"
                description="Seu cadastro está pronto. Agora escolha um treinamento para começar."
              />

              <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                <p className="text-sm text-slate-500">Usuário logado</p>

                <p className="mt-1 font-semibold text-slate-900">
                  {profile?.name ?? user.email}
                </p>
              </div>
            </div>

            <Link
              href="/treinamentos"
              className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold !text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
            >
              Escolher treinamento
            </Link>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="rounded-[28px]">
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium text-blue-700">
                  Próximo passo
                </p>

                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  Selecione um treinamento para iniciar
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  O curso só começa depois que você escolher uma marca na página
                  de treinamentos. As sugestões são baseadas nas lojas que você
                  selecionou durante o cadastro.
                </p>
              </div>

              {suggestedTrainings.length > 0 ? (
                <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
                  <p className="text-sm font-semibold text-blue-700">
                    Treinamentos sugeridos para você
                  </p>

                  <div className="mt-4 grid gap-3">
                    {suggestedTrainings.map((item) => (
                      <Link
                        key={item.courseId}
                        href={`/treinamentos/${item.courseSlug}`}
                        className="rounded-2xl border border-blue-100 bg-white p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-sm"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {item.courseTitle}
                            </p>

                            <p className="mt-1 text-sm text-slate-600">
                              Loja: {item.storeName}
                            </p>
                          </div>

                          <span className="inline-flex w-fit rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                            {item.isPrimary
                              ? "Sugerido · Loja principal"
                              : "Sugerido · Loja secundária"}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <p className="text-sm font-semibold text-amber-700">
                    Nenhum treinamento online sugerido disponível.
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    As marcas das lojas selecionadas ainda não possuem
                    treinamento online ativo na Zubacademy. Acesse a página de
                    treinamentos para ver os cursos disponíveis ou consulte a
                    agenda de treinamento presencial.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/treinamentos"
                  className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold !text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
                >
                  Ver todos os treinamentos
                </Link>
              </div>
            </div>
          </Card>

          <div className="grid gap-6">
            <Card className="rounded-[28px]">
              <p className="text-sm font-medium text-blue-700">
                Loja principal
              </p>

              <h3 className="mt-2 text-xl font-bold text-slate-900">
                {primaryStoreName}
              </h3>

              {profileRow?.store_selected_at ? (
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Seleção registrada em{" "}
                  {new Date(profileRow.store_selected_at).toLocaleString(
                    "pt-BR"
                  )}
                  .
                </p>
              ) : (
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Esta é a loja principal vinculada ao seu cadastro.
                </p>
              )}
            </Card>

            <Card className="rounded-[28px]">
              <p className="text-sm font-medium text-blue-700">
                Lojas secundárias
              </p>

              {secondaryStoreNames.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {secondaryStoreNames.map((storeName) => (
                    <span
                      key={storeName}
                      className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                    >
                      {storeName}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Nenhuma loja secundária foi selecionada.
                </p>
              )}
            </Card>

            <Card className="rounded-[28px]">
              <p className="text-sm font-medium text-blue-700">Acesso rápido</p>

              <div className="mt-4 grid gap-3">
                <Link
                  href="/treinamentos"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  Escolher treinamento
                </Link>

                <Link
                  href="/perfil"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  Editar perfil
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
