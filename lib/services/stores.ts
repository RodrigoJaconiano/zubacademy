import { calculateDistanceKm, type Coordinates } from "@/lib/utils/distance";

export type StoreRow = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  vacancies: number;
  applied_count: number;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

export type NearbyStore = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  vacancies: number;
  appliedCount: number;
  distanceKm: number | null;
};

export type NearbyStoresResponse = {
  stores: NearbyStore[];
  originLabel: string;
  origin: Coordinates | null;
};

export type SelectStoreResponse = {
  success: boolean;
  message: string;
  store?: {
    id: string;
    name: string;
  };
};

const MAX_DISTANCE_KM = 10;

function getErrorMessage(data: unknown, fallback: string): string {
  if (
    typeof data === "object" &&
    data !== null &&
    "message" in data &&
    typeof (data as { message?: unknown }).message === "string"
  ) {
    return (data as { message: string }).message;
  }

  return fallback;
}

export function normalizeCep(value: string) {
  return value.replace(/\D/g, "").slice(0, 8);
}

export function formatCep(value: string) {
  const numeric = normalizeCep(value);

  if (numeric.length <= 5) return numeric;

  return `${numeric.slice(0, 5)}-${numeric.slice(5)}`;
}

export function isValidCoordinate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function mapStoresByDistance(
  stores: StoreRow[],
  origin: Coordinates | null
): NearbyStore[] {
  return stores
    .filter((store) => store.is_active && store.vacancies > 0)
    .map((store) => {
      const distanceKm = origin
        ? calculateDistanceKm(origin, {
            latitude: store.latitude,
            longitude: store.longitude,
          })
        : null;

      return {
        id: store.id,
        name: store.name,
        latitude: store.latitude,
        longitude: store.longitude,
        vacancies: store.vacancies,
        appliedCount: store.applied_count,
        distanceKm,
      };
    })
    .filter((store) => {
      if (store.distanceKm === null) {
        return false;
      }

      return store.distanceKm <= MAX_DISTANCE_KM;
    })
    .sort((a, b) => {
      if (a.distanceKm === null && b.distanceKm === null) return 0;
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });
}

export async function resolveCoordinatesFromCep(cep: string): Promise<{
  coordinates: Coordinates;
  label: string;
}> {
  const normalizedCep = normalizeCep(cep);

  if (normalizedCep.length !== 8) {
    throw new Error("CEP inválido.");
  }

  const viaCepResponse = await fetch(
    `https://viacep.com.br/ws/${normalizedCep}/json/`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  if (!viaCepResponse.ok) {
    throw new Error("Não foi possível consultar o CEP.");
  }

  const viaCepData = (await viaCepResponse.json()) as {
    erro?: boolean;
    cep?: string;
    logradouro?: string;
    bairro?: string;
    localidade?: string;
    uf?: string;
  };

  if (viaCepData.erro || !viaCepData.localidade || !viaCepData.uf) {
    throw new Error("CEP não encontrado.");
  }

  const query = [
    viaCepData.logradouro,
    viaCepData.bairro,
    viaCepData.localidade,
    viaCepData.uf,
    "Brasil",
  ]
    .filter(Boolean)
    .join(", ");

  const geocodeResponse = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(
      query
    )}`,
    {
      method: "GET",
      cache: "no-store",
      headers: {
        "User-Agent": "Zubacademy/1.0",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
    }
  );

  if (!geocodeResponse.ok) {
    throw new Error("Não foi possível converter o CEP em localização.");
  }

  const geocodeData = (await geocodeResponse.json()) as Array<{
    lat?: string;
    lon?: string;
  }>;

  const firstResult = geocodeData[0];

  if (!firstResult?.lat || !firstResult?.lon) {
    throw new Error("Não encontramos lojas para essa região.");
  }

  return {
    coordinates: {
      latitude: Number(firstResult.lat),
      longitude: Number(firstResult.lon),
    },
    label: `${viaCepData.localidade} - ${viaCepData.uf}`,
  };
}

export async function fetchNearbyStores(params: {
  latitude?: number;
  longitude?: number;
  cep?: string;
}): Promise<NearbyStoresResponse> {
  const response = await fetch("/api/stores/nearby", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Não foi possível buscar as lojas.")
    );
  }

  return data as NearbyStoresResponse;
}

export async function selectStore(
  storeId: string
): Promise<SelectStoreResponse> {
  const response = await fetch("/api/stores/select", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ storeId }),
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, "Não foi possível selecionar a loja.")
    );
  }

  return data as SelectStoreResponse;
}
