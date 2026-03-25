"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import Card from "@/components/ui/card";
import Button from "@/components/ui/Button";
import TextMessage from "@/components/ui/text-message";

import CepSearchForm from "@/components/store/CepSearchForm";
import StoreList from "@/components/store/StoreList";
import SelectedStoreSummary from "@/components/store/SelectedStoreSummary";
import {
  fetchNearbyStores,
  normalizeCep,
  selectStores,
  type NearbyStore,
} from "@/lib/services/stores";
import type { Coordinates } from "@/lib/utils/distance";

type StoreLocatorProps = {
  userEmail?: string | null;
};

type MessageVariant = "default" | "success" | "error";

export default function StoreLocator({ userEmail }: StoreLocatorProps) {
  const router = useRouter();
  const resultsRef = useRef<HTMLDivElement | null>(null);

  const [cep, setCep] = useState("");
  const [stores, setStores] = useState<NearbyStore[]>([]);
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [originLabel, setOriginLabel] = useState("Nenhuma região definida");

  const [isSearching, setIsSearching] = useState(false);
  const [isSubmittingSelection, setIsSubmittingSelection] = useState(false);

  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);

  const [message, setMessage] = useState("");
  const [messageVariant, setMessageVariant] =
    useState<MessageVariant>("default");

  const hasStores = useMemo(() => stores.length > 0, [stores]);

  const selectedStores = useMemo(
    () => stores.filter((store) => selectedStoreIds.includes(store.id)),
    [stores, selectedStoreIds]
  );

  const primarySelectedStore = useMemo(() => {
    if (selectedStores.length === 0) {
      return null;
    }

    return [...selectedStores].sort((a, b) => {
      const distanceA =
        typeof a.distanceKm === "number"
          ? a.distanceKm
          : Number.POSITIVE_INFINITY;
      const distanceB =
        typeof b.distanceKm === "number"
          ? b.distanceKm
          : Number.POSITIVE_INFINITY;

      return distanceA - distanceB;
    })[0];
  }, [selectedStores]);

  function clearMessage() {
    setMessage("");
    setMessageVariant("default");
  }

  function scrollToResults() {
    window.setTimeout(() => {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }

  function resetSelection() {
    setSelectedStoreIds([]);
  }

  function handleStoresLoaded(data: {
    stores: NearbyStore[];
    originLabel: string;
    origin: Coordinates | null;
  }) {
    setStores(data.stores);
    setOrigin(data.origin);
    setOriginLabel(data.originLabel);
    resetSelection();

    setMessage(
      data.stores.length > 0
        ? "Encontramos lojas com vagas disponíveis próximas à região informada."
        : "Não encontramos lojas com vagas disponíveis em um raio de 10 km dessa região."
    );
    setMessageVariant(data.stores.length > 0 ? "success" : "default");

    scrollToResults();
  }

  async function handleUseMyLocation() {
    clearMessage();
    setIsSearching(true);

    try {
      if (!navigator.geolocation) {
        throw new Error("Seu navegador não suporta geolocalização.");
      }

      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        }
      );

      const data = await fetchNearbyStores({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      handleStoresLoaded(data);
    } catch (error) {
      console.error("Erro ao buscar por geolocalização:", error);
      setMessageVariant("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível usar sua localização."
      );
      setStores([]);
      setOrigin(null);
      setOriginLabel("Nenhuma região definida");
      resetSelection();
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSearchByCep() {
    clearMessage();

    const cleanCep = normalizeCep(cep);

    if (cleanCep.length !== 8) {
      setMessageVariant("error");
      setMessage("Digite um CEP válido com 8 números.");
      return;
    }

    setIsSearching(true);

    try {
      const data = await fetchNearbyStores({ cep: cleanCep });
      handleStoresLoaded(data);
    } catch (error) {
      console.error("Erro ao buscar lojas por CEP:", error);
      setMessageVariant("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível buscar lojas por CEP."
      );
      setStores([]);
      setOrigin(null);
      setOriginLabel("Nenhuma região definida");
      resetSelection();
    } finally {
      setIsSearching(false);
    }
  }

  function handleToggleStore(storeId: string) {
    clearMessage();

    setSelectedStoreIds((current) => {
      if (current.includes(storeId)) {
        return current.filter((id) => id !== storeId);
      }

      return [...current, storeId];
    });
  }

  async function handleConfirmSelection() {
    clearMessage();

    if (!origin) {
      setMessageVariant("error");
      setMessage("Busque sua região antes de confirmar a seleção das lojas.");
      return;
    }

    if (selectedStoreIds.length === 0) {
      setMessageVariant("error");
      setMessage("Selecione pelo menos uma loja.");
      return;
    }

    setIsSubmittingSelection(true);

    try {
      const data = await selectStores({
        storeIds: selectedStoreIds,
        origin,
      });

      setMessageVariant("success");
      setMessage(data.message || "Seleção de lojas salva com sucesso.");

      router.replace("/perfil");
      router.refresh();
    } catch (error) {
      console.error("Erro ao salvar seleção de lojas:", error);
      setMessageVariant("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a seleção das lojas."
      );
    } finally {
      setIsSubmittingSelection(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-[28px] p-6">
        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium text-blue-700">
              Etapa obrigatória
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Escolha uma ou mais lojas
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Antes de concluir seu cadastro, precisamos vincular sua conta a
              uma loja principal com vagas disponíveis. Você também pode
              selecionar lojas secundárias.
            </p>

            {userEmail ? (
              <p className="mt-2 text-sm text-slate-500">
                Conta atual: <strong>{userEmail}</strong>
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              onClick={handleUseMyLocation}
              disabled={isSearching || isSubmittingSelection}
            >
              {isSearching ? "Buscando..." : "Usar minha localização"}
            </Button>
          </div>

          <CepSearchForm
            cep={cep}
            onCepChange={(value) => {
              setCep(normalizeCep(value));
              if (messageVariant === "error") {
                clearMessage();
              }
            }}
            onSubmit={handleSearchByCep}
            loading={isSearching}
          />

          {message ? (
            <TextMessage variant={messageVariant}>{message}</TextMessage>
          ) : null}
        </div>
      </Card>

      <div ref={resultsRef} className="space-y-6">
        <Card className="rounded-[28px] p-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-blue-700">
                Região consultada
              </p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">
                {originLabel}
              </h3>
              <p className="mt-2 text-sm text-blue-700">
                Lojas com vagas disponíveis em um raio de 10km.
              </p>
              <p className="mt-2 text-sm text-red-600 font-bold">Escolha quantas lojas tiver disponibilidade para atuar e confirme sua seleção ao final da página.
                <br></br>A loja principal será a mais próxima de sua localização.
              </p>
            </div>
            <StoreList
              stores={hasStores ? stores : []}
              loading={isSearching}
              selectedStoreIds={selectedStoreIds}
              onToggleSelect={handleToggleStore}
            />
          </div>
        </Card>

        <SelectedStoreSummary
          stores={selectedStores}
          primaryStore={primarySelectedStore}
          onConfirm={handleConfirmSelection}
          loading={isSubmittingSelection}
        />
      </div>
    </div>
  );
}
