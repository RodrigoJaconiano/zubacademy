import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { calculateDistanceKm, type Coordinates } from "@/lib/utils/distance";
import { getMissingProfileFields, type ProfileData } from "@/lib/utils/progress";

export const dynamic = "force-dynamic";

type RequestBody = {
  storeIds?: string[];
  origin?: {
    latitude?: number;
    longitude?: number;
  };
};

type StoreRecord = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  vacancies: number;
  applied_count: number;
  is_active: boolean;
};

type ProfileRow = {
  id: string;
  email?: string | null;
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
};

function isValidCoordinate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeStoreIds(storeIds: unknown): string[] {
  if (!Array.isArray(storeIds)) {
    return [];
  }

  return [...new Set(storeIds.map((id) => String(id).trim()).filter(Boolean))];
}

function getRedirectTo(profile: ProfileRow | null) {
  const profileData: ProfileData | null = profile
    ? {
        name: profile.name ?? null,
        phone: profile.phone ?? null,
        cpf: profile.cpf ?? null,
        cep: profile.cep ?? null,
        city: profile.city ?? null,
        state: profile.state ?? null,
        address: profile.address ?? null,
        number:
          profile.number === null || profile.number === undefined
            ? null
            : String(profile.number),
      }
    : null;

  const missingProfileFields = getMissingProfileFields(profileData);
  const profileIncomplete = missingProfileFields.length > 0;
  const termsAccepted = Boolean(profile?.terms_accepted);

  return profileIncomplete || !termsAccepted ? "/perfil" : "/dashboard";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    const storeIds = normalizeStoreIds(body?.storeIds);
    const origin = body?.origin;

    if (storeIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Selecione pelo menos uma loja.",
        },
        { status: 400 }
      );
    }

    if (
      !origin ||
      !isValidCoordinate(origin.latitude) ||
      !isValidCoordinate(origin.longitude)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Não foi possível identificar a localização de origem.",
        },
        { status: 400 }
      );
    }

    const userSupabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          message: "Usuário não autenticado.",
        },
        { status: 401 }
      );
    }

    const adminSupabase = createAdminClient();

    const [{ data: existingProfile, error: profileError }, { data: existingApplications, error: applicationsError }] =
      await Promise.all([
        adminSupabase
          .from("profiles")
          .select(
            "id, email, name, phone, cpf, cep, city, state, address, number, terms_accepted, store_id"
          )
          .eq("id", user.id)
          .maybeSingle<ProfileRow>(),
        adminSupabase
          .from("store_applications")
          .select("id")
          .eq("user_id", user.id)
          .limit(1),
      ]);

    if (profileError) {
      console.error("Erro ao buscar perfil antes da seleção:", profileError);

      return NextResponse.json(
        {
          success: false,
          message: "Não foi possível validar seu perfil.",
        },
        { status: 500 }
      );
    }

    if (applicationsError) {
      console.error(
        "Erro ao buscar candidaturas existentes antes da seleção:",
        applicationsError
      );

      return NextResponse.json(
        {
          success: false,
          message: "Não foi possível validar suas candidaturas.",
        },
        { status: 500 }
      );
    }

    if (existingProfile?.store_id || (existingApplications?.length ?? 0) > 0) {
      return NextResponse.json(
        {
          success: true,
          alreadySelected: true,
          message: "Suas lojas já foram selecionadas anteriormente.",
          redirectTo: getRedirectTo(existingProfile ?? null),
        },
        { status: 200 }
      );
    }

    const { data: stores, error: storesError } = await adminSupabase
      .from("stores")
      .select(
        "id, name, latitude, longitude, vacancies, applied_count, is_active"
      )
      .in("id", storeIds);

    if (storesError) {
      console.error("Erro ao buscar lojas selecionadas:", storesError);

      return NextResponse.json(
        {
          success: false,
          message: "Não foi possível validar as lojas selecionadas.",
        },
        { status: 500 }
      );
    }

    const selectedStores = (stores ?? []) as StoreRecord[];

    if (selectedStores.length !== storeIds.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Uma ou mais lojas selecionadas não foram encontradas.",
        },
        { status: 404 }
      );
    }

    const invalidStores = selectedStores.filter(
      (store) =>
        !store.is_active ||
        store.vacancies <= 0 ||
        !Number.isFinite(store.latitude) ||
        !Number.isFinite(store.longitude)
    );

    if (invalidStores.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Uma ou mais lojas selecionadas não estão disponíveis no momento.",
        },
        { status: 409 }
      );
    }

    const storesWithDistance = selectedStores
      .map((store) => ({
        ...store,
        distanceKm: calculateDistanceKm(origin as Coordinates, {
          latitude: store.latitude,
          longitude: store.longitude,
        }),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    const primaryStore = storesWithDistance[0];
    const now = new Date().toISOString();

    const { data: updatedPrimaryRows, error: updatePrimaryError } =
      await adminSupabase
        .from("stores")
        .update({
          vacancies: primaryStore.vacancies - 1,
          applied_count: primaryStore.applied_count + 1,
          updated_at: now,
        })
        .eq("id", primaryStore.id)
        .eq("is_active", true)
        .gt("vacancies", 0)
        .select("id, name, vacancies")
        .limit(1);

    if (updatePrimaryError) {
      console.error("Erro ao atualizar a loja principal:", updatePrimaryError);

      return NextResponse.json(
        {
          success: false,
          message: "Não foi possível reservar a vaga na loja principal.",
        },
        { status: 500 }
      );
    }

    const updatedPrimaryStore = updatedPrimaryRows?.[0];

    if (!updatedPrimaryStore) {
      return NextResponse.json(
        {
          success: false,
          message: "A loja principal selecionada acabou de ficar sem vagas.",
        },
        { status: 409 }
      );
    }

    const applicationRows = storesWithDistance.map((store) => ({
      user_id: user.id,
      store_id: store.id,
      is_primary: store.id === primaryStore.id,
      created_at: now,
    }));

    const { error: applicationError } = await adminSupabase
      .from("store_applications")
      .insert(applicationRows);

    if (applicationError) {
      console.error("Erro ao registrar candidaturas:", applicationError);

      await adminSupabase
        .from("stores")
        .update({
          vacancies: primaryStore.vacancies,
          applied_count: primaryStore.applied_count,
          updated_at: now,
        })
        .eq("id", primaryStore.id);

      return NextResponse.json(
        {
          success: false,
          message: "Não foi possível registrar suas candidaturas.",
        },
        { status: 500 }
      );
    }

    const profilePayload = {
      id: user.id,
      email: existingProfile?.email ?? user.email ?? null,
      name: existingProfile?.name ?? null,
      phone: existingProfile?.phone ?? null,
      cpf: existingProfile?.cpf ?? null,
      cep: existingProfile?.cep ?? null,
      city: existingProfile?.city ?? null,
      state: existingProfile?.state ?? null,
      address: existingProfile?.address ?? null,
      number:
        existingProfile?.number === null || existingProfile?.number === undefined
          ? null
          : String(existingProfile.number),
      terms_accepted: existingProfile?.terms_accepted ?? false,
      store_id: primaryStore.id,
      store_selected_at: now,
      updated_at: now,
    };

    const { data: savedProfile, error: upsertProfileError } = await adminSupabase
      .from("profiles")
      .upsert(profilePayload, { onConflict: "id" })
      .select(
        "id, email, name, phone, cpf, cep, city, state, address, number, terms_accepted, store_id"
      )
      .maybeSingle<ProfileRow>();

    if (upsertProfileError) {
      console.error(
        "Erro ao salvar a loja principal no perfil:",
        upsertProfileError
      );

      await adminSupabase
        .from("store_applications")
        .delete()
        .eq("user_id", user.id);

      await adminSupabase
        .from("stores")
        .update({
          vacancies: primaryStore.vacancies,
          applied_count: primaryStore.applied_count,
          updated_at: now,
        })
        .eq("id", primaryStore.id);

      return NextResponse.json(
        {
          success: false,
          message:
            "As candidaturas foram registradas, mas não conseguimos salvar a loja principal no seu perfil.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      alreadySelected: false,
      message: "Lojas selecionadas com sucesso.",
      redirectTo: getRedirectTo(savedProfile ?? profilePayload),
      primaryStore: {
        id: primaryStore.id,
        name: primaryStore.name,
      },
      secondaryStores: storesWithDistance
        .filter((store) => store.id !== primaryStore.id)
        .map((store) => ({
          id: store.id,
          name: store.name,
        })),
    });
  } catch (error) {
    console.error("Erro em /api/stores/select:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível salvar a seleção das lojas.",
      },
      { status: 500 }
    );
  }
}
