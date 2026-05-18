import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import SectionHeading from "@/components/ui/section-heading";

export const dynamic = "force-dynamic";

type CourseRow = {
  id: string;
  brand_id: string | null;
  slug: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  youtube_video_url: string | null;
  active: boolean | null;
};

type StoreApplicationRow = {
  id: string;
  is_primary: boolean | null;
  store_id: string | null;
};

type StoreRow = {
  id: string;
  name: string;
  brand_id: string | null;
};

type BrandRow = {
  id: string;
  slug: string;
  name: string;
};

type SuggestedCourse = {
  course: CourseRow;
  reason: "primary" | "secondary";
  storeName: string;
  brandName: string;
};

function uniqueValues(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

export default async function TreinamentosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { data: applications, error: applicationsError },
    { data: courses, error: coursesError },
  ] = await Promise.all([
    supabase
      .from("store_applications")
      .select("id, is_primary, store_id")
      .eq("user_id", user.id)
      .returns<StoreApplicationRow[]>(),

    supabase
      .from("courses")
      .select(
        "id, brand_id, slug, title, description, thumbnail_url, youtube_video_url, active"
      )
      .eq("active", true)
      .order("title", { ascending: true })
      .returns<CourseRow[]>(),
  ]);

  if (applicationsError) {
    console.error("Erro ao buscar lojas selecionadas:", applicationsError);
  }

  if (coursesError) {
    console.error("Erro ao buscar treinamentos:", coursesError);

    return (
      <div className="min-h-screen bg-slate-50/70">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <Card className="rounded-[28px] p-6">
            <SectionHeading
              eyebrow="Treinamentos"
              title="Erro ao carregar treinamentos"
              description="Não foi possível carregar a lista de treinamentos disponíveis."
            />
          </Card>
        </div>
      </div>
    );
  }

  const safeApplications = applications ?? [];
  const safeCourses = courses ?? [];

  const selectedStoreIds = uniqueValues(
    safeApplications.map((application) => application.store_id)
  );

  const { data: stores, error: storesError } =
    selectedStoreIds.length > 0
      ? await supabase
          .from("stores")
          .select("id, name, brand_id")
          .in("id", selectedStoreIds)
          .returns<StoreRow[]>()
      : { data: [], error: null };

  if (storesError) {
    console.error("Erro ao buscar lojas selecionadas:", storesError);
  }

  const safeStores = stores ?? [];

  const allBrandIds = uniqueValues([
    ...safeStores.map((store) => store.brand_id),
    ...safeCourses.map((course) => course.brand_id),
  ]);

  const { data: brands, error: brandsError } =
    allBrandIds.length > 0
      ? await supabase
          .from("brands")
          .select("id, slug, name")
          .in("id", allBrandIds)
          .returns<BrandRow[]>()
      : { data: [], error: null };

  if (brandsError) {
    console.error("Erro ao buscar marcas:", brandsError);
  }

  const safeBrands = brands ?? [];

  const brandById = new Map(safeBrands.map((brand) => [brand.id, brand]));

  const applicationByStoreId = new Map(
    safeApplications
      .filter((application) => application.store_id)
      .map((application) => [application.store_id as string, application])
  );

  const selectedStoresWithBrand = safeStores.filter((store) => store.brand_id);

  const suggestedCourses: SuggestedCourse[] = [];

  for (const course of safeCourses) {
    if (!course.brand_id) {
      continue;
    }

    const matchedStore = selectedStoresWithBrand.find(
      (store) => store.brand_id === course.brand_id
    );

    if (!matchedStore) {
      continue;
    }

    const matchedApplication = applicationByStoreId.get(matchedStore.id);
    const brand = brandById.get(course.brand_id);

    suggestedCourses.push({
      course,
      reason: matchedApplication?.is_primary ? "primary" : "secondary",
      storeName: matchedStore.name,
      brandName: brand?.name ?? "Marca selecionada",
    });
  }

  const primarySuggestedCourses = suggestedCourses.filter(
    (item) => item.reason === "primary"
  );

  const secondarySuggestedCourses = suggestedCourses.filter(
    (item) => item.reason === "secondary"
  );

  const orderedSuggestedCourses = [
    ...primarySuggestedCourses,
    ...secondarySuggestedCourses,
  ];

  const suggestedCourseIds = new Set(
    orderedSuggestedCourses.map((item) => item.course.id)
  );

  const otherCourses = safeCourses.filter(
    (course) => !suggestedCourseIds.has(course.id)
  );

  return (
    <div className="min-h-screen bg-slate-50/70">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <Card className="rounded-[32px] bg-[linear-gradient(135deg,rgba(239,246,255,0.95),rgba(255,255,255,0.96))] p-6">
          <SectionHeading
            eyebrow="Treinamentos"
            title="Escolha seu treinamento"
            description="Os treinamentos sugeridos aparecem primeiro com base nas lojas que você selecionou. Você também pode acessar qualquer outro treinamento disponível."
          />
        </Card>

        <Card className="rounded-[28px] border border-red-200 bg-red-50 p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-red-700">
                Seu curso ainda não está disponível na Zubacademy?
              </p>

              <p className="mt-2 text-sm leading-6 text-red-900">
                Caso o treinamento da sua loja ainda não apareça aqui, você pode
                participar do nosso treinamento presencial. <br /><strong>Clique no botão ao
                lado para acessar a agenda e escolher uma data disponível.</strong>
              </p>
            </div>

            <a
              href="https://agenda-de-treinamento.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold !text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-md"
            >
              Ver agenda presencial
            </a>
          </div>
        </Card>

        {orderedSuggestedCourses.length > 0 ? (
          <section className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Seus treinamentos sugeridos
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Baseados na sua loja principal e nas lojas secundárias
                selecionadas.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {orderedSuggestedCourses.map(
                ({ course, reason, storeName, brandName }) => (
                  <Link
                    key={course.id}
                    href={`/treinamentos/${course.slug}`}
                    className="group block rounded-[28px] border border-blue-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
                  >
                    <div className="flex h-full flex-col justify-between gap-5">
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <Badge
                            variant={reason === "primary" ? "success" : "info"}
                          >
                            {reason === "primary"
                              ? "Sugerido · Loja principal"
                              : "Sugerido · Loja secundária"}
                          </Badge>

                          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            {brandName}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-xl font-bold text-slate-900 transition group-hover:text-blue-700">
                            {course.title}
                          </h3>

                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {course.description}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Loja vinculada
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            {storeName}
                          </p>
                        </div>
                      </div>

                      <div className="inline-flex w-fit items-center rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition group-hover:bg-blue-700">
                        Começar treinamento
                      </div>
                    </div>
                  </Link>
                )
              )}
            </div>
          </section>
        ) : (
          <Card className="rounded-[28px] border-amber-200 bg-amber-50 p-5">
            <p className="text-sm font-semibold text-amber-800">
              Nenhum treinamento sugerido encontrado.
            </p>

            <p className="mt-1 text-sm text-slate-700">
              Suas lojas foram encontradas, mas os treinamentos dessas marcas
              ainda não estão disponíveis na Zubacademy. Você pode acessar um
              treinamento disponível abaixo ou fazer o treinamento presencial
              pela agenda.
            </p>
          </Card>
        )}

        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Treinamentos disponíveis
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Estes são os treinamentos online disponíveis no momento.
            </p>
          </div>

          {otherCourses.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {otherCourses.map((course) => {
                const brand = course.brand_id
                  ? brandById.get(course.brand_id)
                  : null;

                return (
                  <Link
                    key={course.id}
                    href={`/treinamentos/${course.slug}`}
                    className="group block rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="info">Disponível</Badge>

                        {brand?.name ? (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            {brand.name}
                          </span>
                        ) : null}
                      </div>

                      <div>
                        <h3 className="text-xl font-bold text-slate-900 transition group-hover:text-blue-700">
                          {course.title}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {course.description}
                        </p>
                      </div>

                      <div className="inline-flex w-fit items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-700">
                        Ver treinamento
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <Card className="rounded-[28px] border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold text-slate-900">
                Nenhum outro treinamento disponível no momento.
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Novos treinamentos serão liberados gradualmente na Zubacademy.
                Enquanto isso, você pode consultar a agenda de treinamentos
                presenciais.
              </p>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
