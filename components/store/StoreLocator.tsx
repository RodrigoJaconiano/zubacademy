"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import Card from "@/components/ui/card";
import Button from "@/components/ui/Button";
import TextMessage from "@/components/ui/text-message";

import CepSearchForm from "@/components/store/CepSearchForm";
import StoreList from "@/components/store/StoreList";
import {
  fetchNearbyStores,
  normalizeCep,
  selectStore,
  type NearbyStore,
} from "@/lib/services/stores";

type StoreLocatorProps = {
  userEmail?: string | null;
};

type MessageVariant = "default" | "success" | "error";

export default function StoreLocator({ userEmail }: StoreLocatorProps) {
  const router = useRouter();
  const resultsRef = useRef<HTMLDivElement | null>(null);

  const [cep, setCep] = useState("");
  const [stores, setStores] = useState<NearbyStore[]>([]);
  const [originLabel, setOriginLabel] = useState("Nenhuma região definida");
  const [isSearching, setIsSearching] = useState(false);
  const [selectingStoreId, setSelectingStoreId] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [messageVariant, setMessageVariant] =
    useState<MessageVariant>("default");

  const hasStores = useMemo(() => stores.length > 0, [stores]);

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

      setStores(data.stores);
      setOriginLabel(data.originLabel);
      setMessage(
        data.stores.length
          ? "Encontramos lojas próximas da sua localização."
          : "Não encontramos lojas com vagas em um raio de 10 km da sua localização."
      );
      setMessageVariant(data.stores.length ? "success" : "default");

      scrollToResults();
    } catch (error) {
      console.error("Erro ao buscar por geolocalização:", error);
      setMessageVariant("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível usar sua localização."
      );
      setStores([]);
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

      setStores(data.stores);
      setOriginLabel(data.originLabel);
      setMessage(
        data.stores.length
          ? "Encontramos lojas para a região do CEP informado."
          : "Não encontramos lojas com vagas em um raio de 10 km dessa região."
      );
      setMessageVariant(data.stores.length ? "success" : "default");

      scrollToResults();
    } catch (error) {
      console.error("Erro ao buscar lojas por CEP:", error);
      setMessageVariant("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível buscar lojas por CEP."
      );
      setStores([]);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSelectStore(storeId: string) {
    clearMessage();
    setSelectingStoreId(storeId);

    try {
      const data = await selectStore(storeId);

      setMessageVariant("success");
      setMessage(data.message || "Loja selecionada com sucesso.");

      router.replace("/perfil");
      router.refresh();
    } catch (error) {
      console.error("Erro ao selecionar loja:", error);
      setMessageVariant("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível selecionar a loja."
      );
    } finally {
      setSelectingStoreId(null);
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
              Escolha a loja mais próxima
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Antes de concluir seu cadastro, precisamos vincular sua conta a
              uma loja com vagas disponíveis.
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
              disabled={isSearching}
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

      <div ref={resultsRef}>
        <Card className="rounded-[28px] p-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-blue-700">
                Região consultada
              </p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">
                {originLabel}
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Apenas lojas com vagas disponíveis em um raio de 10 km aparecem
                na lista.
              </p>
            </div>

            {hasStores ? (
              <StoreList
                stores={stores}
                loading={isSearching}
                selectingStoreId={selectingStoreId}
                onSelect={handleSelectStore}
              />
            ) : (
              <StoreList
                stores={[]}
                loading={isSearching}
                selectingStoreId={selectingStoreId}
                onSelect={handleSelectStore}
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
