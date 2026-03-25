import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isValidCoordinate,
  mapStoresByDistance,
  normalizeCep,
  resolveCoordinatesFromCep,
  type StoreRow,
} from "@/lib/services/stores";

export const dynamic = "force-dynamic";

type RequestBody = {
  latitude?: number;
  longitude?: number;
  cep?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    const latitude = body?.latitude;
    const longitude = body?.longitude;
    const cep = normalizeCep(body?.cep ?? "");

    let origin:
      | {
          latitude: number;
          longitude: number;
        }
      | null = null;
    let originLabel = "Lojas disponíveis";

    if (isValidCoordinate(latitude) && isValidCoordinate(longitude)) {
      origin = {
        latitude,
        longitude,
      };
      originLabel = "Sua localização atual";
    } else if (cep.length === 8) {
      const resolved = await resolveCoordinatesFromCep(cep);
      origin = resolved.coordinates;
      originLabel = resolved.label;
    } else {
      return NextResponse.json(
        {
          message: "Envie sua localização atual ou um CEP válido.",
        },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    const { data, error } = await adminSupabase
      .from("stores")
      .select(
        "id, name, latitude, longitude, vacancies, applied_count, is_active, created_at, updated_at"
      )
      .eq("is_active", true)
      .gt("vacancies", 0)
      .order("name", { ascending: true });

    if (error) {
      console.error("Erro ao buscar lojas:", error);
      return NextResponse.json(
        {
          message: "Não foi possível carregar as lojas disponíveis.",
        },
        { status: 500 }
      );
    }

    const stores = (data ?? []) as StoreRow[];
    const nearbyStores = mapStoresByDistance(stores, origin);

    return NextResponse.json({
      stores: nearbyStores,
      originLabel,
      origin,
    });
  } catch (error) {
    console.error("Erro em /api/stores/nearby:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível buscar as lojas próximas.",
      },
      { status: 500 }
    );
  }
}
